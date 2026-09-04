"""API HTTP del worker de QuantLab.

Expone el motor de backtest ya validado (engine.run_backtest) vía FastAPI.

Endpoints:
  GET  /health              -> {"status": "ok"}  (sin red, para healthcheck de deploy)
  POST /backtest            -> body = StrategyConfig; devuelve el dict del motor.
  POST /backtest/validate   -> validación ligera de coherencia y seguridad del código.

CORS habilitado para que el frontend Next.js (web/) pueda invocarlo.
"""
from __future__ import annotations

import logging
import os
import re

from fastapi import FastAPI, Header, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

import engine
from schemas import StrategyConfig
from tournaments import router as tournaments_router
from comments import router as comments_router
from social import router as social_router
from moderation import router as moderation_router
from ml_endpoints import router as ml_router
from notifications import router as notifications_router
from referrals import router as referrals_router
from badges import router as badges_router
from admin import router as admin_router
import ml_persist  # scoring programado de submissions ML (evaluate_ml_rounds)

app = FastAPI(
    title="QuantLab Worker API",
    description="Backtesting OOS con datos reales (Binance / yfinance) vía engine.run_backtest.",
    version="1.0.0",
)

logger = logging.getLogger("quantlab.worker")

# ---------------------------------------------------------------------------
# CORS: por defecto abierto (refleja el Origin del request); se puede restringir
# con CORS_ORIGINS.
#
# Formato de CORS_ORIGINS: lista separada por comas, p.ej.
#   "http://localhost:3000,https://app.quantlab.io"
#
# Nota importante: el frontend envía `Authorization: Bearer <jwt>` en requests
# autenticados. Cuando una request lleva credenciales, el navegador RECHAZA la
# respuesta si Access-Control-Allow-Origin es "*" genérico o si falta
# Access-Control-Allow-Credentials: true. Por eso:
#   - Si CORS_ORIGINS está configurado → lista blanca + credentials=true.
#   - Si NO está configurado → reflejamos el Origin del request (dinámico) +
#     credentials=true, para que el navegador acepte la respuesta.
# ---------------------------------------------------------------------------
_cors_env = os.environ.get("CORS_ORIGINS", "").strip()
if _cors_env:
    _cors_allow_origins = [o.strip() for o in _cors_env.split(",") if o.strip()]
else:
    _cors_allow_origins = []  # dinámico: reflejamos el Origin

# Middleware CORS personalizado: refleja el Origin cuando no hay lista blanca,
# permitiendo siempre credenciales para que el navegador acepte requests con
# header Authorization.
from starlette.middleware.base import BaseHTTPMiddleware

class DynamicCORSMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        origin = request.headers.get("origin")

        # Preflight OPTIONS: responder directamente con los headers correctos.
        if request.method == "OPTIONS":
            from starlette.responses import Response
            resp = Response(status_code=200)
            if _cors_env:
                if origin and origin in _cors_allow_origins:
                    resp.headers["Access-Control-Allow-Origin"] = origin
                    resp.headers["Access-Control-Allow-Credentials"] = "true"
            else:
                if origin:
                    resp.headers["Access-Control-Allow-Origin"] = origin
                    resp.headers["Access-Control-Allow-Credentials"] = "true"
                else:
                    resp.headers["Access-Control-Allow-Origin"] = "*"
            resp.headers["Access-Control-Allow-Methods"] = "DELETE, GET, HEAD, OPTIONS, PATCH, POST, PUT"
            resp.headers["Access-Control-Allow-Headers"] = "*"
            resp.headers["Access-Control-Max-Age"] = "600"
            return resp

        response = await call_next(request)

        if _cors_env:
            # Lista blanca configurada: reflejar solo si el Origin está en ella.
            if origin and origin in _cors_allow_origins:
                response.headers["Access-Control-Allow-Origin"] = origin
                response.headers["Access-Control-Allow-Credentials"] = "true"
        else:
            # Sin lista blanca: reflejamos cualquier Origin (modo abierto).
            if origin:
                response.headers["Access-Control-Allow-Origin"] = origin
                response.headers["Access-Control-Allow-Credentials"] = "true"
            else:
                response.headers["Access-Control-Allow-Origin"] = "*"

        response.headers.setdefault("Access-Control-Allow-Methods", "DELETE, GET, HEAD, OPTIONS, PATCH, POST, PUT")
        response.headers.setdefault("Access-Control-Allow-Headers", "*")
        response.headers.setdefault("Access-Control-Max-Age", "600")
        return response

app.add_middleware(DynamicCORSMiddleware)


# ---------------------------------------------------------------------------
# CORS en excepciones NO manejadas: los 500 generados por Starlette saltan el
# middleware y salen SIN headers CORS → el navegador los muestra como
# "Failed to fetch" opaco. Este handler añade los headers a esas respuestas.
# ---------------------------------------------------------------------------
from starlette.exceptions import HTTPException as StarletteHTTPException


