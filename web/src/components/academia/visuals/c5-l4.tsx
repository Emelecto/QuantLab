"use client";

/**
 * C5-L4 · Regularización — Ridge vs GBM en Sharpe neto tras costos.
 * Serie: muestra de c5_l4.csv. Sharpe neto ilustrativo (ver lección).
 */
import { CountUp, Reveal } from "./charts";
import { C5_L4_CIERRES, C5_L4_MODELOS } from "./lesson-data";

const MAX = 1.5;

export default function C5L4Visual() {
  const [mejor] = [...C5_L4_MODELOS].sort((a, b) => b.sharpeNeto - a.sharpeNeto);

  return (
    <div className="academia-viz">
      <Reveal>
        <p className="academia-viz-titulo">Ridge vs GBM: Sharpe neto</p>
        <p className="academia-viz-sub">
          {C5_L4_CIERRES.length} cierres de muestra (c5_l4.csv). El GBM memoriza ruido in-sample;
          Ridge, penalizado, conserva más Sharpe neto después de costos.
        </p>
      </Reveal>
      <Reveal retraso={140}>
        <div style={{ display: "grid", gap: "0.7rem" }}>
          {C5_L4_MODELOS.map((m) => (
            <div key={m.modelo}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                <span>{m.modelo}</span>
                <span><CountUp valor={m.sharpeNeto} decimales={2} /></span>
              </div>
              <div className="academia-barra-fondo" aria-label={`${m.modelo} Sharpe ${m.sharpeNeto}`}>
                <div className="academia-barra-relleno" style={{ width: `${(m.sharpeNeto / MAX) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Reveal>
      <Reveal retraso={220}>
        <div className="academia-stat-grid academia-stat-grid-3">
          <div className="academia-stat"><span className="academia-stat-etiqueta">Ganador neto</span><span className="academia-stat-valor academia-positivo">{mejor.modelo}</span></div>
          <div className="academia-stat"><span className="academia-stat-etiqueta">Sharpe neto</span><span className="academia-stat-valor"><CountUp valor={mejor.sharpeNeto} decimales={2} /></span></div>
          <div className="academia-stat"><span className="academia-stat-etiqueta">Ventaja</span><span className="academia-stat-valor"><CountUp valor={C5_L4_MODELOS[0].sharpeNeto - C5_L4_MODELOS[1].sharpeNeto} decimales={2} prefijo="+" /></span></div>
        </div>
        <p className="academia-viz-nota">Moraleja: el modelo más potente en backtest rara vez es el más rentable en neto. Regulariza.</p>
      </Reveal>
    </div>
  );
}
