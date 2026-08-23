"""Capa de datos REALES para QuantLab worker.

Descarga series OHLCV reales desde fuentes públicas:
  - crypto: Binance public REST klines (sin API key).
  - stock: Yahoo Finance vía yfinance.

Toda función devuelve un pandas.DataFrame con columnas
[open, high, low, close, volume] y un DatetimeIndex (nombre 'timestamp').
No se generan datos simulados bajo ninguna circunstancia: si la fuente
no responde o el símbolo no existe, se lanza una excepción clara.
"""
from __future__ import annotations

import time
from datetime import datetime, timezone
from typing import Union

import pandas as pd
import requests

try:  # yfinance es pesado; lo importamos de forma diferida en get_ohlcv.
    import yfinance as yf
except Exception:  # pragma: no cover - sólo para entornos sin yfinance
    yf = None

BINANCE_KLINES = "https://api.binance.com/api/v3/klines"
_BINANCE_LIMIT = 1000  # máximo por petición según API de Binance
_REQUEST_TIMEOUT = 30

# Mapeo timeframe -> intervalo de Binance (soportados por la API).
_BINANCE_INTERVALS = {
    "1m": "1m", "5m": "5m", "15m": "15m", "30m": "30m",
    "1h": "1h", "2h": "2h", "4h": "4h", "6h": "6h", "8h": "8h", "12h": "12h",
    "1d": "1d", "3d": "3d", "1w": "1w", "1M": "1M",
}


def _normalize_symbol(asset_type: str, symbol: str) -> str:
    """Normaliza el símbolo.

    crypto: mayúsculas y se le añade 'USDT' si no lo trae ya (BTC -> BTCUSDT).
    stock : mayúsculas, tal cual.
    """
    symbol = (symbol or "").strip().upper()
    if asset_type == "crypto":
        if not symbol.endswith("USDT"):
            symbol = symbol + "USDT"
    return symbol


def _binance_interval(timeframe: str) -> str:
    return _BINANCE_INTERVALS.get(timeframe, "1d")


def _to_ms(value: Union[str, datetime, pd.Timestamp, int, float]) -> int:
    """Convierte fecha/hora a milisegundos epoch UTC."""
    if isinstance(value, (int, float)):
        return int(value)
    if isinstance(value, str):
        value = pd.Timestamp(value)
    if isinstance(value, pd.Timestamp):
        if value.tzinfo is None:
            value = value.tz_localize("UTC")
        return int(value.timestamp() * 1000)
    if isinstance(value, datetime):
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        return int(value.timestamp() * 1000)
    raise ValueError(f"Tipo de fecha no soportado: {type(value)}")


def _fetch_binance(symbol: str, interval: str, start_ms: int, end_ms: int) -> list:
    """Descarga klines de Binance paginando de 1000 en 1000 velas."""
    rows: list = []
    cursor = start_ms
    while True:
        params = {
            "symbol": symbol,
            "interval": interval,
            "startTime": cursor,
            "endTime": end_ms,
            "limit": _BINANCE_LIMIT,
        }
        try:
            resp = requests.get(BINANCE_KLINES, params=params, timeout=_REQUEST_TIMEOUT)
        except requests.RequestException as exc:
            raise ValueError(
                f"Binance: fallo de red al consultar '{symbol}' ({interval}): {exc}"
            ) from exc

        if resp.status_code != 200:
            # Binance responde 400 para símbolos inexistentes.
            msg = ""
            try:
                msg = resp.json().get("msg", "")
            except Exception:
                msg = resp.text
            raise ValueError(
                f"Binance: no se pudo obtener '{symbol}' ({interval}). "
                f"HTTP {resp.status_code} - {msg}"
            )
        try:
            data = resp.json()
        except ValueError as exc:
            raise ValueError(
                f"Binance: respuesta no JSON para '{symbol}': {resp.text[:200]}"
            ) from exc

        if not data:
            break
        rows.extend(data)
        if len(data) < _BINANCE_LIMIT:
            break
        last_open = int(data[-1][0])
        if last_open >= end_ms:
            break
        cursor = last_open + 1
        time.sleep(0.05)  # cortesía con la API pública
    return rows


def _fetch_yfinance(symbol: str, interval: str, start, end) -> pd.DataFrame:
    if yf is None:
        raise ValueError(
            "yfinance no está instalado; no se pueden descargar datos de stock."
        )
    # yfinance sólo garantiza '1d' de forma fiable; forzamos 1d para stock.
    yf_interval = "1d" if interval not in ("1d", "1wk", "1mo") else interval
    try:
        df = yf.download(
            symbol,
            start=start,
            end=end,
            interval=yf_interval,
            auto_adjust=False,
            progress=False,
            threads=False,
        )
    except Exception as exc:  # yfinance lanza excepciones variadas en fallos de red
        raise ValueError(
            f"yfinance: fallo al descargar '{symbol}' ({yf_interval}): {exc}"
        ) from exc

    if df is None or df.empty:
        raise ValueError(
            f"yfinance: no se obtuvieron datos para '{symbol}'? Símbolo "
            f"inexistente o sin cotizaciones en el rango solicitado."
        )
    # yfinance 1.6+ devuelve MultiIndex (Price, Ticker); aplanamos al nivel campo.
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)
    return df


def get_ohlcv(
    asset_type: str,
    symbol: str,
    timeframe: str,
    start: Union[str, datetime, pd.Timestamp],
    end: Union[str, datetime, pd.Timestamp],
) -> pd.DataFrame:
    """Descarga OHLCV REALES.

    Devuelve DataFrame con columnas [open, high, low, close, volume]
    y DatetimeIndex (nombre 'timestamp'). Lanza ValueError si la fuente
    falla o el símbolo no existe.
    """
    asset_type = (asset_type or "").lower()
    timeframe = timeframe or "1d"

    if asset_type == "crypto":
        sym = _normalize_symbol("crypto", symbol)
        interval = _binance_interval(timeframe)
        start_ms = _to_ms(start)
        end_ms = _to_ms(end)
        rows = _fetch_binance(sym, interval, start_ms, end_ms)
        if not rows:
            raise ValueError(
                f"Binance: sin velas para '{sym}' ({interval}) en el rango pedido."
            )
        df = pd.DataFrame(rows)
        idx = pd.to_datetime(df[0].astype(float), unit="ms", utc=True)
        out = pd.DataFrame(
            {
                "open": df[1].astype(float).values,
                "high": df[2].astype(float).values,
                "low": df[3].astype(float).values,
                "close": df[4].astype(float).values,
                "volume": df[5].astype(float).values,
            },
            index=idx,
        )
        out.index.name = "timestamp"
        return out.sort_index()

    if asset_type == "stock":
        sym = _normalize_symbol("stock", symbol)
        raw = _fetch_yfinance(sym, timeframe, start, end)
        wanted = ["Open", "High", "Low", "Close", "Volume"]
        missing = [c for c in wanted if c not in raw.columns]
        if missing:
            raise ValueError(
                f"yfinance: faltan columnas {missing} en la respuesta de '{sym}'."
            )
        out = pd.DataFrame(
            {
                "open": raw["Open"].astype(float),
                "high": raw["High"].astype(float),
                "low": raw["Low"].astype(float),
                "close": raw["Close"].astype(float),
                "volume": raw["Volume"].astype(float),
            }
        )
        out.index = pd.to_datetime(out.index)
        out.index.name = "timestamp"
        return out.sort_index()

    raise ValueError(f"asset_type no soportado: '{asset_type}' (usa 'crypto' o 'stock').")
