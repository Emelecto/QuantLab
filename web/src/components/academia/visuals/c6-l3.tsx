"use client";

/**
 * C6-L3 · Neutralización a beta — slider.
 * Datos reales: muestra de c6_l3.csv (beta media 1.075).
 */
import { useMemo, useState } from "react";
import { CountUp, Reveal } from "./charts";
import { C6_L3_BETA_MEDIA, C6_L3_MUESTRA } from "./lesson-data";

export default function C6L3Visual() {
  const [fuerza, setFuerza] = useState(1);
  const filas = useMemo(() => C6_L3_MUESTRA.map((f) => {
    const neutral = f.pred - fuerza * C6_L3_BETA_MEDIA * 0.2;
    return { ...f, neutral };
  }), [fuerza]);
  const corrBeta = useMemo(() => {
    const xs = filas.map((f) => f.neutral), bs = filas.map((f) => f.beta);
    const mx = xs.reduce((a, b) => a + b, 0) / xs.length, mb = bs.reduce((a, b) => a + b, 0) / bs.length;
    const num = xs.reduce((s, x, i) => s + (x - mx) * (bs[i] - mb), 0);
    const den = Math.sqrt(xs.reduce((s, x) => s + (x - mx) ** 2, 0) * bs.reduce((s, b) => s + (b - mb) ** 2, 0));
    return den === 0 ? 0 : num / den;
  }, [filas]);

  return (
    <div className="academia-viz">
      <Reveal>
        <p className="academia-viz-titulo">Neutralización: quita el beta del mercado</p>
        <p className="academia-viz-sub">Si tu señal solo replica al mercado (beta alta), el torneo no paga. Neutralizar = restar la exposición: pred_neutral = pred − fuerza·β·0.2. Datos de c6_l3.csv (β media 1.075).</p>
      </Reveal>
      <Reveal retraso={120}>
        <div className="academia-control" style={{ marginBottom: "0.8rem" }}>
          <label htmlFor="ac-c6l3-f">Fuerza de neutralización: {fuerza.toFixed(1)}</label>
          <input id="ac-c6l3-f" type="range" min={0} max={2} step={0.1} value={fuerza} onChange={(e) => setFuerza(Number(e.target.value))} className="academia-deslizador" />
        </div>
        <div className="academia-stat-grid academia-stat-grid-3">
          <div className="academia-stat"><span className="academia-stat-etiqueta">β media</span><span className="academia-stat-valor"><CountUp valor={C6_L3_BETA_MEDIA} decimales={3} /></span></div>
          <div className="academia-stat"><span className="academia-stat-etiqueta">Corr(neutral, β)</span><span className="academia-stat-valor"><CountUp valor={corrBeta} decimales={3} /></span></div>
          <div className="academia-stat"><span className="academia-stat-etiqueta">Estado</span><span className={`academia-stat-valor ${Math.abs(corrBeta) < 0.3 ? "academia-positivo" : "academia-negativo"}`}>{Math.abs(corrBeta) < 0.3 ? "NEUTRAL" : "EXPUESTO"}</span></div>
        </div>
      </Reveal>
      <Reveal retraso={200}>
        <div className="academia-tabla-scroll">
          <table className="academia-tabla">
            <thead><tr><th>Activo</th><th>Pred</th><th>β</th><th>Neutral</th></tr></thead>
            <tbody>{filas.map((f) => (<tr key={f.activo}><td>{f.activo}</td><td>{f.pred.toFixed(3)}</td><td>{f.beta.toFixed(1)}</td><td className="academia-positivo">{f.neutral.toFixed(3)}</td></tr>))}</tbody>
          </table>
        </div>
        <p className="academia-viz-nota">Con fuerza 0 la señal conserva toda su correlación con β; al subirla, la correlación cae hacia 0. Neutralizar de más también mata señal: busca |corr| &lt; 0.30 sin aplanarlo todo.</p>
      </Reveal>
    </div>
  );
}
