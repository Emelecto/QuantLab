"use client";

/**
 * C6-L2 · Spearman y MMC — ranking interactivo.
 * Datos reales: muestra de c6_l2.csv (Spearman global 0.535, MMC 0.714).
 */
import { useMemo, useState } from "react";
import { CountUp, Reveal } from "./charts";
import { C6_L2_METRICAS, C6_L2_MUESTRA } from "./lesson-data";

function rango(vals: number[]): number[] {
  const orden = vals.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
  const r = new Array<number>(vals.length);
  orden.forEach((o, p) => { r[o.i] = p + 1; });
  return r;
}

export default function C6L2Visual() {
  const [n, setN] = useState(6);
  const filas = useMemo(() => C6_L2_MUESTRA.slice(0, n), [n]);
  const rangos = useMemo(() => ({ p: rango(filas.map((f) => f.pred)), a: rango(filas.map((f) => f.actual)) }), [filas]);
  const spearMuestra = useMemo(() => {
    if (filas.length < 2) return 0;
    const rp = rangos.p, ra = rangos.a, m = (filas.length + 1) / 2;
    const num = rp.reduce((s, v, i) => s + (v - m) * (ra[i] - m), 0);
    const den = Math.sqrt(rp.reduce((s, v) => s + (v - m) ** 2, 0) * ra.reduce((s, v) => s + (v - m) ** 2, 0));
    return den === 0 ? 0 : num / den;
  }, [filas, rangos]);

  return (
    <div className="academia-viz">
      <Reveal>
        <p className="academia-viz-titulo">Spearman y MMC: importa el orden, no el valor</p>
        <p className="academia-viz-sub">El torneo puntúa el ranking (correlación de Spearman entre tu orden y el retorno real) y el MMC (cuánto aportas sobre el consenso). Datos de c6_l2.csv.</p>
      </Reveal>
      <Reveal retraso={120}>
        <div className="academia-stat-grid academia-stat-grid-3">
          <div className="academia-stat"><span className="academia-stat-etiqueta">Spearman global</span><span className="academia-stat-valor academia-positivo"><CountUp valor={C6_L2_METRICAS.spearman} decimales={3} /></span></div>
          <div className="academia-stat"><span className="academia-stat-etiqueta">MMC consenso</span><span className="academia-stat-valor academia-positivo"><CountUp valor={C6_L2_METRICAS.mmc} decimales={3} /></span></div>
          <div className="academia-stat"><span className="academia-stat-etiqueta">Spearman muestra</span><span className="academia-stat-valor"><CountUp valor={spearMuestra} decimales={3} /></span></div>
        </div>
      </Reveal>
      <Reveal retraso={200}>
        <div className="academia-control" style={{ marginBottom: "0.8rem" }}>
          <label htmlFor="ac-c6l2-n">Activos en el ranking: {n}</label>
          <input id="ac-c6l2-n" type="range" min={3} max={10} step={1} value={n} onChange={(e) => setN(Number(e.target.value))} className="academia-deslizador" />
        </div>
        <div className="academia-tabla-scroll">
          <table className="academia-tabla">
            <thead><tr><th>Activo</th><th>Pred</th><th>Rk pred</th><th>Real</th><th>Rk real</th><th>Acierto</th></tr></thead>
            <tbody>{filas.map((f, i) => {
              const ok = Math.abs(rangos.p[i] - rangos.a[i]) <= 1;
              return (<tr key={f.activo}><td>{f.activo}</td><td>{f.pred.toFixed(2)}</td><td>{rangos.p[i]}</td><td>{f.actual.toFixed(2)}</td><td>{rangos.a[i]}</td><td className={ok ? "academia-positivo" : "academia-negativo"}>{ok ? "≈" : "≠"}</td></tr>);
            })}</tbody>
          </table>
        </div>
        <p className="academia-viz-nota">Spearman = 1 − 6·Σd² / n(n²−1), con d = diferencia de rangos. Cambia n y mira cómo el ranking de la muestra se mueve; el global (60 filas) se mantiene en 0.535.</p>
      </Reveal>
    </div>
  );
}
