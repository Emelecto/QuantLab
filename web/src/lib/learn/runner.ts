import type {
  BacktestResult,
  StrategyConfig,
  StrategyParams,
  Trade,
} from './types';
import { strategyTemplates } from './strategies';

function sma(series: number[], period: number): (number | null)[] {
  const out: (number | null)[] = new Array(series.length).fill(null);
  let sum = 0;
  for (let i = 0; i < series.length; i++) {
    sum += series[i];
    if (i >= period) sum -= series[i - period];
    if (i >= period - 1) out[i] = sum / period;
  }
  return out;
}

// Position per bar for each template. Null/0 at warmup -> flat (no exposure).
function computeSignal(templateId: string, params: StrategyParams, series: number[]): (1 | 0 | -1)[] {
  const n = series.length;
  const sig: (1 | 0 | -1)[] = new Array(n).fill(0);

  if (templateId === 'ma_cross') {
    const fast = sma(series, Math.round(params.fast));
    const slow = sma(series, Math.round(params.slow));
    for (let i = 0; i < n; i++) {
      if (fast[i] != null && slow[i] != null) sig[i] = fast[i]! > slow[i]! ? 1 : -1;
    }
  } else if (templateId === 'bollinger') {
    const period = Math.round(params.period);
    const k = params.devs;
    for (let i = period - 1; i < n; i++) {
      const window = series.slice(i - period + 1, i + 1);
      const mean = window.reduce((a, b) => a + b, 0) / period;
      const variance = window.reduce((a, b) => a + (b - mean) ** 2, 0) / period;
      const sd = Math.sqrt(variance);
      const upper = mean + k * sd;
      const lower = mean - k * sd;
      if (series[i] > upper) sig[i] = -1; // overbought -> short, expect reversion
      else if (series[i] < lower) sig[i] = 1; // oversold -> long
    }
  } else if (templateId === 'momentum') {
    const period = Math.round(params.period);
    const thr = params.threshold / 100; // threshold given in %, stored as fraction
    for (let i = period; i < n; i++) {
      const roc = series[i] / series[i - period] - 1;
      if (roc > thr) sig[i] = 1;
      else if (roc < -thr) sig[i] = -1;
    }
  }
  return sig;
}

function dailyReturns(series: number[]): number[] {
  const r: number[] = [];
  for (let i = 1; i < series.length; i++) r.push(series[i] / series[i - 1] - 1);
  return r;
}

function buildTrades(signal: (1 | 0 | -1)[], rets: number[]): Trade[] {
  const trades: Trade[] = [];
  let entry = -1;
  let side: 1 | -1 = 1;
  for (let i = 0; i < signal.length; i++) {
    const pos = signal[i];
    if (pos === 0) {
      if (entry >= 0) {
        const ret = rets.slice(entry, i).reduce((a, b) => a * (1 + side * b), 1) - 1;
        trades.push({ entry, exit: i, side, ret });
        entry = -1;
      }
    } else {
      if (entry < 0) {
        entry = i;
        side = pos;
      } else if (pos !== side) {
        const ret = rets.slice(entry, i).reduce((a, b) => a * (1 + side * b), 1) - 1;
        trades.push({ entry, exit: i, side, ret });
        entry = i;
        side = pos;
      }
    }
  }
  if (entry >= 0) {
    const last = signal.length;
    const ret = rets.slice(entry, last).reduce((a, b) => a * (1 + side * b), 1) - 1;
    trades.push({ entry, exit: last, side, ret });
  }
  return trades;
}

function metricsFromTrades(equity: number[], trades: Trade[]): {
  totalReturn: number;
  sharpe: number;
  maxDrawdown: number;
  winRate: number;
} {
  const totalReturn = equity[equity.length - 1] / equity[0] - 1;
  const stratRets: number[] = [];
  for (let i = 1; i < equity.length; i++) stratRets.push(equity[i] / equity[i - 1] - 1);
  const mean = stratRets.reduce((a, b) => a + b, 0) / (stratRets.length || 1);
  const variance = stratRets.reduce((a, b) => a + (b - mean) ** 2, 0) / (stratRets.length || 1);
  const sd = Math.sqrt(variance);
  const sharpe = sd > 0 ? (mean / sd) * Math.sqrt(252) : 0;
  let peak = equity[0];
  let maxDD = 0;
  for (const v of equity) {
    if (v > peak) peak = v;
    const dd = (peak - v) / peak;
    if (dd > maxDD) maxDD = dd;
  }
  const wins = trades.filter((t) => t.ret > 0).length;
  const winRate = trades.length ? wins / trades.length : 0;
  return { totalReturn, sharpe, maxDrawdown: maxDD, winRate };
}

// Core: evaluate a strategy config against a price series.
export function runStrategy(config: StrategyConfig, series: number[]): BacktestResult {
  const tpl = strategyTemplates.find((t) => t.id === config.templateId);
  if (!tpl) throw new Error(`Unknown template ${config.templateId}`);
  const signal = computeSignal(config.templateId, config.params, series);
  const rets = dailyReturns(series);

  // Equity curve: act on prior bar's signal.
  const equity: number[] = [100];
  for (let i = 1; i < series.length; i++) {
    const pos = signal[i - 1];
    equity.push(equity[i - 1] * (1 + pos * rets[i - 1]));
  }

  const trades = buildTrades(signal, rets);
  const m = metricsFromTrades(equity, trades);

  // Honesty split (M4): first 70% in-sample, last 30% out-of-sample, same params.
  const cut = Math.floor(series.length * 0.7);
  const inSample = runOnSlice(config, series.slice(0, cut));
  const outSample = runOnSlice(config, series.slice(cut));

  return {
    equityCurve: equity,
    trades,
    nTrades: trades.length,
    totalReturn: m.totalReturn,
    sharpe: m.sharpe,
    maxDrawdown: m.maxDrawdown,
    winRate: m.winRate,
    inSampleReturn: inSample.totalReturn,
    outSampleReturn: outSample.totalReturn,
    overfitGap: inSample.totalReturn - outSample.totalReturn,
    series,
    signal,
  };
}

function runOnSlice(config: StrategyConfig, slice: number[]): { totalReturn: number } {
  const signal = computeSignal(config.templateId, config.params, slice);
  const rets = dailyReturns(slice);
  const equity: number[] = [100];
  for (let i = 1; i < slice.length; i++) {
    const pos = signal[i - 1];
    equity.push(equity[i - 1] * (1 + pos * rets[i - 1]));
  }
  return { totalReturn: equity[equity.length - 1] / equity[0] - 1 };
}

// Default params helper for a template (used when entering a lesson blank).
export function defaultParams(templateId: string): StrategyParams {
  const tpl = strategyTemplates.find((t) => t.id === templateId);
  if (!tpl) return {};
  const p: StrategyParams = {};
  for (const spec of tpl.params) p[spec.key] = spec.default;
  return p;
}
