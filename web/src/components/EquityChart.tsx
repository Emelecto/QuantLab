"use client";

import type { EquityPoint } from "@/lib/api";

/**
 * Curva de equity en SVG inline (sin librerías): IS vs OOS.
 * Eje simple con baseline en 0 y leyenda.
 */
export function EquityChart({ curve }: { curve: EquityPoint[] }) {
  if (!curve || curve.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted">
        Sin datos de curva de equity.
      </div>
    );
  }

  const W = 800;
  const H = 300;
  const PAD_L = 48;
  const PAD_R = 16;
  const PAD_T = 16;
  const PAD_B = 28;

  const isVals = curve.map((p) => p.is);
  const oosVals = curve.map((p) => p.oos);
  const all = [...isVals, ...oosVals];
  const min = Math.min(0, ...all);
  const max = Math.max(0, ...all);
  const range = max - min || 1;

  const x = (i: number) =>
    PAD_L + (i / (curve.length - 1 || 1)) * (W - PAD_L - PAD_R);
  const y = (v: number) =>
    PAD_T + (1 - (v - min) / range) * (H - PAD_T - PAD_B);

  const toPath = (vals: number[]) =>
    vals
      .map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`)
      .join(" ");

  const isPath = toPath(isVals);
  const oosPath = toPath(oosVals);

  const baseY = y(0);
  const zeroLabel = "0";

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="h-64 w-full"
        role="img"
        aria-label="Curva de equity IS vs OOS"
      >
        {/* línea base en 0 */}
        <line
          x1={PAD_L}
          x2={W - PAD_R}
          y1={baseY}
          y2={baseY}
          stroke="rgba(255,255,255,0.12)"
          strokeDasharray="4 4"
        />
        <text x={4} y={baseY + 4} fill="#8b93a7" fontSize="11">
          {zeroLabel}
        </text>

        {/* IS */}
        <path
          d={isPath}
          fill="none"
          stroke="#5eead4"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* OOS */}
        <path
          d={oosPath}
          fill="none"
          stroke="#38bdf8"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>

      <div className="mt-3 flex items-center gap-6 text-xs text-muted">
        <span className="flex items-center gap-2">
          <span className="inline-block h-2 w-4 rounded bg-accent" />
          IS (entrenamiento)
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block h-2 w-4 rounded bg-accent-2" />
          OOS (nunca visto)
        </span>
      </div>
    </div>
  );
}
