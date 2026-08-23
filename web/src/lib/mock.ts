/**
 * Datos MOCK — Fase 1 (UI estática).
 * TODO(F2): reemplazar por consultas reales al backend / Supabase.
 */

export type Strategy = {
  id: string;
  name: string;
  author: string;
  asset: "BTC" | "ETH" | "SPY" | "AAPL";
  sharpe: number;
  description: string;
};

export const MOCK_STRATEGIES: Strategy[] = [
  {
    id: "deepfin-ensemble-v2",
    name: "DeepFin Ensemble v2",
    author: "deepfin",
    asset: "BTC",
    sharpe: 1.8,
    description:
      "Ensemble de momentum y volatilidad con dimensionamiento por riesgo objetivo.",
  },
  {
    id: "cruce-ema-atr",
    name: "Cruce EMA + filtro ATR",
    author: "lucia_r",
    asset: "BTC",
    sharpe: 1.6,
    description:
      "Cruce de medias exponenciales filtrado por volatilidad para evitar sierras.",
  },
  {
    id: "momentum-btc-4h",
    name: "Momentum BTC 4h",
    author: "alexq",
    asset: "BTC",
    sharpe: 1.4,
    description:
      "Sigue la tendencia en velas de 4 horas con salida por trailing stop.",
  },
  {
    id: "mean-reversion-eth",
    name: "Mean Reversion ETH",
    author: "martina.dev",
    asset: "ETH",
    sharpe: 1.1,
    description:
      "Compra caídas extremas contra la media móvil de 20 periodos y suelta rápido.",
  },
  {
    id: "breakout-spy-diario",
    name: "Breakout SPY diario",
    author: "quantpaisa",
    asset: "SPY",
    sharpe: 0.9,
    description:
      "Rupturas del máximo de 20 días en el ETF del S&P 500, solo lado largo.",
  },
  {
    id: "pairs-aapl-msft",
    name: "Pairs AAPL/MSFT",
    author: "nachotrade",
    asset: "AAPL",
    sharpe: 0.7,
    description:
      "Arbitraje estadístico del spread entre dos tecnológicas correlacionadas.",
  },
];

export type LeaderboardRow = {
  rank: number;
  name: string;
  author: string;
  asset: string;
  deflatedSharpeOos: number;
  maxDd: number; // negativo, en %
  winRate: number; // en %
};

/** Ordenado por Deflated Sharpe OOS descendente. */
export const MOCK_LEADERBOARD: LeaderboardRow[] = [
  {
    rank: 1,
    name: "DeepFin Ensemble v2",
    author: "deepfin",
    asset: "BTC",
    deflatedSharpeOos: 1.82,
    maxDd: -12.4,
    winRate: 58.3,
  },
  {
    rank: 2,
    name: "Cruce EMA + filtro ATR",
    author: "lucia_r",
    asset: "BTC",
    deflatedSharpeOos: 1.61,
    maxDd: -15.8,
    winRate: 54.1,
  },
  {
    rank: 3,
    name: "Momentum BTC 4h",
    author: "alexq",
    asset: "BTC",
    deflatedSharpeOos: 1.43,
    maxDd: -18.2,
    winRate: 52.7,
  },
  {
    rank: 4,
    name: "Vol Target Cripto",
    author: "sofi.q",
    asset: "ETH",
    deflatedSharpeOos: 1.27,
    maxDd: -14.1,
    winRate: 51.9,
  },
  {
    rank: 5,
    name: "Mean Reversion ETH",
    author: "martina.dev",
    asset: "ETH",
    deflatedSharpeOos: 1.12,
    maxDd: -21.5,
    winRate: 55.4,
  },
  {
    rank: 6,
    name: "Breakout SPY diario",
    author: "quantpaisa",
    asset: "SPY",
    deflatedSharpeOos: 0.94,
    maxDd: -11.3,
    winRate: 49.8,
  },
  {
    rank: 7,
    name: "Carry Funding Perp",
    author: "tomasfx",
    asset: "BTC",
    deflatedSharpeOos: 0.81,
    maxDd: -9.7,
    winRate: 61.2,
  },
  {
    rank: 8,
    name: "Pairs AAPL/MSFT",
    author: "nachotrade",
    asset: "AAPL",
    deflatedSharpeOos: 0.68,
    maxDd: -13.9,
    winRate: 53.0,
  },
];
