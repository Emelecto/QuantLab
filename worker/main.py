"""API HTTP del worker de QuantLab.

Expone el motor de backtest ya validado (engine.run_backtest) vía FastAPI.

Endpoints:
  GET  /health              -> {"status": "ok"}  (sin red, para healthcheck de deploy)
  POST /backtest            -> body = StrategyConfig; devuelve el dict del motor.
  POST /backtest/validate   -> validación ligera de coherencia y seguridad del código.

CORS habilitado para que el frontend Next.js (web/) pueda invocarlo.
"""
from __future__ import annotations

import os
import re

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

import engine
from schemas import StrategyConfig

app = FastAPI(
    title="QuantLab Worker API",
    description="Backtesting OOS con datos reales (Binance / yfinance) vía engine.run_backtest.",
    version="1.0.0",
)

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


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
