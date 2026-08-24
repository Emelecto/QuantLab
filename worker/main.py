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

from fastapi import FastAPI, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

import engine
from schemas import StrategyConfig
from tournaments import router as tournaments_router

app = FastAPI(
    title="QuantLab Worker API",
    description="Backtesting OOS con datos reales (Binance / yfinance) vía engine.run_backtest.",
    version="1.0.0",
)

logger = logging.getLogger("quantlab.worker")

# ---------------------------------------------------------------------------
# CORS: por defecto abierto ("*"); se puede restringir con CORS_ORIGINS.
# Formato de CORS_ORIGINS: lista separada por comas, p.ej. "http://localhost:3000,https://app.quantlab.io"
# ---------------------------------------------------------------------------
_cors_env = os.environ.get("CORS_ORIGINS", "*").strip()
if _cors_env and _cors_env != "*":
    allow_origins = [o.strip() for o in _cors_env.split(",") if o.strip()]
    allow_credentials = True
else:
    allow_origins = ["*"]
    allow_credentials = False

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Router de torneos + marketplace + QP
app.include_router(tournaments_router)

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
    if asset not in ("crypto", "stock"):
        valid = False
        warnings.append(
            f"asset_type inválido: '{config.asset_type}'. Usa 'crypto' o 'stock'."
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
        elif asset == "stock":
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

    from datetime import datetime, timezone

    import engine
    from scheduler import create_weekly_tournament, evaluate_tournaments, generate_weekly_signals

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

    # Crear torneo semanal
    tournament = create_weekly_tournament(sb, now)
    created_id = tournament.get("id") if tournament else None

    # Evaluar torneos cerrados
    evaluated = evaluate_tournaments(sb, engine, now)

    # Señales semanales para estrategias publicadas del marketplace
    signals_generated = 0
    try:
        signals_generated = generate_weekly_signals(sb, now)
    except Exception as e:  # noqa: BLE001
        logger.warning(f"generate_weekly_signals falló: {e}")

    return {
        "status": "ok",
        "tournament_created": created_id,
        "tournaments_evaluated": evaluated,
        "signals_generated": signals_generated,
        "timestamp": now.isoformat(),
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
