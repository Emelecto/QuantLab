from pydantic import BaseModel


class StrategyConfig(BaseModel):
    code: str
    asset_type: str = "crypto"          # crypto | stock
    symbol: str = "BTCUSDT"
    timeframe: str = "1d"
    capital: float = 10000.0
    commission: float = 0.1             # % por lado
    folds: int = 5
    split: int = 70                     # % train


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


class RunResult(BaseModel):
    run_id: str
    status: str                         # pending|running|done|error
    metrics: Metrics | None = None
    integrity: str | None = None       # Alta | Media | Baja
    vs_baseline: dict | None = None     # {bh_ret, naive_ret, delta}
    error_message: str | None = None
