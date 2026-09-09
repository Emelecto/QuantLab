"use client";

/**
 * C3-L2 · Media vs mediana — interruptor de outliers + tira de 50 retornos (c3_l2.csv).
 */
import { useMemo, useState } from "react";
import { CountUp, Reveal } from "./charts";
import { C3_L2_RETS } from "./lesson-data";

function mediana(xs: number[]): number {
  const o = [...xs].sort((a, b) => a - b);
  const m = Math.floor(o.length / 2);
  return o.length % 2 === 0 ? (o[m - 1] + o[m]) / 2 : o[m];
}

export default function C3L2Visual() {
  const [sinOutliers, setSinOutliers] = useState(false);

  const stats = useMemo(() => {
    const base = sinOutliers ? C3_L2_RETS.filter((r) => Math.abs(r) <= 0.1) : C3_L2_RETS;
    const media = base.reduce((a, b) => a + b, 0) / base.length;
    return { n: base.length, media: media * 100, med: mediana(base) * 100 };
  }, [sinOutliers]);

  const todo = useMemo(() => {
    const media = (C3_L2_RETS.reduce((a, b) => a + b, 0) / C3_L2_RETS.length) * 100;
    return { media };
  }, []);

  return (
    <div className="academia-viz">
      <Reveal>
        <p className="academia-viz-titulo">Media vs mediana bajo outliers</p>
        <p className="academia-viz-sub">
          Dos días extremos (−32% y +40%) distorsionan la media pero casi no tocan la mediana.
          Activa el interruptor y compruébalo.
        </p>
      </Reveal>
      <Reveal retraso={120}>
        <div className="academia-control">
          <label style={{ display: "flex", gap: "0.6rem", alignItems: "center", cursor: "pointer" }}>
            <input
              type="checkbox" checked={sinOutliers}
              onChange={(e) => setSinOutliers(e.target.checked)}
              aria-label="Excluir outliers"
            />
            Excluir outliers (|ret| &gt; 10%: días 5 y 37)
          </label>
        </div>
      </Reveal>
      <Reveal retraso={200}>
        <div className="academia-stat-grid academia-stat-grid-3">
          <div className="academia-stat">
            <span className="academia-stat-etiqueta">Observaciones</span>
            <span className="academia-stat-valor"><CountUp valor={stats.n} decimales={0} /></span>
          </div>
          <div className="academia-stat">
            <span className="academia-stat-etiqueta">Media diaria</span>
            <span className={`academia-stat-valor ${stats.media >= 0 ? "academia-positivo" : "academia-negativo"}`}>
              <CountUp valor={stats.media} decimales={2} sufijo=" %" />
            </span>
          </div>
          <div className="academia-stat">
            <span className="academia-stat-etiqueta">Mediana diaria</span>
            <span className={`academia-stat-valor ${stats.med >= 0 ? "academia-positivo" : "academia-negativo"}`}>
              <CountUp valor={stats.med} decimales={2} sufijo=" %" />
            </span>
          </div>
        </div>
        <p className="academia-viz-nota">
          Con los 50 datos: media {todo.media.toFixed(2)}%. La mediana apenas se mueve al quitar
          los extremos: esa es la robustez que la hace útil en retornos con colas gruesas.
        </p>
      </Reveal>
      <Reveal retraso={280}>
        <p className="academia-viz-graf-titulo">Tira de los 50 retornos diarios</p>
        <div className="academia-tira" aria-label="Tira de retornos">
          {C3_L2_RETS.map((r, i) => {
            const esOut = Math.abs(r) > 0.1;
            return (
              <span
                key={i}
                title={`Día ${i + 1}: ${(r * 100).toFixed(2)}%`}
                className={`academia-tira-punto ${r >= 0 ? "academia-tira-gana" : "academia-tira-pierde"}`}
                style={{
                  animationDelay: `${Math.min(i * 25, 1200)}ms`,
                  opacity: sinOutliers && esOut ? 0.2 : 1,
                  transform: esOut ? "scale(1.5)" : undefined,
                }}
              />
            );
          })}
        </div>
        <p className="academia-viz-nota">Puntos grandes: los 2 outliers que el interruptor excluye.</p>
      </Reveal>
    </div>
  );
}
