import { describe, it, expect } from 'vitest';
import { runStrategy, defaultParams } from './runner';
import { genPriceSeries } from './random';

const series = genPriceSeries(1234, 300);

describe('mini-runner', () => {
  it('ma_cross produces a valid backtest with trades and metrics', () => {
    const r = runStrategy({ templateId: 'ma_cross', params: { fast: 10, slow: 50 } }, series);
    expect(r.nTrades).toBeGreaterThan(0);
    expect(r.equityCurve.length).toBe(series.length);
    expect(r.equityCurve[0]).toBeCloseTo(100, 5);
    expect(Number.isFinite(r.sharpe)).toBe(true);
    expect(r.maxDrawdown).toBeGreaterThanOrEqual(0);
    expect(r.winRate).toBeGreaterThanOrEqual(0);
    expect(r.winRate).toBeLessThanOrEqual(1);
  });

  it('is deterministic for the same seed and params', () => {
    const a = runStrategy({ templateId: 'ma_cross', params: { fast: 10, slow: 50 } }, genPriceSeries(1234, 300));
    const b = runStrategy({ templateId: 'ma_cross', params: { fast: 10, slow: 50 } }, series);
    expect(a.totalReturn).toBeCloseTo(b.totalReturn, 10);
  });

  it('bollinger and momentum are also runnable', () => {
    expect(runStrategy({ templateId: 'bollinger', params: { period: 20, devs: 2 } }, series).equityCurve.length).toBe(series.length);
    expect(runStrategy({ templateId: 'momentum', params: { period: 14, threshold: 5 } }, series).nTrades).toBeGreaterThan(0);
  });

  it('defaultParams returns every param spec', () => {
    const p = defaultParams('ma_cross');
    expect(p.fast).toBe(10);
    expect(p.slow).toBe(50);
  });

  it('unknown template throws', () => {
    expect(() => runStrategy({ templateId: 'nope', params: {} }, series)).toThrow();
  });
});
