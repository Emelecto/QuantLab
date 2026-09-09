"use client";

/**
 * C5-L7 · Costos — simulador: trades/mes y bps por trade vs retorno.
 * Serie: 60 cierres de c5_l7.csv para el retorno bruto medio.
 */
import { useMemo, useState } from "react";
import { CountUp, Reveal } from "./charts";
import { C5_L7_CIERRES } from "./lesson-data";

export default function C5L7Visual() {
  const [bps, setBps] = useState(10);
  const [trades, setTrades] = useState(20);

  const calc = useMemo(() => {
    const rets = C5_L7_CIERRES.slice(1).map((c, i) => c / C5_L7_CIERRES[i] - 1);
    const brutoAnual = (rets.reduce((s, r) => s + r, 0) / rets.length) * 252 * 100;
    const costoAnual = (bps / 10000) * trades * 12 * 100;
    return { brutoAnual, costoAnual, neto: brutoAnual - costoAnual };
  }, [bps, trades]);

  return (
    <div className="academia-viz">
      <Reveal>
        <p className="academia-viz-titulo">Costos: trades vs bps</p>
        <p className="academia-viz-sub">
          Cada trade paga spread + comisión. Mueve los deslizadores y mira cómo el neto
          se evapora aunque el bruto sea positivo.
        </p>
      </Reveal>
      <Reveal retraso={120}>
        <div className="academia-simulador-grid">
          <div className="academia-control">
            <label htmlFor="ac-c5l7-bps">Costo por trade: {bps} bps</label>
            <input id="ac-c5l7-bps" type="range" min={0} max={50} step={1} value={bps}
              onChange={(e) => setBps(Number(e.target.value))} className="academia-deslizador" />
          </div>
          <div className="academia-control">
            <label htmlFor="ac-c5l7-trades">Trades por mes: {trades}</label>
            <input id="ac-c5l7-trades" type="range" min={1} max={60} step={1} value={trades}
              onChange={(e) => setTrades(Number(e.target.value))} className="academia-deslizador" />
          </div>
        </div>
      </Reveal>
      <Reveal retraso={200}>
        <div className="academia-stat-grid academia-stat-grid-3">
          <div className="academia-stat"><span className="academia-stat-etiqueta">Bruto anual</span><span className="academia-stat-valor academia-positivo"><CountUp valor={calc.brutoAnual} decimales={1} prefijo="+" sufijo=" %" /></span></div>
          <div className="academia-stat"><span className="academia-stat-etiqueta">Costo anual</span><span className="academia-stat-valor academia-negativo"><CountUp valor={calc.costoAnual} decimales={1} prefijo="−" sufijo=" %" /></span></div>
          <div className="academia-stat"><span className="academia-stat-etiqueta">Neto anual</span>
            <span className={`academia-stat-valor ${calc.neto >= 0 ? "academia-positivo" : "academia-negativo"}`}>
              <CountUp valor={calc.neto} decimales={1} prefijo={calc.neto >= 0 ? "+" : "−"} sufijo=" %" />
            </span></div>
        </div>
        {calc.neto < 0
          ? <p className="academia-viz-nota">⚠ Con {bps} bps × {trades} trades/mes los costos devoran el edge: rota menos o negocia menos bps.</p>
          : <p className="academia-viz-nota">Neto positivo con {bps} bps × {trades} trades/mes. El edge sobrevive… por ahora.</p>}
      </Reveal>
    </div>
  );
}
