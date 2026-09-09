"use client";

/**
 * C5-L2 · Fuga de información — comparador con vs sin fuga.
 * Serie real: cierres de c5_l2.csv. Métricas ilustrativas del experimento.
 */
import { useState } from "react";
import { CountUp, Reveal } from "./charts";
import { C5_L2_CIERRES } from "./lesson-data";

const CON_FUGA = { sharpe: 2.41, hit: 68.5, etiqueta: "Con fuga (features con futuro)" };
const SIN_FUGA = { sharpe: 0.62, hit: 52.1, etiqueta: "Sin fuga (solo pasado)" };

export default function C5L2Visual() {
  const [conFuga, setConFuga] = useState(true);
  const m = conFuga ? CON_FUGA : SIN_FUGA;
  const maxSharpe = 2.5;

  return (
    <div className="academia-viz">
      <Reveal>
        <p className="academia-viz-titulo">Fuga de información: el espejismo</p>
        <p className="academia-viz-sub">
          Mismo modelo, misma serie ({C5_L2_CIERRES.length} cierres de c5_l2.csv). La única diferencia:
          un feature que mira al futuro. Actívalo y mira cómo se infla el Sharpe.
        </p>
      </Reveal>
      <Reveal retraso={120}>
        <div className="academia-filtros" role="group" aria-label="Comparador de fuga">
          <button type="button" className={`academia-chip${conFuga ? " academia-chip-activo" : ""}`}
            onClick={() => setConFuga(true)}>Con fuga</button>
          <button type="button" className={`academia-chip${!conFuga ? " academia-chip-activo" : ""}`}
            onClick={() => setConFuga(false)}>Sin fuga</button>
        </div>
        <div className="academia-stat-grid academia-stat-grid-3" style={{ marginTop: "0.8rem" }}>
          <div className="academia-stat"><span className="academia-stat-etiqueta">Sharpe IS</span>
            <span className={`academia-stat-valor ${conFuga ? "academia-negativo" : ""}`}>
              <CountUp valor={m.sharpe} decimales={2} />
            </span></div>
          <div className="academia-stat"><span className="academia-stat-etiqueta">Hit-rate</span>
            <span className="academia-stat-valor"><CountUp valor={m.hit} decimales={1} sufijo=" %" /></span></div>
          <div className="academia-stat"><span className="academia-stat-etiqueta">Veredicto</span>
            <span className="academia-stat-valor" style={{ fontSize: "1rem" }}>{conFuga ? "⚠ Inflado" : "✓ Honesto"}</span></div>
        </div>
      </Reveal>
      <Reveal retraso={200}>
        <p className="academia-viz-graf-titulo">{m.etiqueta}</p>
        <div className="academia-barra-fondo" aria-label={`Sharpe ${m.sharpe}`}>
          <div className="academia-barra-relleno" style={{ width: `${(m.sharpe / maxSharpe) * 100}%` }} />
        </div>
        {conFuga
          ? <p className="academia-viz-nota">⚠ Sharpe 2.41 en papel, ≈ 0 en producción: el modelo memorizó el futuro, no el mercado.</p>
          : <p className="academia-viz-nota">Sharpe 0.62 sin fuga: modesto pero real. Todo backtest que no aísle el futuro miente.</p>}
      </Reveal>
    </div>
  );
}
