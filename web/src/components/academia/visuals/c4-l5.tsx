"use client";

/**
 * C4-L5 · Apalancamiento y liquidación — slider de leverage → precio de liquidación.
 * Base real (c4_l5.csv): con 2x y margen 100 USDT, 6 de 50 trades liquidados (12 %).
 */
import { useMemo, useState } from "react";
import { CountUp, Reveal } from "./charts";
import { C4_LEVERAGE_RESUMEN } from "./lesson-data";

const ENTRADA = 60000;

export default function C4L5Visual() {
  const [lev, setLev] = useState(2);

  const liq = useMemo(() => {
    const precioLiq = ENTRADA * (1 - 1 / lev);
    const distancia = (1 / lev) * 100;
    const perdidaPorciento = distancia * 1;
    return { precioLiq, distancia, perdidaPorciento };
  }, [lev]);

  return (
    <div className="academia-viz">
      <Reveal>
        <p className="academia-viz-titulo">Apalancamiento → liquidación</p>
        <p className="academia-viz-sub">
          En long con margen aislado, la liquidación llega cuando el precio cae ≈ 100 ÷ apalancamiento %.
        </p>
      </Reveal>
      <Reveal retraso={120}>
        <div className="academia-control">
          <label htmlFor="ac-c4l5-lev">Apalancamiento: {lev}x</label>
          <input id="ac-c4l5-lev" type="range" min={1} max={20} step={1} value={lev}
            onChange={(e) => setLev(Number(e.target.value))} className="academia-deslizador" />
        </div>
      </Reveal>
      <Reveal retraso={200}>
        <div className="academia-stat-grid academia-stat-grid-3">
          <div className="academia-stat"><span className="academia-stat-etiqueta">Precio liquidación</span><span className="academia-stat-valor academia-negativo"><CountUp valor={liq.precioLiq} decimales={0} prefijo="$" /></span></div>
          <div className="academia-stat"><span className="academia-stat-etiqueta">Margen de caída</span><span className="academia-stat-valor"><CountUp valor={liq.distancia} decimales={1} prefijo="−" sufijo=" %" /></span></div>
          <div className="academia-stat"><span className="academia-stat-etiqueta">Entrada</span><span className="academia-stat-valor"><CountUp valor={ENTRADA} decimales={0} prefijo="$" /></span></div>
        </div>
        {lev >= 10 && <p className="academia-viz-nota">⚠ Con {lev}x basta una caída de {liq.distancia.toFixed(1)} % para perder todo el margen.</p>}
      </Reveal>
      <Reveal retraso={280}>
        <p className="academia-viz-graf-titulo">Dato real · 50 trades con 2x (margen $100)</p>
        <div className="academia-stat-grid academia-stat-grid-3">
          <div className="academia-stat"><span className="academia-stat-etiqueta">Liquidados</span><span className="academia-stat-valor academia-negativo"><CountUp valor={C4_LEVERAGE_RESUMEN.liquidados} decimales={0} sufijo={` / ${C4_LEVERAGE_RESUMEN.n}`} /></span></div>
          <div className="academia-stat"><span className="academia-stat-etiqueta">Tasa de liquidación</span><span className="academia-stat-valor academia-negativo"><CountUp valor={C4_LEVERAGE_RESUMEN.pctLiq} decimales={0} sufijo=" %" /></span></div>
          <div className="academia-stat"><span className="academia-stat-etiqueta">PnL medio / trade</span><span className="academia-stat-valor academia-negativo"><CountUp valor={C4_LEVERAGE_RESUMEN.pnlMedio} decimales={1} prefijo="$" /></span></div>
        </div>
        <p className="academia-viz-nota">Incluso con 2x, el 12 % terminó en cero: el apalancamiento convierte stops normales en ruina.</p>
      </Reveal>
    </div>
  );
}