def _cors_headers_for(request: Request) -> dict:
    origin = request.headers.get("origin")
    h = {
        "Access-Control-Allow-Methods": "DELETE, GET, HEAD, OPTIONS, PATCH, POST, PUT",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Max-Age": "600",
    }
    if _cors_env:
        if origin and origin in _cors_allow_origins:
            h["Access-Control-Allow-Origin"] = origin
            h["Access-Control-Allow-Credentials"] = "true"
    elif origin:
        h["Access-Control-Allow-Origin"] = origin
        h["Access-Control-Allow-Credentials"] = "true"
    else:
        h["Access-Control-Allow-Origin"] = "*"
    return h


@app.exception_handler(StarletteHTTPException)
async def http_exception_with_cors(request: Request, exc: StarletteHTTPException):
    from starlette.responses import JSONResponse

    return JSONResponse(
        {"detail": exc.detail},
        status_code=exc.status_code,
        headers=_cors_headers_for(request),
    )


@app.exception_handler(Exception)
async def unhandled_exception_with_cors(request: Request, exc: Exception):
    # Log completo en Render; al cliente devolvemos el mensaje REAL para poder
    # diagnosticar (antes se envolvía en ExceptionGroup de anyio y era opaco).
    logger.exception("Unhandled error en %s %s", request.method, request.url.path)

    # Desenvolver ExceptionGroup (anyio/TaskGroup) para exponer la sub-excepción.
    def _unwrap(e):
        if hasattr(e, "exceptions") and e.exceptions:
            return _unwrap(e.exceptions[0])
        return e

    real = _unwrap(exc)
    detail = f"{type(real).__name__}: {real}"[:300]

    from starlette.responses import JSONResponse

    return JSONResponse(
        {"detail": detail},
        status_code=500,
        headers=_cors_headers_for(request),
    )

# Router de torneos + marketplace + QP + social (follows / actividad)
app.include_router(tournaments_router)
app.include_router(comments_router)
app.include_router(social_router)
app.include_router(moderation_router)
app.include_router(ml_router)
app.include_router(notifications_router)
app.include_router(referrals_router)
app.include_router(badges_router)
app.include_router(admin_router)

# Timeframes soportados por la fuente de datos (Binance / yfinance).
_ALLOWED_TIMEFRAMES = {
    "1m", "5m", "15m", "30m", "1h", "2h", "4h", "6h", "8h", "12h",
    "1d", "3d", "1w", "1M", "1wk", "1mo",
}

# Patrones de código peligrosos que no permitimos en una StrategyConfig.
_DANGEROUS_PATTERNS = [
    "import os",
    "import sys",
    "import subprocess",
    "subprocess",
    "__import__",
    "eval(",
    "exec(",
    "compile(",
    "os.system",
    "open(",
    "input(",
]


def validate_strategy(config: StrategyConfig) -> dict:
    """Valida coherencia símbolo/activo y ausencia de código peligroso.

    Devuelve {"valid": bool, "warnings": [...]}.
    'valid' es False solo si hay algo bloqueante (código peligroso o
    asset_type inválido). Las incoherencias de símbolo/timeframe se reportan
    como 'warnings' pero no invalidan la configuración (el motor las tolera).
    """
    warnings: list[str] = []
    valid = True

    code_lower = (config.code or "").lower()
    for pat in _DANGEROUS_PATTERNS:
        if pat in code_lower:
            valid = False
            warnings.append(f"Código peligroso detectado: '{pat}' no está permitido.")

    asset = (config.asset_type or "").lower()
    if asset not in ("crypto", "stock", "etf"):
        valid = False
        warnings.append(
            f"asset_type inválido: '{config.asset_type}'. Usa 'crypto', 'stock' o 'etf'."
        )
    else:
        symbol = (config.symbol or "").strip().upper()
        if asset == "crypto":
            # Se tolera sin 'USDT' porque el motor lo normaliza, pero advertimos.
            if not re.fullmatch(r"[A-Z0-9]+USDT", symbol):
                warnings.append(
                    f"Símbolo crypto '{config.symbol}' no termina en USDT; "
                    "el motor lo normalizará (p.ej. BTC -> BTCUSDT)."
                )
        elif asset in ("stock", "etf"):
            if symbol.endswith("USDT"):
                warnings.append(
                    f"Símbolo de stock '{config.symbol}' termina en USDT; "
                    "probablemente es un par crypto, no una acción."
                )
            if not re.fullmatch(r"[A-Z][A-Z0-9.\-]*", symbol):
                warnings.append(
                    f"Símbolo de stock '{config.symbol}' tiene formato inusual."
                )

    tf = (config.timeframe or "").strip()
    if tf not in _ALLOWED_TIMEFRAMES:
        warnings.append(
            f"timeframe '{config.timeframe}' no está en la lista estándar; "
            "la fuente de datos podría no soportarlo."
        )

    if not (config.start and config.end):
        warnings.append("Faltan las fechas start/end del rango de datos.")

    return {"valid": valid, "warnings": warnings}


