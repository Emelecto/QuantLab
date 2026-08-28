# Nota importante: el frontend envía `Authorization: Bearer *** en requests
# autenticados. Cuando una request lleva credenciales, el navegador RECHAZA la
# respuesta si Access-Control-Allow-Origin es "*" genérico o si falta
# Access-Control-Allow-Credentials: true. Por eso:
#   - Si CORS_ORIGINS está configurado → lista blanca + credentials=true.
#   - Si NO está configurado → reflejamos el Origin del request (dinámico) +
#     credentials=true, para que el navegador acepte la respuesta.
# ---------------------------------------------------------------------------
import os
from typing import Dict, Any

from fastapi import FastAPI, Header
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from ml_scheduler import create_ml_round, evaluate_ml_rounds
from comments import router as comments_router
from social import router as social_router
from moderation import router as moderation_router
from ml_endpoints import router as ml_router
from tournaments import router as tournaments_router
from tournaments import get_supabase

import logging
logger = logging.getLogger("quantlab.worker")

_cors_env = os.environ.get("CORS_ORIGINS", "").strip()
if _cors_env:
    _cors_allow_origins = [o.strip() for o in _cors_env.split(",") if o.strip()]
else:
    _cors_allow_origins = []  # dinámico: reflejamos el Origin del request

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
                    resp.headers["Access-Control-Allow-Origin"] = "*"
                    resp.headers["Access-Control-Allow-Credentials"] = "false"
            else:
                if origin:
                    resp.headers["Access-Control-Allow-Origin"] = origin
                    resp.headers["Access-Control-Allow-Credentials"] = "true"
                else:
                    resp.headers["Access-Control-Allow-Origin"] = "*"
                    resp.headers["Access-Control-Allow-Credentials"] = "false"
            return resp

        # Requests normales
        response = await call_next(request)
        if _cors_env:
            if origin and origin in _cors_allow_origins:
                response.headers["Access-Control-Allow-Origin"] = origin
                response.headers["Access-Control-Allow-Credentials"] = "true"
            else:
                response.headers["Access-Control-Allow-Origin"] = "*"
                response.headers["Access-Control-Allow-Credentials"] = "false"
        else:
            if origin:
                response.headers["Access-Control-Allow-Origin"] = origin
                response.headers["Access-Control-Allow-Credentials"] = "true"
            else:
                response.headers["Access-Control-Allow-Origin"] = "*"
                response.headers["Access-Control-Allow-Credentials"] = "false"
        return response

app = FastAPI(title="QuantLab Worker API")
app.add_middleware(DynamicCORSMiddleware)

app.include_router(tournaments_router, prefix="")
app.include_router(comments_router, prefix="")
app.include_router(social_router, prefix="")
app.include_router(moderation_router, prefix="")
app.include_router(ml_router, prefix="/ml")

@app.get("/health")
def health() -> dict:
    """Healthcheck sin red, para el healthcheck de deploy."""
    return {"status": "ok"}

@app.get("/debug/env")
def debug_env() -> dict:
    """Diagnóstico: verifica que las variables de entorno críticas estén configuradas.
    NO expone secretos: solo confirma presencia y longitud.
    """
    url = os.environ.get("SUPABASE_URL", "")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
    jwks = os.environ.get("SUPABASE_JWKS_URL", "")
    return {
        "SUPABASE_URL_SET": bool(url),
        "SUPABASE_URL_LENGTH": len(url),
        "SUPABASE_SERVICE_ROLE_KEY_SET": bool(key),
        "SUPABASE_SERVICE_ROLE_KEY_LENGTH": len(key),
        "SUPABASE_JWKS_URL_SET": bool(jwks),
        "SUPABASE_JWKS_URL_LENGTH": len(jwks),
    }

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
    # Trim both values to avoid issues with trailing whitespace/newlines
    expected_stripped = expected.strip() if isinstance(expected, str) else expected
    if not x_scheduler_key:
        return JSONResponse(
            status_code=401,
            content={"error": "Unauthorized. Header X-Scheduler-Key ausente."},
        )
    if not isinstance(x_scheduler_key, str) or x_scheduler_key.strip() != expected_stripped:
        return JSONResponse(
            status_code=401,
            content={"error": "Unauthorized. Header X-Scheduler-Key inválido."},
        )

    import asyncio
    from datetime import datetime, timezone

    import engine

    # Cliente Supabase
    sb = get_supabase()
    if sb is None:
        return JSONResponse(
            status_code=503,
            content={"error": "Supabase no configurado (falta SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY)."},
        )

    now = datetime.now(timezone.utc)

    # Trabajo pesado (generar dataset sintético puede tardar minutos) se ejecuta
    # en un background task para no superar el timeout de gunicorn (120s) y evitar
    # el 502. El endpoint devuelve 200 inmediato; el resultado queda en logs.
    async def _run_scheduler():
        try:
            loop = asyncio.get_event_loop()
            # evaluate_ml_rounds y create_ml_round son síncronos y bloqueantes:
            # los corremos en un executor para no congelar el event loop.
            ml_evaluated = await loop.run_in_executor(
                None, lambda: evaluate_ml_rounds(sb, now)
            )
            ml_created = await loop.run_in_executor(
                None,
                lambda: create_ml_round(
                    sb, mode="sintetico", now=now, round_days=4,
                    n_activos=600, n_eras=350, n_features=50,
                    n_features_utiles=12, ic_objetivo=0.06, seed=42,
                ),
            )
            logger.info(
                f"Scheduler completado: evaluated={ml_evaluated}, created={ml_created is not None}"
            )
        except Exception as e:
            logger.exception("Error en el scheduler (background)")

    asyncio.create_task(_run_scheduler())

    return {
        "status": "ok",
        "message": "Scheduler encolado en background. Revisa los logs del worker para el resultado.",
    }

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app, host="0.0.0.0", port=int(os.environ.get("PORT", 8000))
    )