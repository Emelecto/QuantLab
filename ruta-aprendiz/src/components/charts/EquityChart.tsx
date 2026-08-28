interface EquityChartProps {
  equity: number[];
  compare?: { label: string; equity: number[] }[];
  height?: number;
}

// Normalized equity curve (starts at 100). Optional benchmarks overlaid.
export function EquityChart({ equity, compare, height = 220 }: EquityChartProps) {
  const W = 720;
  const H = height;
  const pad = { l: 8, r: 8, t: 10, b: 10 };
  const all = [equity, ...(compare?.map((c) => c.equity) ?? [])];
  const flat = all.flat();
  const min = Math.min(...flat, 100);
  const max = Math.max(...flat, 100);
  const span = max - min || 1;
  const x = (i: number, len: number) => pad.l + (i / (len - 1)) * (W - pad.l - pad.r);
  const y = (v: number) => pad.t + (1 - (v - min) / span) * (H - pad.t - pad.b);

  const lineOf = (e: number[]) =>
    e.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i, e.length).toFixed(1)},${y(v).toFixed(1)}`).join(' ');

  // baseline at 100
  const baseY = y(100);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="Curva de capital">
      <rect x={0} y={0} width={W} height={H} className="chart-bg" />
      <line x1={pad.l} x2={W - pad.r} y1={baseY} y2={baseY} className="chart-base" />
      {compare?.map((c) => (
        <path key={c.label} d={lineOf(c.equity)} className="chart-compare" fill="none" />
      ))}
      <path d={lineOf(equity)} className="chart-line" fill="none" />
    </svg>
  );
}
