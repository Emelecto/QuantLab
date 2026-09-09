"use client";

/**
 * C4-L2 · Simulador R:R — compara 1R vs 2R con tu winrate.
 * Base real (c4_l2.csv): 50 trades, R:R medio 2.01, winrate observado 38 %, PnL +4 281.
 */
import { useMemo, useState } from "react";
import { CountUp, Reveal } from "./charts";
import { C4_RR_RESUMEN } from "./lesson-data";

export default function C4L2Visual() {
  const [rr, setRr] = useState<1 | 2>(2);
  const [winrate, setWinrate] = useState(38);

  const sim = useMemo(() => {
    const w = winrate / 100;
    const ev = w * rr - (1 - w) * 1;
    const pnl50 = ev * 500;
    return { ev, pnl50, rentable: ev > 0 };
  }, [rr, winrate]);

  const umbral = useMemo(() => (1 / (rr + 1)) * 100, [rr]);

  return (
    <div className="academia-viz">
      <Reveal>
        <p className="academia-viz-titulo">Simulador riesgo : recompensa</p>
        <p className="academia-viz-sub">
          Con R:R 2:1 basta ganar 1 de cada 3 trades. Mueve el winrate y cambia el múltiplo para ver la esperanza.
        </p>
      </Reveal>
      <Reveal retraso={120}>
        <div className="academia-control" style={{ marginBottom: "1rem" }}>
          <span className="academia-stat-etiqueta">Múltiplo objetivo</span>
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.4rem" }}>
            {([1, 2] as const).map((v) => (
              <button key={v} type="button" onClick={() => setRr(v)}
                className={rr === v ? "academia-btn-mini academia-btn-activo" : "academia-btn-mini"}
                aria-pressed={rr === v}>
                {v}R
              </button>
            ))}
          </div>
        </div>
        <div className="academia-control">
          <label htmlFor="ac-c4l2-wr">Winrate supuesto: {winrate} %</label>
          <input id="ac-c4l2-wr" type="range" min={10} max={70} step={1} value={winrate}
            onChange={(e) => setWinrate(Number(e.target.value))} className="academia-deslizador" />
        </div>
      </Reveal>
      <Reveal retraso={200}>
        <div className="academia-stat-grid academia-stat-grid-3">
          <div className="academia-stat"><span className="academia-stat-etiqueta">Esperanza / trade</span><span className={`academia-stat-valor ${sim.rentable ? "academia-positivo" : "academia-negativo"}`}><CountUp valor={sim.ev} decimales={2} prefijo={sim.ev >= 0 ? "+" : ""} sufijo=" R" /></span></div>
          <div className="academia-stat"><span className="academia-stat-etiqueta">PnL 50 trades ($500 riesgo)</span><span className={`academia-stat-valor ${sim.rentable ? "academia-positivo" : "academia-negativo"}`}><CountUp valor={sim.pnl50} decimales={0} prefijo={sim.pnl50 >= 0 ? "+$" : "−$"} /></span></div>
          <div className="academia-stat"><span className="academia-stat-etiqueta">Winrate mínimo</span><span className="academia-stat-valor"><CountUp valor={umbral} decimales={1} sufijo=" %" /></span></div>
        </div>
        <p className="academia-viz-nota">
          {sim.rentable ? `✓ Con ${winrate} % y ${rr}R la estrategia es rentable en el largo plazo.` : `✗ Con ${winrate} % y ${rr}R pierdes a largo plazo: sube el R:R o filtra entradas.`}
        </p>
      </Reveal>
      <Reveal retraso={280}>
        <p className="academia-viz-graf-titulo">Dato real · 50 trades BTC con R:R ≈ 2</p>
        <div className="academia-stat-grid academia-stat-grid-3">
          <div className="academia-stat"><span className="academia-stat-etiqueta">Winrate real</span><span className="academia-stat-valor"><CountUp valor={C4_RR_RESUMEN.winrate * 100} decimales={0} sufijo=" %" /></span></div>
          <div className="academia-stat"><span className="academia-stat-etiqueta">PnL total</span><span className="academia-stat-valor academia-positivo"><CountUp valor={C4_RR_RESUMEN.pnl} decimales={0} prefijo="+$" /></span></div>
          <div className="academia-stat"><span className="academia-stat-etiqueta">R:R medio</span><span className="academia-stat-valor"><CountUp valor={C4_RR_RESUMEN.rrMedio} decimales={2} /></span></div>
        </div>
        <p className="academia-viz-nota">{C4_RR_RESUMEN.wins} ganados · {C4_RR_RESUMEN.perdidas} perdidos. Solo 38 % de aciertos y aun así +$4 281: el R:R compensa.</p>
      </Reveal>
    </div>
  );
}
