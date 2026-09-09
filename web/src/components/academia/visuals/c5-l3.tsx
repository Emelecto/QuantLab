"use client";

/**
 * C5-L3 · Walk-forward — 3 folds con Sharpe IS/OOS reales de c5_l3.csv.
 */
import { useState } from "react";
import { CountUp, Reveal } from "./charts";
import { C5_L3_WF } from "./lesson-data";

export default function C5L3Visual() {
  const [fold, setFold] = useState(2);
  const sel = C5_L3_WF.find((w) => w.fold === fold) ?? C5_L3_WF[0];
  const maxAbs = Math.max(...C5_L3_WF.flatMap((w) => [Math.abs(w.sharpeIs), Math.abs(w.sharpeOos)]));

  return (
    <div className="academia-viz">
      <Reveal>
        <p className="academia-viz-titulo">Walk-forward en 3 folds</p>
        <p className="academia-viz-sub">
          BTC, 120 días (c5_l3.csv): train 60 → test 30 por fold. El gap IS−OOS mide cuánto
          se degrada cada modelo fuera de muestra.
        </p>
      </Reveal>
      <Reveal retraso={140}>
        <div className="academia-filtros" role="group" aria-label="Selector de fold">
          {C5_L3_WF.map((w) => (
            <button key={w.fold} type="button"
              className={`academia-chip${w.fold === fold ? " academia-chip-activo" : ""}`}
              onClick={() => setFold(w.fold)}>Fold {w.fold}</button>
          ))}
        </div>
        <div className="academia-stat-grid academia-stat-grid-3" style={{ marginTop: "0.8rem" }}>
          <div className="academia-stat"><span className="academia-stat-etiqueta">Sharpe IS</span><span className="academia-stat-valor"><CountUp valor={sel.sharpeIs} decimales={2} /></span></div>
          <div className="academia-stat"><span className="academia-stat-etiqueta">Sharpe OOS</span>
            <span className={`academia-stat-valor ${sel.sharpeOos >= 1 ? "academia-positivo" : ""}`}>
              <CountUp valor={sel.sharpeOos} decimales={2} prefijo={sel.sharpeOos >= 0 ? "+" : ""} />
            </span></div>
          <div className="academia-stat"><span className="academia-stat-etiqueta">Gap IS−OOS</span>
            <span className="academia-stat-valor"><CountUp valor={sel.sharpeIs - sel.sharpeOos} decimales={2} /></span></div>
        </div>
      </Reveal>
      <Reveal retraso={240}>
        <p className="academia-viz-graf-titulo">IS vs OOS por fold</p>
        <div style={{ display: "grid", gap: "0.55rem" }}>
          {C5_L3_WF.map((w) => (
            <button key={w.fold} type="button" onClick={() => setFold(w.fold)}
              className={`academia-wf-fila${w.fold === fold ? " academia-wf-fila-activa" : ""}`}
              aria-label={`Ver fold ${w.fold}`}>
              <span className="academia-wf-fold">F{w.fold}</span>
              <span className="academia-wf-barras">
                <span className="academia-wf-track">
                  <span className="academia-wf-is" style={{ width: `${(Math.abs(w.sharpeIs) / maxAbs) * 100}%` }} title={`IS ${w.sharpeIs}`} />
                </span>
                <span className="academia-wf-track">
                  <span className="academia-wf-oos" style={{ width: `${(Math.abs(w.sharpeOos) / maxAbs) * 100}%` }} title={`OOS ${w.sharpeOos}`} />
                </span>
              </span>
              <span className="academia-wf-nums">IS {w.sharpeIs.toFixed(2)} · OOS +{w.sharpeOos.toFixed(2)}</span>
            </button>
          ))}
        </div>
        <p className="academia-viz-nota">Azul = in-sample · naranja = out-of-sample. Los 3 folds confirman en positivo: la señal sobrevive fuera de muestra.</p>
      </Reveal>
    </div>
  );
}
