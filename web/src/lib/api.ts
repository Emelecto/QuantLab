// Cliente del motor de backtest (worker QuantLab).
// El worker corre con CORS abierto (ver NEXT_PUBLIC_WORKER_URL). No hay
// Supabase en esta capa: el puente de persistencia es localStorage.
//
// CONTRATO: split es ENTERO (porcentaje de train, ej. 70), NO fracción.

export type AssetType = "crypto" | "stock" | "etf";
export type Timeframe =
  | "1m" | "5m" | "15m" | "30m" | "1h" | "2h" | "4h" | "6h" | "12h"
  | "1d" | "3d" | "1w" | "1M" | "1wk" | "1mo";
export type IntegrityLabel = "High" | "Low";

/** Cuerpo que el worker espera en /backtest y /backtest/validate. */
export interface StrategyConfig {
  code: string;
  asset_type: AssetType;
  symbol: string;
  timeframe: Timeframe;
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
  capital: number;
  commission: number; // fracción, p.ej. 0.001 (= 0.1%)
  slippage: number; // fracción, p.ej. 0.0005 (= 0.05%) por lado
  folds: number; // int, p.ej. 3
  split: number; // entero = % train, p.ej. 70 (NO 0.7)
}

export interface Metrics {
  sharpe_is: number;
  sharpe_oos: number;
  deflated_sharpe_oos: number;
  sortino: number;
  maxdd: number;
  winrate: number;
  n_trades: number;
  ret_total: number;
  vol: number;
}

export interface EquityPoint {
  t: string; // YYYY-MM-DD
  is: number;
  oos: number;
}

/** Respuesta 200 de /backtest (más los campos locales que añadimos al guardar). */
export interface BacktestResult {
  id: string;
  config: StrategyConfig;
  created_at: string;
  metrics: Metrics;
  integrity_label: IntegrityLabel;
  equity_curve: EquityPoint[];
  /** Lectura honesta generada por el worker (out-of-sample). Opcional. */
  report?: string;
}

export interface ValidationResult {
  valid: boolean;
  warnings: string[];
}

/** Error tipado: distingue fallo de red (status ausente) de 400 del worker. */
export class BacktestError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "BacktestError";
    this.status = status;
  }
}

const WORKER_URL =
  process.env.NEXT_PUBLIC_WORKER_URL?.replace(/\/$/, "") || "http://localhost:8001";

async function postJson<T>(path: string, config: StrategyConfig): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${WORKER_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
  } catch {
    throw new BacktestError(
      "No se pudo conectar al motor. ¿Está corriendo en :8001?",
    );
  }

  if (!res.ok) {
    let message = "El motor rechazó la solicitud.";
    try {
      const data = (await res.json()) as { error?: string };
      if (data?.error) message = data.error;
    } catch {
      /* cuerpo no legible: dejamos el mensaje por defecto */
    }
    throw new BacktestError(message, res.status);
  }

  return (await res.json()) as T;
}

/** Ejecuta el backtest walk-forward real contra el worker. */
export async function runBacktest(config: StrategyConfig): Promise<BacktestResult> {
  return postJson<BacktestResult>("/backtest", config);
}

/**
 * Valida sintaxis/seguridad del código. El worker rechaza 'import os',
 * 'subprocess', '__import__', 'eval('. Ante fallo de red devuelve válido
 * (la validación pesada la hace el worker en /backtest igualmente).
 */
export async function validateStrategy(
  config: StrategyConfig,
): Promise<ValidationResult> {
  try {
    return await postJson<ValidationResult>("/backtest/validate", config);
  } catch {
    return { valid: true, warnings: [] };
  }
}
