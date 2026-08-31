// Lightweight SVG line chart. No dependency, full control, crisp on retina.
interface PriceChartProps {
  series: number[];
  signal?: (1 | 0 | -1)[];
  height?: number;
  markerLabel?: string;
}

export function PriceChart({ series, signal, height = 220 }: PriceChartProps) {
  const W = 720;
  const H = height;
  const pad = { l: 8, r: 8, t: 10, b: 10 };
  const min = Math.min(...series);
  const max = Math.max(...series);
  const span = max - min || 1;
  const x = (i: number) => pad.l + (i / (series.length - 1)) * (W - pad.l - pad.r);
  const y = (v: number) => pad.t + (1 - (v - min) / span) * (H - pad.t - pad.b);

  const line = series.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');

  // Long/short shading from signal (fill under curve by position color is noisy; use top ribbons).
  const longs = signal
    ? signal.map((s, i) => ({ s, i })).filter((p) => p.s === 1)
    : [];
  const shorts = signal
    ? signal.map((s, i) => ({ s, i })).filter((p) => p.s === -1)
    : [];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="Gráfico de precio">
      <rect x={0} y={0} width={W} height={H} className="chart-bg" />
      {longs.length > 0 && (
        <polyline
          points={longs.map((p) => `${x(p.i).toFixed(1)},${H - pad.b}`).join(' ')}
          className="ribbon-long"
          fill="none"
        />
      )}
      {shorts.length > 0 && (
        <polyline
          points={shorts.map((p) => `${x(p.i).toFixed(1)},${pad.t}`).join(' ')}
          className="ribbon-short"
          fill="none"
        />
      )}
      <path d={line} className="chart-line" fill="none" />
      {signal && (
        <>
          {longs.map((p) => (
            <circle key={`l${p.i}`} cx={x(p.i)} cy={y(series[p.i])} r={1.5} className="dot-long" />
          ))}
          {shorts.map((p) => (
            <circle key={`s${p.i}`} cx={x(p.i)} cy={y(series[p.i])} r={1.5} className="dot-short" />
          ))}
        </>
      )}
    </svg>
  );
}
