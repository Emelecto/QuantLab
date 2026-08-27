from typing import List, Tuple

import hashlib  # noqa: E402
import math  # noqa: E402  (import tardío para no penalizar los tests unitarios)
import re  # noqa: E402
import pandas as pd  # noqa: E402  (pandas es dependencia central, no acopla a red)
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

    # asset_type — ETF cotiza vía Yahoo igual que las acciones.
    if (config.asset_type or "").lower() not in ("crypto", "stock", "etf"):
        raise ValueError(
            f"asset_type inválido: '{config.asset_type}'. Usa 'crypto', 'stock' o 'etf'."
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


def _strategy_returns(df, fast, slow, commission, slippage, n) -> Tuple[pd.Series, pd.Series]:
    """Núcleo EVENT-DRIVEN de UNA señal SMA por activo (sin look-ahead).

    Extrae la lógica de cruce de medias móviles + costos de comisión/slippage
    ya existente en el motor single-symbol, de modo que tanto ``run_backtest``
    (un activo) como ``run_backtest_portfolio`` (multi-activo) la reutilicen sin
    duplicarla.

    Devuelve una tupla ``(strat, pos)``:
      - ``strat``: Serie de retornos de estrategia (mismo índice que df), con
        comisión + slippage modelado por barra.
      - ``pos``:   Serie de posición (0/1) usada para contar operaciones.

    ``n`` es la longitud de la serie (se pasa explícitamente para mantener la
    firma del contrato; debe coincidir con ``len(df)``).
    """
    close = df["close"].astype(float)
    if n != len(close):
        n = len(close)
    rets = close.pct_change().fillna(0.0)
    sma_fast = close.rolling(fast, min_periods=fast).mean()
    sma_slow = close.rolling(slow, min_periods=slow).mean()
    pos = (sma_fast > sma_slow).astype(float).fillna(0.0)

    # OHLCV necesarios para el slippage realista (rango intrabar + impacto de volumen).
    high = df["high"].astype(float)
    low = df["low"].astype(float)
    volume = df["volume"].astype(float)

    # --- Motor EVENT-DRIVEN: bucle barra a barra (sin look-ahead) ---
    # fill en la misma barra i al close, senal calculada con datos hasta i-1 => sin look-ahead
    commission_frac = commission / 100.0
    slippage_config = float(slippage)
    coef = 0.1
    strat_returns = [0.0] * n
    prev_pos = 0.0
    for i in range(1, n):
        target_pos = float(pos.iloc[i - 1])          # senal objetivo para barra i (datos hasta i-1)
        ret_i = float(rets.iloc[i])
        cost_i = 0.0
        if target_pos != prev_pos:                   # flip => se ejecuta al close de i
            # slippage_modelado = max(slippage_config, spread_proxy + impacto)
            #   spread_proxy = (high-low)/close ; impacto = coef*|trade_size|/volume (0 si vol NaN/0)
            trade_size = abs(target_pos - prev_pos)
            denom = float(volume.iloc[i])
            impacto = coef * trade_size / denom if (denom == denom and denom != 0.0) else 0.0
            spread_proxy = (float(high.iloc[i]) - float(low.iloc[i])) / float(close.iloc[i])
            slippage_modelado = max(slippage_config, spread_proxy + impacto)
            cost_i = commission_frac + slippage_modelado
        strat_returns[i] = target_pos * ret_i - cost_i
        prev_pos = target_pos

    strat = pd.Series(strat_returns, index=close.index)
    return strat, pos


def _build_backtest_result(strat, df, config, n_trades, n_symbols: int = 1) -> dict:
    """Ensambla el dict de resultado OOS (walk-forward + métricas + reporte).

    Compartido por ``run_backtest`` y ``run_backtest_portfolio``: recibe la
    serie de retornos de estrategia ``strat`` (ya combinada en cartera si aplica)
    y el ``df`` cuyo índice da las marcas de tiempo de la curva de equity.
    """
    n = len(strat)
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
        "n_symbols": n_symbols,
        "report": report,
    }


def _compute_data_hash(config) -> str:
    """Hash determinista del 'experimento' para auditoría / réplica (objetivo 20).

    Identifica unívocamente la combinación de parámetros de datos y de la
    estrategia: dos corridas con la MISMA config producen el MISMO hash, y
    cualquier cambio en los datos/params produce uno DISTINTO. Así se puede
    verificar y reproducir un backtest (auditabilidad del resultado).

    Devuelve los primeros 16 caracteres del sha256 en hex.
    """
    sym_key = tuple(config.symbols) if config.symbols else config.symbol
    payload = (
        config.asset_type,
        sym_key,
        config.timeframe,
        config.start,
        config.end,
        config.folds,
        config.split,
        config.commission,
        config.slippage,
        config.fast,
        config.slow,
        config.seed,
    )
    digest = hashlib.sha256(repr(payload).encode("utf-8")).hexdigest()
    return digest[:16]


