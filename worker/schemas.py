from pydantic import BaseModel, Field, model_validator


class StrategyConfig(BaseModel):
    code: str = Field(..., max_length=20000)
    asset_type: str = "crypto"          # crypto | stock | etf
    symbol: str = "BTCUSDT"
    timeframe: str = "1d"
    capital: float = Field(default=10000.0, gt=0)
    commission: float = Field(default=0.1, ge=0)  # % por lado (cada trade/transición)
    slippage: float = Field(default=0.0005, ge=0)  # slippage por lado (5 bps por defecto)
    fast: int = Field(default=20, ge=2, le=500)  # ventana SMA rápida del cruce
    slow: int = Field(default=50, ge=2, le=500)  # ventana SMA lenta del cruce
    folds: int = Field(default=5, ge=2, le=20)
    split: int = Field(default=70, ge=10, le=95)  # % train
    start: str = "2023-01-01"           # rango de datos OHLCV reales
    end: str = "2023-12-31"
    # --- Multi-activo / cartera (objetivo 19): opcionales, no rompen el default ---
    symbols: list[str] = []             # si vacío, se usa `symbol` (compatibilidad total)
    weights: list[float] | None = None  # pesos de cartera; si None => igual peso
    # --- Reproducibilidad (objetivo 20): semilla registrada para el hash de experimento ---
    seed: int = 42

    @model_validator(mode="after")
    def _slow_gt_fast(self):
        if self.slow <= self.fast:
            raise ValueError("slow debe ser mayor que fast")
        return self


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
