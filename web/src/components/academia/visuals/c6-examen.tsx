"use client";

/**
 * C6-EXAMEN · Entrega final: walk-forward + submission + bitácora.
 * Datos reales: 120 cierres de c6_examen.csv (29958.19 → 25761.53).
 */
import { useMemo, useState } from "react";
import { CountUp, Reveal } from "./charts";
import { C6_EXAMEN_CIERRES } from "./lesson-data";

function sharpe(rets: number[]): number {
  if (rets.length < 2) return 0;
  const m = rets.reduce((a, b) => a + b, 0) / rets.length;
  const sd = Math.sqrt(rets.reduce((s, r) => s + (r - m) ** 2, 0) / (rets.length - 1));
  return sd === 0 ? 0 : (m / sd) * Math.sqrt(252);
}

export default function C6ExamenVisual() {
  const [corte, setCorte] = useState(80);
  const rets = useMemo(() => C6_EXAMEN_CIERRES.slice(1).map((c, i) => (c / C6_EXAMEN_CIERRES[i] - 1) * 100), []);
  const sIs = sharpe(rets.slice(0, corte));
  const sOos = sharpe(rets.slice(corte));
  const mom = useMemo(() => {
    const ult = C6_EXAMEN_CIERRES.slice(-5);
    return ult.map((c, i) => ({ dia: 116 + i, close: c, pred: i === 0 ? 0 : Math.tanh((c / ult[i - 1] - 1) * 50) }));
  }, []);
  const bit = useMemo(() => rets.slice(-5).map((r, i) => ({ id: 116 + i, r: r / 2, plan: i % 3 !== 2 })), [rets]);
  const entregable = sOos > 0.5 && mom.length === 5;

  return (
    <div className="academia-viz">
      <Reveal>
        <p className="academia-viz-titulo">Entrega final: demuestra que puedes operar torneos</p>
        <p className="academia-viz-sub">Tres piezas con los 120 cierres de c6_examen.csv: walk-forward honesto, submission con formato válido y bitácora de 5 trades.</p>
      </Reveal>
      <Reveal retraso={120}>
        <div className="academia-control" style={{ marginBottom: "0.8rem" }}>
          <label htmlFor="ac-c6ex-c">Corte walk-forward: {corte} IS / {rets.length - corte} OOS</label>
          <input id="ac-c6ex-c" type="range" min={40} max={100} step={5} value={corte} onChange={(e) => setCorte(Number(e.target.value))} className="academia-deslizador" />
        </div>
        <div className="academia-stat-grid academia-stat-grid-3">
          <div className="academia-stat"><span className="academia-stat-etiqueta">Sharpe IS</span><span className="academia-stat-valor"><CountUp valor={sIs} decimales={2} /></span></div>
          <div className="academia-stat"><span className="academia-stat-etiqueta">Sharpe OOS</span><span className={`academia-stat-valor ${sOos > 0.5 ? "academia-positivo" : "academia-negativo"}`}><CountUp valor={sOos} decimales={2} /></span></div>
          <div className="academia-stat"><span className="academia-stat-etiqueta">Cierres</span><span className="academia-stat-valor"><CountUp valor={C6_EXAMEN_CIERRES.length} decimales={0} /></span></div>
        </div>
      </Reveal>
      <Reveal retraso={200}>
        <p className="academia-viz-graf-titulo">1 · Walk-forward — {sOos > 0.5 ? "OOS válido (> 0.5)" : "OOS débil: revisa antes de enviar"}</p>
        <p className="academia-viz-graf-titulo">2 · Submission (id,prediction, últimos 5 días)</p>
        <div className="academia-tabla-scroll">
          <table className="academia-tabla">
            <thead><tr><th>Día</th><th>Cierre</th><th>Prediction</th></tr></thead>
            <tbody>{mom.map((m) => (<tr key={m.dia}><td>{m.dia}</td><td>{m.close.toFixed(2)}</td><td>{m.pred.toFixed(3)}</td></tr>))}</tbody>
          </table>
        </div>
        <p className="academia-viz-graf-titulo" style={{ marginTop: "0.8rem" }}>3 · Bitácora mínima (5 trades)</p>
        <div className="academia-tabla-scroll">
          <table className="academia-tabla">
            <thead><tr><th>#</th><th>R</th><th>Plan</th></tr></thead>
            <tbody>{bit.map((t) => (<tr key={t.id}><td>{t.id}</td><td className={t.r >= 0 ? "academia-positivo" : "academia-negativo"}>{t.r >= 0 ? "+" : ""}{t.r.toFixed(2)}</td><td>{t.plan ? "✓" : "✗"}</td></tr>))}</tbody>
          </table>
        </div>
        <p className={`academia-viz-nota ${entregable ? "academia-positivo" : ""}`} style={{ marginTop: "0.6rem" }}>
          {entregable ? "✓ Entrega lista: WF + submission + bitácora." : "Completa las tres piezas para aprobar."} Rúbrica: 40 % WF honesto · 30 % formato submission · 30 % bitácora con plan.
        </p>
      </Reveal>
    </div>
  );
}
