from typing import List, Tuple

import math  # noqa: E402  (import tardío para no penalizar los tests unitarios)
import re  # noqa: E402
from datetime import datetime  # noqa: E402


# ---------------------------------------------------------------------------
# Validación de entrada (antes de descargar datos)
# ---------------------------------------------------------------------------
def _validate_config(config) -> None:
    """Valida la entrada del usuario ANTES de descargar datos.

    Lanza ValueError con mensaje en español si la config es inválida.
    """
    # símbolo
    if not config.symbol or not config.symbol.strip():
        raise ValueError("símbolo inválido: no puede estar vacío.")
    if not re.fullmatch(r"[A-Za-z0-9.\-]+", config.symbol.strip()):
        raise ValueError(
            f"símbolo inválido: '{config.symbol}' contiene caracteres no permitidos."
        )

    # asset_type
    if (config.asset_type or "").lower() not in ("crypto", "stock"):
        raise ValueError(
            f"asset_type inválido: '{config.asset_type}'. Usa 'crypto' o 'stock'."
        )

    # comisión / slippage no negativos
    if config.commission < 0:
        raise ValueError("comisión no puede ser negativa.")
    if config.slippage < 0:
        raise ValueError("slippage no puede ser negativo.")

    # folds
    if config.folds < 2:
        raise ValueError("folds debe ser >= 2.")

    # split dentro de (10, 95)
    if not (10 < config.split < 95):
        raise ValueError("split debe estar entre 10 y 95.")

    # fechas
    if not (config.start and config.end):
        raise ValueError("Faltan las fechas start/end del rango de datos.")
    try:
        s = datetime.fromisoformat(config.start)
        e = datetime.fromisoformat(config.end)
    except ValueError:
        raise ValueError("Las fechas start/end deben tener formato YYYY-MM-DD.")
    if s >= e:
        raise ValueError("La fecha de inicio debe ser anterior a la de fin.")


# ---------------------------------------------------------------------------
# Walk-forward / integridad (lógica pura, sin red)
# ---------------------------------------------------------------------------
def walkforward_splits(n_folds: int, train_pct: float = 0.7, total: int = 1000) -> List[Tuple[range, range]]:
    """Walk-forward splits: non-overlapping (train, test) blocks, train before test.

    Used to produce honest out-of-sample (OOS) metrics and avoid overfitting.
    """
    if n_folds < 2:
        raise ValueError("n_folds must be >= 2")
    if not (0 < train_pct < 1):
        raise ValueError("train_pct must be in (0, 1)")

    test_pct = 1.0 - train_pct
    block = total // n_folds
    if block < 10:
        raise ValueError("total too small for the requested folds")
    train_len = int(block * train_pct)
    test_len = block - train_len

    splits: List[Tuple[range, range]] = []
    start = 0
    for _ in range(n_folds):
        train = range(start, start + train_len)
        test = range(start + train_len, start + train_len + test_len)
        splits.append((train, test))
        start += train_len + test_len
    return splits


def deflated_sharpe(sharpe: float, n_tests: int = 1) -> float:
    """Bailey & López de Prado deflated Sharpe ratio (simplified)."""
    if n_tests <= 1:
        return sharpe
    return sharpe - (2.0 * (n_tests - 1) / (n_tests + 1)) ** 0.5


def integrity_label(sharpe_is: float, sharpe_oos: float) -> str:
    if sharpe_is == 0:
        return "Baja"
    ratio = sharpe_oos / abs(sharpe_is)
    if ratio >= 0.7:
        return "Alta"
    if ratio >= 0.4:
        return "Media"
    return "Baja"


