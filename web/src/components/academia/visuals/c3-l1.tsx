"use client";

/**
 * C3-L1 · Teorema de Bayes — ¿cuánto vale una confirmación de volumen?
 * Sliders P(A) y P(B|A) → P(A|B) en vivo + tabla de contingencia real (c3_l1.csv).
 */
import { useMemo, useState } from "react";
import { CountUp, Reveal } from "./charts";
import { C3_TRADES } from "./lesson-data";

export default function C3L1Visual() {
  const obs = useMemo(() => {
    const n = C3_TRADES.length;
    const wins = C3_TRADES.filter((t) => t.win === 1).length;
    const perd = n - wins;
    const bDadoA = C3_TRADES.filter((t) => t.win === 1 && t.vol === 1).length;
    const bDadoNoA = C3_TRADES.filter((t) => t.win === 0 && t.vol === 1).length;
    const pa = wins / n;
    const pba = bDadoA / wins;
    const pbNoA = bDadoNoA / perd;
    return { n, wins, perd, bDadoA, bDadoNoA, pa, pba, pbNoA };
  }, []);

  const [prior, setPrior] = useState(Math.round(obs.pa * 100));
  const [sens, setSens] = useState(Math.round(obs.pba * 100));

  const post = useMemo(() => {
    const pA = prior / 100;
    const pBA = sens / 100;
    const denom = pBA * pA + obs.pbNoA * (1 - pA);
    return denom === 0 ? 0 : (pBA * pA) / denom;
  }, [prior, sens, obs.pbNoA]);

  return (
    <div className="academia-viz">
      <Reveal>
        <p className="academia-viz-titulo">Bayes: del winrate al winrate confirmado</p>
        <p className="academia-viz-sub">
          P(A|B) = P(B|A)·P(A) / P(B). Mueve los deslizadores: la señal de volumen
          vale más cuando el prior es bajo y la tasa de falsas alarmas es pequeña.
        </p>
      </Reveal>
      <Reveal retraso={120}>
        <div className="academia-simulador-grid">
          <div className="academia-control">
            <label htmlFor="ac-c3l1-pa">P(A) · winrate base: {prior}%</label>
            <input
              id="ac-c3l1-pa" type="range" min={5} max={95} step={1} value={prior}
              onChange={(e) => setPrior(Number(e.target.value))} className="academia-deslizador"
            />
          </div>
          <div className="academia-control">
            <label htmlFor="ac-c3l1-pba">P(B|A) · sensibilidad del volumen: {sens}%</label>
            <input
              id="ac-c3l1-pba" type="range" min={5} max={99} step={1} value={sens}
              onChange={(e) => setSens(Number(e.target.value))} className="academia-deslizador"
            />
          </div>
        </div>
        <p className="academia-viz-nota">
          P(B|¬A) · falsas alarmas: {(obs.pbNoA * 100).toFixed(0)}% (fijo, observado en los {obs.n} trades).
        </p>
      </Reveal>
      <Reveal retraso={200}>
        <div className="academia-ev-resultado academia-ev-ventaja">
          <span className="academia-ev-etiqueta">P(A|B) · prob. de ganar con volumen</span>
          <span className="academia-ev-valor">
            <CountUp valor={post * 100} decimales={1} sufijo=" %" />
          </span>
          <span className="academia-ev-veredicto">
            La confirmación eleva el {prior}% base al {(post * 100).toFixed(1)}%.
          </span>
        </div>
        <div className="academia-barra-fondo" aria-label={`Posterior ${(post * 100).toFixed(1)}%`}>
          <div className="academia-barra-relleno" style={{ width: `${post * 100}%` }} />
        </div>
      </Reveal>
      <Reveal retraso={280}>
        <p className="academia-viz-graf-titulo">Contingencia observada · {obs.n} trades</p>
        <div className="academia-tabla-scroll">
          <table className="academia-tabla">
            <thead><tr><th></th><th>Volumen sí (B)</th><th>Volumen no (¬B)</th><th>Total</th></tr></thead>
            <tbody>
              <tr><td><strong>Gana (A)</strong></td><td>{obs.bDadoA}</td><td>{obs.wins - obs.bDadoA}</td><td>{obs.wins}</td></tr>
              <tr><td><strong>Pierde (¬A)</strong></td><td>{obs.bDadoNoA}</td><td>{obs.perd - obs.bDadoNoA}</td><td>{obs.perd}</td></tr>
            </tbody>
          </table>
        </div>
        <p className="academia-viz-nota">
          P(A) = {(obs.pa * 100).toFixed(0)}% · P(B|A) = {(obs.pba * 100).toFixed(0)}% · P(B|¬A) = {(obs.pbNoA * 100).toFixed(0)}%.
        </p>
      </Reveal>
    </div>
  );
}
