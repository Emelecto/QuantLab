"use client";

import { useMemo, useState } from "react";
import { Slider } from "./Slider";
import { EquityChart } from "./EquityChart";

// M1 exercise: move % capital at risk -> see simulated drawdown live.
export function RiskSim() {
  const [riskPct, setRiskPct] = useState(20);
  const [volScale, setVolScale] = useState(2);

  // Deterministic-ish oscillating market with a small positive edge.
  // Higher riskPct amplifies the swing (and the drawdown); volScale widens it.
  const { equity, maxDD } = useMemo(() => {
    const n = 300;
    const equityArr = [100];
    let peak = 100;
    let mdd = 0;
    const edge = 0.0015;
    for (let i = 0; i < n; i++) {
      const swing = Math.sin(i / 7) * (riskPct / 100) * 0.5 * (volScale / 2);
      const next = equityArr[i] * (1 + edge + swing);
      equityArr.push(next);
      if (next > peak) peak = next;
      const dd = (peak - next) / peak;
      if (dd > mdd) mdd = dd;
    }
    return { equity: equityArr, maxDD: mdd };
  }, [riskPct, volScale]);

  return (
    <div className="lab">
      <div className="lab-controls">
        <Slider
          label="% de capital en riesgo por operación"
          value={riskPct}
          min={1}
          max={50}
          step={1}
          onChange={setRiskPct}
          help="Más riesgo por trade = drawdowns más profundos y mayor probabilidad de quemarte."
        />
        <Slider
          label="Volatilidad del mercado (escala)"
          value={volScale}
          min={1}
          max={6}
          step={0.5}
          onChange={setVolScale}
          help="Mercados más volátiles amplifican las caídas."
        />
      </div>
      <div className="lab-viz">
        <div className="viz-block">
          <h4 className="viz-title">Capital simulado (inicia en 100)</h4>
          <EquityChart equity={equity} />
          <p className="risk-readout">
            Con <b>{riskPct}%</b> en riesgo, el drawdown máximo simulado llega a{" "}
            <b className={maxDD > 0.3 ? "bad" : "good"}>{(maxDD * 100).toFixed(1)}%</b>.
            {maxDD > 0.3 ? " Eso puede borrarte en una mala racha." : " Manejable mientras iteras."}
          </p>
        </div>
      </div>
    </div>
  );
}