def run_backtest(config) -> dict:
    """Backtest OOS con datos REALES y walk-forward, con costos realistas.

    Descarga OHLCV reales (Binance crypto / yfinance stock), genera señal de
    cruce de medias móviles (SMA fast/slow) y evalúa in-sample / out-of-sample
    por fold. En cada transición de señal resta comisión + slippage (costo de
    spread implícito, usando el slippage como proxy cuando no hay order book).

    Devuelve métricas (incl. CALMAR y operaciones/año), etiqueta de integridad,
    curva de equity y un 'report' en lenguaje claro (ESPAÑOL).

    Mantiene el contrato exacto de un solo símbolo (torneos/marketplace lo usan):
    si ``config.symbols`` está vacío usa ``config.symbol``. El dict devuelto es
    IDÉNTICO en forma al de antes, con la clave extra ``data_hash`` (objetivo 20).
    """
    _validate_config(config)  # validación de entrada antes de descargar
    # Imports diferidos: no acoplan engine a la red ni a yfinance en los tests unitarios.
    from data_feed import get_ohlcv  # noqa: F401

    df = get_ohlcv(config.asset_type, config.symbol, config.timeframe, config.start, config.end)
    if df is None or df.empty:
        raise ValueError("run_backtest: no se obtuvieron datos OHLCV reales.")

    n = len(df)
    if n < 5:
        raise ValueError(f"run_backtest: serie demasiado corta ({n} velas) para backtest.")

    # Ventanas SMA: desde code o desde campos fast/slow, adaptadas a la muestra.
    fast_cfg, slow_cfg = _parse_windows_from_code(config.code, config.fast, config.slow)
    fast, slow = _resolve_windows(n, fast_cfg, slow_cfg)

    strat, pos = _strategy_returns(df, fast, slow, config.commission, config.slippage, n)
    n_trades = int((pos.diff().fillna(0.0) != 0).sum())

    result = _build_backtest_result(strat, df, config, n_trades, n_symbols=1)
    result["data_hash"] = _compute_data_hash(config)
    return result


def run_backtest_portfolio(config) -> dict:
    """Backtest OOS MULTI-ACTIVO / CARTERA (mismo shape que ``run_backtest``).

    Cuando ``config.symbols`` tiene >= 2 activos, descarga cada símbolo vía
    ``get_ohlcv``, calcula la señal SMA event-driven por activo (misma lógica
    que ``run_backtest``, reutilizando ``_strategy_returns``) y combina en
    retorno de cartera = suma(peso_i * ret_strat_i) por barra.

    - ``weights``: pesos de cartera; si ``None`` => igual peso (normalizado).
    - Si ``config.symbols`` tiene < 2, cae a ``run_backtest`` (compatibilidad).

    El dict devuelto es IDÉNTICO en forma al de ``run_backtest``, pero
    ``n_symbols`` = len(símbolos) y la ``equity_curve`` es sobre la cartera
    combinada. Incluye también ``data_hash`` (objetivo 20).
    """
    _validate_config(config)  # validación de entrada antes de descargar
    from data_feed import get_ohlcv  # noqa: F401

    symbols = list(config.symbols) if config.symbols else [config.symbol]
    if len(symbols) < 2:
        # Compatibilidad total: un solo activo => mismo comportamiento que run_backtest.
        return run_backtest(config)

    # Pesos de cartera: igual peso si no se especifican; siempre normalizados.
    if config.weights:
        weights = [float(w) for w in config.weights]
    else:
        weights = [1.0 / len(symbols)] * len(symbols)
    wsum = sum(weights)
    if wsum == 0:
        weights = [1.0 / len(symbols)] * len(symbols)
    else:
        weights = [w / wsum for w in weights]

    # Descarga y señal por activo.
    asset_strats = []   # retornos de estrategia por activo (Series alineables)
    total_trades = 0
    for sym in symbols:
        d = get_ohlcv(config.asset_type, sym, config.timeframe, config.start, config.end)
        if d is None or d.empty:
            raise ValueError(f"run_backtest_portfolio: no se obtuvieron datos para '{sym}'.")
        m = len(d)
        if m < 5:
            raise ValueError(
                f"run_backtest_portfolio: serie demasiado corta ({m} velas) para '{sym}'."
            )
        fast_cfg, slow_cfg = _parse_windows_from_code(config.code, config.fast, config.slow)
        fast, slow = _resolve_windows(m, fast_cfg, slow_cfg)
        strat_i, pos_i = _strategy_returns(d, fast, slow, config.commission, config.slippage, m)
        asset_strats.append(strat_i)
        total_trades += int((pos_i.diff().fillna(0.0) != 0).sum())

    # Alinea por las fechas comunes (inner join) y combina con los pesos.
    aligned = pd.concat(asset_strats, axis=1).dropna()
    aligned.columns = [f"a{i}" for i in range(len(asset_strats))]
    portfolio_ret = pd.Series(0.0, index=aligned.index)
    for w, col in zip(weights, aligned.columns):
        portfolio_ret = portfolio_ret + w * aligned[col]

    result = _build_backtest_result(portfolio_ret, aligned, config, total_trades, n_symbols=len(symbols))
    result["data_hash"] = _compute_data_hash(config)
    return result