def _validate_config(config: StrategyConfig) -> None:
    """Valida la entrada del usuario ANTES de descargar datos.

    Delega en engine._validate_config (única fuente de verdad).
    """
    engine._validate_config(config)


@app.get("/health")
def health() -> dict:
    """Healthcheck sin red, para el deploy."""
    return {"status": "ok"}


@app.get("/debug/env")
def debug_env() -> dict:
    """Diagnóstico: verifica que las variables de entorno críticas estén configuradas.
    NO expone secretos: solo confirma presencia y longitud."""
    import os
    url = os.environ.get("SUPABASE_URL", "")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
    jwks = os.environ.get("SUPABASE_JWKS_URL", "")
    return {
        "SUPABASE_URL_set": bool(url),
        "SUPABASE_URL_prefix": url[:8] if url else "",
        "SUPABASE_SERVICE_ROLE_KEY_set": bool(key),
        "SUPABASE_SERVICE_ROLE_KEY_len": len(key),
        "SUPABASE_JWKS_URL_set": bool(jwks),
        "JWKS_url": _get_jwks_url_safe(),
    }


def _get_jwks_url_safe() -> str:
    """Obtiene la URL del JWKS sin lanzar, para diagnóstico."""
    import os
    jwks = os.environ.get("SUPABASE_JWKS_URL")
    if jwks:
        return jwks
    url = os.environ.get("SUPABASE_URL", "").strip().rstrip("/")
    if url:
        return f"{url}/auth/v1/.well-known/jwks.json"
    return "(no configurada)"


@app.get("/debug/jwks")
def debug_jwks() -> dict:
    """Diagnóstico: verifica conectividad con el JWKS de Supabase."""
    import os
    url = os.environ.get("SUPABASE_URL", "").strip().rstrip("/")
    jwks_url = os.environ.get("SUPABASE_JWKS_URL", "") or (f"{url}/auth/v1/.well-known/jwks.json" if url else "")
    
    if not jwks_url:
        return {"ok": False, "error": "SUPABASE_URL no configurada"}
    
    try:
        from auth import _get_jwks_url, _fetch_jwks
        jwks_fetched = _fetch_jwks()
        keys = jwks_fetched.get("keys", [])
        return {
            "ok": True,
            "url": jwks_url,
            "keys_count": len(keys),
            "kids": [k.get("kid") for k in keys[:5]],
        }
    except Exception as e:
        return {"ok": False, "error": str(e)}



@app.post("/backtest")
def backtest(config: StrategyConfig) -> dict:
    """Ejecuta un backtest OOS real y devuelve el dict del motor.

    En caso de error de validación/descarga/datos (ValueError) devuelve 400
    con {"error": mensaje_claro}.
    """
    try:
        _validate_config(config)
        result = engine.run_backtest(config)
        return result
    except ValueError as exc:
        # Errores de validación, red o datos (Binance, yfinance, símbolo...).
        return JSONResponse(status_code=400, content={"error": str(exc)})
    except Exception as exc:  # noqa: BLE001 - no queremos romper la API con 500 crudo
        return JSONResponse(
            status_code=500,
            content={"error": f"Error interno del motor de backtest: {exc}"},
        )


@app.post("/backtest/validate")
def validate(config: StrategyConfig) -> dict:
    """Validación ligera de coherencia y seguridad de una StrategyConfig."""
    return validate_strategy(config)


