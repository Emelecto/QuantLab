"use client";

/**
 * C4-L4 · VaR 95 % + exposición conjunta — 50 retornos diarios reales.
 * Base (c4_l4.csv): VaR95 −2.93 %, exposición media 0.74, peor día −4.21 %.
 */
import { useMemo, useState } from "react";
import { CountUp, Reveal } from "./charts";
import { C4_VAR_RETS, C4_VAR_RESUMEN } from "./lesson-data";

export default function C4L4Visual() {
  const [capital, setCapital] = useState(20000);

  const stats = useMemo(() => {
    const ord = [...C4_VAR_RETS].sort((a, b) => a - b);
    const var95 = ord[Math.floor(0.05 * ord.length)] * 100;
    const peor = ord[0] * 100;
    const diasVar = C4_VAR_RETS.filter((r) => r * 100 <= var95).length;
    return { var95, peor, diasVar, perdidaUsd: (capital * Math.abs(var95)) / 100 };
  }, [capital]);

  const barras = useMemo(() => {
    const N = 12;
    const min = Math.min(...C4_VAR_RETS); const max = Math.max(...C4_VAR_RETS);
    const cubos = new Array(N).fill(0) as number[];
    for (const r of C4_VAR_RETS) {
      const i = Math.min(N - 1, Math.floor(((r - min) / Math.max(1e-9, max - min)) * N));
      cubos[i] += 1;
    }
    return { cubos, tope: Math.max(...cubos) };
  }, []);

  return (
    <div className="academia-viz">
      <Reveal>
        <p className="academia-viz-titulo">VaR 95 % y exposición conjunta</p>
        <p className="academia-viz-sub">
          El VaR 95 % es la pérdida que solo se supera el 5 % de los días. Con exposición 0.74× cada posición suma al riesgo total.
        </p>
      </Reveal>
      <Reveal retraso={120}>
        <div className="academia-control">
          <label htmlFor="ac-c4l4-cap">Capital: ${capital.toLocaleString("es-MX")}</label>
          <input id="ac-c4l4-cap" type="range" min={5000} max={100000} step={5000} value={capital}
            onChange={(e) => setCapital(Number(e.target.value))} className="academia-deslizador" />
        </div>
      </Reveal>
      <Reveal retraso={200}>
        <div className="academia-stat-grid academia-stat-grid-3">
          <div className="academia-stat"><span className="academia-stat-etiqueta">VaR 95 % diario</span><span className="academia-stat-valor academia-negativo"><CountUp valor={stats.var95} decimales={2} sufijo=" %" /></span></div>
          <div className="academia-stat"><span className="academia-stat-etiqueta">Pérdida ≈ en USD</span><span className="academia-stat-valor academia-negativo"><CountUp valor={stats.perdidaUsd} decimales={0} prefijo="−$" /></span></div>
          <div className="academia-stat"><span className="academia-stat-etiqueta">Exposición media</span><span className="academia-stat-valor"><CountUp valor={C4_VAR_RESUMEN.expoMedia} decimales={2} sufijo="×" /></span></div>
        </div>
        <p className="academia-viz-nota">{stats.diasVar} de 50 días superaron el VaR · peor día {C4_VAR_RESUMEN.peor} % · mejor +{C4_VAR_RESUMEN.mejor} %.</p>
      </Reveal>
      <Reveal retraso={280}>
        <p className="academia-viz-graf-titulo">Distribución de retornos diarios (%)</p>
        <div className="academia-histograma" aria-hidden="true">
          {barras.cubos.map((c, i) => (
            <div key={i} className="academia-hist-barra" style={{ height: `${Math.max(4, (c / barras.tope) * 100)}%` }} title={`${c} días`} />
          ))}
        </div>
        <p className="academia-viz-nota">La cola izquierda manda: dimensiona la cuenta para el percentil 5, no para el promedio.</p>
      </Reveal>
    </div>
  );
}
