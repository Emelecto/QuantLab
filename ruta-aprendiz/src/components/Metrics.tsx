import type { BacktestResult } from '../types';

function pct(v: number, digits = 1): string {
  return `${(v * 100).toFixed(digits)}%`;
}

export function Metrics({ result }: { result: BacktestResult }) {
  const overfit = result.overfitGap > 0.05;
  return (
    <div className="metrics">
      <Metric label="Retorno total" value={pct(result.totalReturn)} tone={result.totalReturn >= 0 ? 'good' : 'bad'} />
      <Metric label="Sharpe" value={result.sharpe.toFixed(2)} tone={result.sharpe >= 1 ? 'good' : 'neutral'} />
      <Metric label="Max Drawdown" value={pct(result.maxDrawdown)} tone={result.maxDrawdown > 0.3 ? 'bad' : 'neutral'} />
      <Metric label="Win rate" value={pct(result.winRate, 0)} tone="neutral" />
      <Metric label="Trades" value={String(result.nTrades)} tone="neutral" />
      <Metric
        label="Brecha overfit"
        value={pct(result.overfitGap)}
        tone={overfit ? 'bad' : 'good'}
        hint={overfit ? 'Cuidado: gana en muestra, no fuera' : 'Sano: similar fuera de muestra'}
      />
    </div>
  );
}

function Metric({ label, value, tone, hint }: { label: string; value: string; tone: 'good' | 'bad' | 'neutral'; hint?: string }) {
  return (
    <div className={`metric metric-${tone}`}>
      <span className="metric-label">{label}</span>
      <span className="metric-value">{value}</span>
      {hint && <span className="metric-hint">{hint}</span>}
    </div>
  );
}
