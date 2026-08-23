from typing import List, Tuple


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


import math  # noqa: E402  (import tardío para no penalizar los tests unitarios)


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


def run_backtest(config) -> dict:
    """Backtest OOS con datos REALES y walk-forward.

    Descarga OHLCV reales (Binance crypto / yfinance stock), genera señal de
    cruce de medias móviles (SMA fast/slow) y evalúa in-sample / out-of-sample
    por fold. Devuelve métricas, etiqueta de integridad y curva de equity.
    """
    # Imports diferidos: no acoplan engine a la red ni a yfinance en los tests unitarios.
    from data_feed import get_ohlcv  # noqa: F401

    df = get_ohlcv(config.asset_type, config.symbol, config.timeframe, config.start, config.end)
    if df is None or df.empty:
        raise ValueError("run_backtest: no se obtuvieron datos OHLCV reales.")

    close = df["close"].astype(float)
    n = len(close)
    if n < 5:
        raise ValueError(f"run_backtest: serie demasiado corta ({n} velas) para backtest.")

    # Ventanas SMA adaptativas al tamaño de la muestra.
    fast = max(2, n // 10)
    slow = max(fast + 1, n // 5)

    rets = close.pct_change().fillna(0.0)
    sma_fast = close.rolling(fast, min_periods=fast).mean()
    sma_slow = close.rolling(slow, min_periods=slow).mean()
    pos = (sma_fast > sma_slow).astype(float).fillna(0.0)
    # Posición del día anterior (sin look-ahead) sobre los retornos del close.
    strat = pos.shift(1).fillna(0.0) * rets

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

    metrics = {
        "sharpe_is": sharpe_is,
        "sharpe_oos": sharpe_oos,
        "deflated_sharpe_oos": float(deflated),
        "sortino": sortino,
        "maxdd": float(dd.min()),
        "winrate": float((strat > 0).mean()),
        "n_trades": int((pos.diff().fillna(0.0) != 0).sum()),
        "ret_total": float((1.0 + strat).prod() - 1.0),
        "vol": float(strat.std() * math.sqrt(252)),
    }
    # Todos los valores deben ser finitos.
    for k, v in metrics.items():
        if isinstance(v, float) and (math.isnan(v) or math.isinf(v)):
            metrics[k] = 0.0

    label = integrity_label(sharpe_is, sharpe_oos)

    return {
        "metrics": metrics,
        "integrity_label": label,
        "equity_curve": equity_curve,
        "folds_used": len(splits),
        "n_bars": n,
    }
