"use client";

/**
 * C6-L9 · Checklist go-live — 60 trades.
 * Datos reales: resumen + muestra de c6_l9.csv (neto medio +5.8 bps, 48/60 con plan).
 */
import { useState } from "react";
import { CountUp, Reveal } from "./charts";
import { C6_L9_MUESTRA, C6_L9_RESUMEN } from "./lesson-data";

const PASOS = [
  "Walk-forward OOS rentable neto de costos",
  "60+ trades demo con bitácora completa",
  "Kill-switch configurado y probado",
  "Checklist pre-trade en cada operación",
  "Límite diario de pérdida definido",
  "Revisión semanal de atribución",
];

export default function C6L9Visual() {
  const [ok, setOk] = useState<boolean[]>([true, true, true, false, false, false]);
  const listos = ok.filter(Boolean).length;
  const apto = listos === PASOS.length;

  return (
    <div className="academia-viz">
      <Reveal>
        <p className="academia-viz-titulo">Go-live: 60 trades antes de arriesgar capital</p>
        <p className="academia-viz-sub">Pasar a real no es un salto de fe: es tachar 6 requisitos con evidencia. 60 trades reales en c6_l9.csv con neto medio +5.8 bps y 48/60 siguiendo el plan.</p>
      </Reveal>
      <Reveal retraso={120}>
        <div className="academia-stat-grid academia-stat-grid-3">
          <div className="academia-stat"><span className="academia-stat-etiqueta">Trades evidencia</span><span className="academia-stat-valor"><CountUp valor={C6_L9_RESUMEN.trades} decimales={0} /></span></div>
          <div className="academia-stat"><span className="academia-stat-etiqueta">Neto medio</span><span className="academia-stat-valor academia-positivo"><CountUp valor={C6_L9_RESUMEN.netoMedioBps} decimales={1} sufijo=" bps" /></span></div>
          <div className="academia-stat"><span className="academia-stat-etiqueta">Con plan</span><span className="academia-stat-valor"><CountUp valor={C6_L9_RESUMEN.conPlan} decimales={0} sufijo="/60" /></span></div>
        </div>
      </Reveal>
      <Reveal retraso={200}>
        {PASOS.map((p, i) => (
          <label key={p} style={{ display: "flex", gap: "0.6rem", alignItems: "center", padding: "0.35rem 0", cursor: "pointer" }}>
            <input type="checkbox" checked={ok[i]} onChange={() => setOk((v) => v.map((x, j) => (j === i ? !x : x)))} />
            <span style={{ textDecoration: ok[i] ? "line-through" : "none", opacity: ok[i] ? 0.6 : 1 }}>{i + 1}. {p}</span>
          </label>
        ))}
        <p className={`academia-viz-nota ${apto ? "academia-positivo" : ""}`} style={{ marginTop: "0.6rem" }}>
          {apto ? "✓ APTO PARA GO-LIVE: evidencia completa. Empieza con stake mínimo y escala por Kelly." : `Progreso ${listos}/${PASOS.length}: aún no operes real. Te faltan ${PASOS.length - listos} requisitos.`}
        </p>
        <p className="academia-viz-graf-titulo" style={{ marginTop: "0.8rem" }}>Muestra 10 trades · bruto − costo = neto (bps)</p>
        <div className="academia-tabla-scroll">
          <table className="academia-tabla">
            <thead><tr><th>#</th><th>Bruto</th><th>Costo</th><th>Neto</th><th>Plan</th></tr></thead>
            <tbody>{C6_L9_MUESTRA.map((t) => (<tr key={t.trade}><td>{t.trade}</td><td>{t.bruto.toFixed(1)}</td><td>{t.costo.toFixed(1)}</td><td className={t.neto >= 0 ? "academia-positivo" : "academia-negativo"}>{t.neto >= 0 ? "+" : ""}{t.neto.toFixed(1)}</td><td>{t.plan ? "✓" : "✗"}</td></tr>))}</tbody>
          </table>
        </div>
      </Reveal>
    </div>
  );
}