def _make_walkforward(n: int, folds: int, split_pct: float):
    """Walk-forward splits reales, reduciendo folds si la serie es corta.

    Usa walkforward_splits del motor; si la serie no alcanza para el número
    de folds pedido (bloque < 10 velas), reduce folds hasta encontrar un
    valor factible. Si ni con 2 folds cabe, hace un split 50/50 de respaldo.
    """
    f = folds
    while f >= 2:
        try:
            return walkforward_splits(n_folds=f, train_pct=split_pct / 100, total=n)
        except ValueError:
            f -= 1
    cut = max(1, n // 2)
    return [(range(0, cut), range(cut, n))]


def _annualized_sharpe(returns):
    """Sharpe anualizado (252 sesiones). 0.0 si no hay volatilidad (finito)."""
    r = returns.dropna()
    if len(r) == 0:
        return 0.0
    sd = r.std()
    if sd == 0 or math.isnan(sd):
        return 0.0
    return float(r.mean() / sd * math.sqrt(252))


def _parse_windows_from_code(code: str, fast: int, slow: int):
    """Permite sobreescribir fast/slow desde el 'code' (p.ej. "fast=10,slow=30").

    Si el code no especifica nada, se usan los campos fast/slow del config.
    Siempre devuelve enteros > 0 con fast < slow.
    """
    fast_cfg, slow_cfg = fast, slow
    try:
        for token in (code or "").split(","):
            token = token.strip()
            if token.startswith("fast="):
                fast_cfg = int(token.split("=")[1])
            elif token.startswith("slow="):
                slow_cfg = int(token.split("=")[1])
    except (ValueError, IndexError):
        pass  # code mal formado => ignoramos y usamos los campos del config
    if fast_cfg is None or fast_cfg < 2:
        fast_cfg = 2
    if slow_cfg is None or slow_cfg <= fast_cfg:
        slow_cfg = fast_cfg + 1
    return fast_cfg, slow_cfg


def _resolve_windows(n: int, fast_cfg: int, slow_cfg: int):
    """Ventanas SMA adaptadas a la longitud real de la serie.

    Si la muestra es demasiado corta para las ventanas pedidas, se reducen
    para que el backtest siga siendo factible (sin look-ahead).
    """
    fast = min(fast_cfg, max(2, n // 4))
    slow = min(slow_cfg, max(fast + 1, n // 2))
    if slow <= fast:  # serie muy corta: fallback adaptativo
        fast = max(2, n // 10)
        slow = max(fast + 1, n // 5)
    return fast, slow


def _build_report(metrics: dict, integrity: str) -> str:
    """Reporte en lenguaje claro (ESPAÑOL) del resultado OOS, tono honesto.

    Usa los valores REALES del run. No promete rentabilidad. Advierte riesgo
    cuando hay pocas operaciones (<10) o el drawdown es alto (<-20%).
    """
    ret = metrics["ret_total"] * 100.0       # a %
    maxdd = metrics["maxdd"] * 100.0
    sharpe = metrics["sharpe_oos"]
    n_trades = int(metrics["n_trades"])
    calmar = metrics["calmar"]

    ret_str = f"{ret:+.1f}%"
    maxdd_str = f"{maxdd:.1f}%"
    sharpe_str = f"{sharpe:.2f}"
    calmar_str = f"{calmar:.2f}" if math.isfinite(calmar) else "n/d"

    intro = (
        f"En datos que nunca viste (out-of-sample), esta estrategia habría "
        f"ganado {ret_str} con una caída máxima de {maxdd_str}. "
        f"Eso equivale a un Sharpe OOS de {sharpe_str} y un CALMAR de {calmar_str}."
    )

    warnings = []
    if n_trades < 10:
        warnings.append(
            f"OJO: solo {n_trades} operaciones => la evidencia es débil y "
            f"puede deberse al azar."
        )
    if maxdd < -20.0:
        warnings.append(
            f"Riesgo alto: el drawdown alcanzó {maxdd_str}, pérdida considerable "
            f"en el periodo de prueba."
        )
    if integrity == "Baja":
        warnings.append(
            "La integridad de la estrategia es BAJA (el Sharpe OOS no confirma "
            "el in-sample), así que no esperes que se repita."
        )

    if warnings:
        tail = " " + " ".join(warnings)
    else:
        tail = (
            " La evidencia es razonable, pero esto es solo historia: no garantiza "
            "rentabilidad futura."
        )
    return intro + tail


def run_backtest(config) -> dict:
    """Backtest OOS con datos REALES y walk-forward, con costos realistas.

    Descarga OHLCV reales (Binance crypto / yfinance stock), genera señal de
    cruce de medias móviles (SMA fast/slow) y evalúa in-sample / out-of-sample
    por fold. En cada transición de señal resta comisión + slippage (costo de
    spread implícito, usando el slippage como proxy cuando no hay order book).

    Devuelve métricas (incl. CALMAR y operaciones/año), etiqueta de integridad,
    curva de equity y un 'report' en lenguaje claro (ESPAÑOL).
    """
    _validate_config(config)  # validación de entrada antes de descargar
    # Imports diferidos: no acoplan engine a la red ni a yfinance en los tests unitarios.
    from data_feed import get_ohlcv  # noqa: F401

    df = get_ohlcv(config.asset_type, config.symbol, config.timeframe, config.start, config.end)
    if df is None or df.empty:
        raise ValueError("run_backtest: no se obtuvieron datos OHLCV reales.")

    close = df["close"].astype(float)
    n = len(close)
    if n < 5:
        raise ValueError(f"run_backtest: serie demasiado corta ({n} velas) para backtest.")

    # Ventanas SMA: desde code o desde campos fast/slow, adaptadas a la muestra.
    fast_cfg, slow_cfg = _parse_windows_from_code(config.code, config.fast, config.slow)
    fast, slow = _resolve_windows(n, fast_cfg, slow_cfg)

    rets = close.pct_change().fillna(0.0)
    sma_fast = close.rolling(fast, min_periods=fast).mean()
    sma_slow = close.rolling(slow, min_periods=slow).mean()
    pos = (sma_fast > sma_slow).astype(float).fillna(0.0)

    # --- Costos realistas por transición de señal (cada compra/venta) ---
    # commission viene en % por lado; slippage en fracción por lado.
    # No hay order book => el costo de spread implícito se modela con el
    # slippage como proxy (documentado). Cada cambio de posición paga ambos.
    cost_each = (config.commission / 100.0) + float(config.slippage)
    trade = pos.diff().abs().fillna(0.0)              # 1.0 en cada flip de señal
    # El costo se aplica en el periodo en que se mantiene la nueva posición.
    cost_series = trade.shift(1).fillna(0.0) * cost_each

    # Posición del día anterior (sin look-ahead) sobre los retornos del close,
    # menos el costo de cada transición ejecutada.
    strat = pos.shift(1).fillna(0.0) * rets - cost_series

    splits = _make_walkforward(n, config.folds, config.split)
    sharpes_is, sharpes_oos = [], []
    cum_is, cum_oos = 1.0, 1.0
    equity_curve = []
    for train, test in splits:
        tr = strat.iloc[list(train)]
        te = strat.iloc[list(test)]
        si = _annualized_sharpe(tr)
        so = _annualized_sharpe(te)
        sharpes_is.append(si)
        sharpes_oos.append(so)
        cum_is *= float((1.0 + tr).prod())
        cum_oos *= float((1.0 + te).prod())
        last_test_idx = list(test)[-1] if len(list(test)) else (n - 1)
        t = df.index[last_test_idx]
        equity_curve.append({
            "t": t.isoformat() if hasattr(t, "isoformat") else str(t),
            "is": float(cum_is),
            "oos": float(cum_oos),
        })

    sharpe_is = float(sum(sharpes_is) / len(sharpes_is)) if sharpes_is else 0.0
    sharpe_oos = float(sum(sharpes_oos) / len(sharpes_oos)) if sharpes_oos else 0.0
    deflated = deflated_sharpe(sharpe_oos, n_tests=max(1, len(splits)))

    # Métricas sobre toda la serie (estrategia completa).
    equity = (1.0 + strat).cumprod()
    peak = equity.cummax()
    dd = equity / peak - 1.0
    downside = strat[strat < 0]
    dsd = downside.std()
    sortino = float(strat.mean() / dsd * math.sqrt(252)) if (dsd and not math.isnan(dsd)) else 0.0

    # Operaciones anualizadas a partir del span real de fechas.
    try:
        span_days = (df.index[-1] - df.index[0]).days
    except Exception:
        span_days = n  # fallback: 1 barra ~ 1 día
    span_years = span_days / 365.25 if span_days > 0 else 0.0

    ret_total = float((1.0 + strat).prod() - 1.0)
    maxdd = float(dd.min())
    n_trades = int((pos.diff().fillna(0.0) != 0).sum())
    n_trades_per_year = float(n_trades / span_years) if span_years > 0 else 0.0
    # CALMAR = retorno total / |drawdown máximo| (0 si no hubo drawdown).
    calmar = float(ret_total / abs(maxdd)) if maxdd != 0 else 0.0

    metrics = {
        "sharpe_is": sharpe_is,
        "sharpe_oos": sharpe_oos,
        "deflated_sharpe_oos": float(deflated),
        "sortino": sortino,
        "maxdd": maxdd,
        "winrate": float((strat > 0).mean()),
        "n_trades": n_trades,
        "ret_total": ret_total,
        "vol": float(strat.std() * math.sqrt(252)),
        "calmar": calmar,
        "n_trades_per_year": n_trades_per_year,
    }
    # Todos los valores deben ser finitos.
    for k, v in metrics.items():
        if isinstance(v, float) and (math.isnan(v) or math.isinf(v)):
            metrics[k] = 0.0

    label = integrity_label(sharpe_is, sharpe_oos)
    # Regla de integridad: pocas operaciones => evidencia débil => 'Baja'.
    if n_trades < 10:
        label = "Baja"

    report = _build_report(metrics, label)

    return {
        "metrics": metrics,
        "integrity_label": label,
        "equity_curve": equity_curve,
        "folds_used": len(splits),
        "n_bars": n,
        "report": report,
    }
