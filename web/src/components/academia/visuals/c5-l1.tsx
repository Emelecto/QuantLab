"use client";

/**
 * C5-L1 · Features y lags — tabla de lags/retornos con embargo purgado.
 * Datos reales: cierres de c5_l1.csv (C5_L1_CIERRES).
 */
import { useMemo, useState } from "react";
import { CountUp, Reveal } from "./charts";
import { C5_L1_CIERRES } from "./lesson-data";

export default function C5L1Visual() {
  const [embargo, setEmbargo] = useState(2);

  const filas = useMemo(() => {
    const out: { dia: number; close: number; lag1: number; lag2: number; ret5: number }[] = [];
    for (let i = 5; i < C5_L1_CIERRES.length; i++) {
      out.push({
        dia: i + 1,
        close: C5_L1_CIERRES[i],
        lag1: C5_L1_CIERRES[i - 1],
        lag2: C5_L1_CIERRES[i - 2],
        ret5: (C5_L1_CIERRES[i] / C5_L1_CIERRES[i - 5] - 1) * 100,
      });
    }
    return out;
  }, []);

  const purgadas = filas.filter((f) => f.dia <= 5 + embargo).length;
  const utiles = filas.length - purgadas;
  const ultimas = filas.slice(-8);

  return (
    <div className="academia-viz">
      <Reveal>
        <p className="academia-viz-titulo">Features con lags + embargo</p>
        <p className="academia-viz-sub">
          Cada fila usa solo pasado (lag1, lag2, retorno 5d). El embargo purga las primeras filas
          tras cada corte para que el label no contamine el entrenamiento.
        </p>
      </Reveal>
      <Reveal retraso={120}>
        <div className="academia-control" style={{ marginBottom: "1rem" }}>
          <label htmlFor="ac-c5l1-embargo">Días de embargo: {embargo}</label>
          <input id="ac-c5l1-embargo" type="range" min={0} max={5} step={1} value={embargo}
            onChange={(e) => setEmbargo(Number(e.target.value))} className="academia-deslizador" />
        </div>
        <div className="academia-stat-grid academia-stat-grid-3">
          <div className="academia-stat"><span className="academia-stat-etiqueta">Filas totales</span><span className="academia-stat-valor"><CountUp valor={filas.length} decimales={0} /></span></div>
          <div className="academia-stat"><span className="academia-stat-etiqueta">Purgadas (embargo)</span><span className="academia-stat-valor academia-negativo"><CountUp valor={purgadas} decimales={0} /></span></div>
          <div className="academia-stat"><span className="academia-stat-etiqueta">Útiles</span><span className="academia-stat-valor academia-positivo"><CountUp valor={utiles} decimales={0} /></span></div>
        </div>
      </Reveal>
      <Reveal retraso={200}>
        <p className="academia-viz-graf-titulo">Últimas 8 filas de features · c5_l1.csv</p>
        <div className="academia-tabla-scroll">
          <table className="academia-tabla">
            <thead><tr><th>Día</th><th>Cierre</th><th>Lag 1</th><th>Lag 2</th><th>Ret 5d %</th></tr></thead>
            <tbody>
              {ultimas.map((f) => (
                <tr key={f.dia}>
                  <td>{f.dia}</td><td>{f.close.toFixed(2)}</td><td>{f.lag1.toFixed(2)}</td>
                  <td>{f.lag2.toFixed(2)}</td>
                  <td className={f.ret5 >= 0 ? "academia-positivo" : "academia-negativo"}>{f.ret5 >= 0 ? "+" : ""}{f.ret5.toFixed(2)} %</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="academia-viz-nota">Sin embargo, el retorno del día 6 “ve” el futuro del corte. Con embargo ≥ 2 esas filas se descartan.</p>
      </Reveal>
    </div>
  );
}