# ---------------------------------------------------------------------------
# Scheduler endpoint: crea torneo semanal + evalúa cerrados.
# Protegido por X-Scheduler-Key.
# ---------------------------------------------------------------------------
@app.post("/scheduler/run")
async def scheduler_run(
    x_scheduler_key: str | None = Header(None),
) -> dict:
    """Ejecuta el scheduler de torneos: create + evaluate.

    Header requerido: X-Scheduler-Key
    Variable de entorno: SCHEDULER_KEY
    """
    expected = os.environ.get("SCHEDULER_KEY")
    if not expected:
        return JSONResponse(
            status_code=503,
            content={"error": "Scheduler no configurado (falta SCHEDULER_KEY)."},
        )
    if not x_scheduler_key or x_scheduler_key != expected:
        return JSONResponse(
            status_code=401,
            content={"error": "Unauthorized. Header X-Scheduler-Key inválido o ausente."},
        )

    import asyncio
    from datetime import datetime, timezone

    import engine

    # Crear cliente supabase
    import os as _os
    from supabase import create_client

    url = _os.environ.get("SUPABASE_URL")
    key = _os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        return JSONResponse(
            status_code=503,
            content={"error": "Supabase no configurado."},
        )
    sb = create_client(url, key)

    now = datetime.now(timezone.utc)

    # Trabajo pesado (generar dataset sintético puede tardar minutos) se ejecuta
    # en un background task para no superar el timeout de gunicorn (120s) y evitar
    # el 502. El endpoint devuelve 200 inmediato.
    async def _run_scheduler():
        loop = asyncio.get_event_loop()
        try:
            # Torneos de código
            tournament = await loop.run_in_executor(
                None, lambda: create_weekly_tournament(sb, now)
            )
            created_id = tournament.get("id") if tournament else None
            evaluated = await loop.run_in_executor(
                None, lambda: evaluate_tournaments(sb, engine, now)
            )
            signals_generated = 0
            try:
                signals_generated = await loop.run_in_executor(
                    None, lambda: generate_weekly_signals(sb, now)
                )
            except Exception as e:  # noqa: BLE001
                logger.warning(f"generate_weekly_signals falló: {e}")

            # Rondas ML: puntuar submissions pendientes.
            # (la GENERACIÓN de datasets la hace GitHub Actions en ubuntu-latest,
            #  con 7GB de RAM; aquí solo servimos + puntuamos. create_ml_round no
            #  existe en este worker, por lo que no se crea nada aquí.)
            ml_evaluated = 0
            try:
                ml_evaluated = await loop.run_in_executor(
                    None, lambda: ml_persist.evaluate_ml_rounds(sb, now)
                )
            except Exception as e:  # noqa: BLE001
                logger.warning(f"Scheduler ML falló (evaluate): {e}")
            logger.info(
                f"Scheduler completado: created={created_id}, "
                f"ml_evaluated={ml_evaluated}"
            )
        except Exception:
            logger.exception("Error en el scheduler (background)")

    asyncio.create_task(_run_scheduler())

    return {
        "status": "ok",
        "message": "Scheduler encolado en background. Revisa los logs del worker para el resultado.",
    }


@app.post("/scheduler/evaluate")
async def scheduler_evaluate(
    x_scheduler_key: str | None = Header(None),
    sync: bool = Query(False, description="Si true, ejecuta el scoring SINCRONO dentro del request (no background). Necesario en Render plan free donde los background tasks no persisten."), ) -> dict:
    """Evalua/puntua submissions ML en estado pending.

    La generacion de datasets se hace en GitHub Actions (mayor RAM, no se duerme)
    y se sube a Supabase Storage. Este endpoint solo puntua submissions pendientes.

    En Render plan FREE los background tasks (asyncio.create_task) se pierden al
    terminar el request. Usa ?sync=true para forzar ejecucion sincrona: el request
    dura el scoring (max ~120s timeout) y garantiza que se ejecute.
    """
    expected = os.environ.get("SCHEDULER_KEY")
    if not expected:
        return JSONResponse(
            status_code=503,
            content={"error": "Scheduler no configurado (falta SCHEDULER_KEY)."},
        )
    if not x_scheduler_key or x_scheduler_key != expected:
        return JSONResponse(
            status_code=401,
            content={"error": "Unauthorized. Header X-Scheduler-Key inválido o ausente."},
        )

    import asyncio
    from datetime import datetime, timezone

    import engine

    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        return JSONResponse(
            status_code=503,
            content={"error": "Supabase no configurado."},
        )
    from supabase import create_client

    sb = create_client(url, key)
    now = datetime.now(timezone.utc)

    async def _run_eval():
        loop = asyncio.get_event_loop()
        try:
            evaluated = await loop.run_in_executor(
                None, lambda: ml_persist.evaluate_ml_rounds(sb, now)
            )
            logger.info(f"Evaluacion ML completada: {evaluated} submissions.")
        except Exception:  # noqa: BLE001
            logger.exception("Error en la evaluacion ML (background)")

    if sync:
        loop = asyncio.get_event_loop()
        try:
            evaluated = await loop.run_in_executor(
                None, lambda: ml_persist.evaluate_ml_rounds(sb, now)
            )
            return {
                "status": "ok",
                "mode": "sync",
                "evaluated": evaluated,
                "message": "Scoring ML ejecutado sincronamente.",
            }
        except Exception as e:  # noqa: BLE001
            logger.exception("Error en evaluacion ML (sync)")
            return JSONResponse(
                status_code=500,
                content={"error": "Error en el scoring ML (sync)", "detail": str(e)[:300]},
            )

    asyncio.create_task(_run_eval())
    return {
        "status": "ok",
        "mode": "background",
        "message": "Evaluacion encolada en background. Usa ?sync=true en plan free de Render.",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
