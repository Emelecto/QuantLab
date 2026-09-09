"use client";

/**
 * C5-L6 · Stacking — pesos out-of-fold de Ridge + GBM + MLP.
 * Serie: 70 cierres de c5_l6.csv. Pesos OOF ilustrativos (ver lección).
 */
import { useMemo, useState } from "react";
import { CountUp, Reveal } from "./charts";
import { C5_L6_PESOS } from "./lesson-data";

const SHARPE_BASE: Record<string, number> = { Ridge: 1.1, GBM: 0.9, MLP: 0.7 };

export default function C5L6Visual() {
  const [activos, setActivos] = useState<string[]>(["Ridge", "GBM", "MLP"]);

  const alternar = (m: string) =>
    setActivos((a) => (a.includes(m) ? a.filter((x) => x !== m) : [...a, m]));

  const mezcla = useMemo(() => {
    const sel = C5_L6_PESOS.filter((p) => activos.includes(p.modelo));
    const suma = sel.reduce((s, p) => s + p.peso, 0) || 1;
    const sharpe = sel.reduce((s, p) => s + (p.peso / suma) * (SHARPE_BASE[p.modelo] ?? 0), 0);
    const bonus = sel.length >= 2 ? 0.25 : 0;
    return { n: sel.length, sharpe: sharpe + bonus };
  }, [activos]);

  return (
    <div className="academia-viz">
      <Reveal>
        <p className="academia-viz-titulo">Stacking con pesos OOF</p>
        <p className="academia-viz-sub">
          Los pesos se estiman out-of-fold: cada modelo predice datos que no vio entrenar.
          Activa y desactiva miembros para ver el efecto diversificador.
        </p>
      </Reveal>
      <Reveal retraso={140}>
        <div style={{ display: "grid", gap: "0.7rem" }}>
          {C5_L6_PESOS.map((p) => {
            const on = activos.includes(p.modelo);
            return (
              <label key={p.modelo} style={{ display: "grid", gap: "0.3rem", opacity: on ? 1 : 0.45, cursor: "pointer" }}>
                <span style={{ display: "flex", gap: "0.6rem", alignItems: "center", fontSize: "0.9rem" }}>
                  <input type="checkbox" checked={on} onChange={() => alternar(p.modelo)} aria-label={p.modelo} />
                  <strong>{p.modelo}</strong>
                  <span>peso OOF <CountUp valor={p.peso} decimales={2} /></span>
                </span>
                <span className="academia-barra-fondo">
                  <span className="academia-barra-relleno" style={{ display: "block", width: `${p.peso * 100}%` }} />
                </span>
              </label>
            );
          })}
        </div>
      </Reveal>
      <Reveal retraso={220}>
        <div className="academia-stat-grid academia-stat-grid-3">
          <div className="academia-stat"><span className="academia-stat-etiqueta">Miembros</span><span className="academia-stat-valor"><CountUp valor={mezcla.n} decimales={0} /></span></div>
          <div className="academia-stat"><span className="academia-stat-etiqueta">Sharpe mezcla</span><span className="academia-stat-valor academia-positivo"><CountUp valor={mezcla.sharpe} decimales={2} /></span></div>
          <div className="academia-stat"><span className="academia-stat-etiqueta">Bonus diversidad</span><span className="academia-stat-valor">+0.25</span></div>
        </div>
        {mezcla.n < 2 && <p className="academia-viz-nota">⚠ Con menos de 2 miembros no hay stacking: es un modelo solo.</p>}
      </Reveal>
    </div>
  );
}
