from pydantic import BaseModel


class StrategyConfig(BaseModel):
    code: str
    asset_type: str = "crypto"          # crypto | stock | etf
    symbol: str = "BTCUSDT"
    timeframe: str = "1d"
    capital: float = 10000.0
    commission: float = 0.1             # % por lado (cada trade/transición)
    slippage: float = 0.0005            # slippage por lado (5 bps por defecto)
    fast: int = 20                      # ventana SMA rápida del cruce
    slow: int = 50                      # ventana SMA lenta del cruce
    folds: int = 5
    split: int = 70                     # % train
    start: str = "2023-01-01"           # rango de datos OHLCV reales
    end: str = "2023-12-31"


class Metrics(BaseModel):
    sharpe_is: float = 0.0
    sharpe_oos: float = 0.0
    deflated_sharpe_oos: float = 0.0
    sortino: float = 0.0
    maxdd: float = 0.0
    winrate: float = 0.0
    n_trades: int = 0
    ret_total: float = 0.0
    vol: float = 0.0
    # --- Nuevos campos: realismo / valor del reporte ---
    calmar: float = 0.0                 # ret_total / |maxdd|
    n_trades_per_year: float = 0.0      # operaciones anualizadas


class RunResult(BaseModel):
    run_id: str
    status: str                         # pending|running|done|error
    metrics: Metrics | None = None
    integrity: str | None = None       # Alta | Media | Baja
    vs_baseline: dict | None = None     # {bh_ret, naive_ret, delta}
    error_message: str | None = None
