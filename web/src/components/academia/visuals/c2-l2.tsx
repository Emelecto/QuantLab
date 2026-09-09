"use client";

/**
 * C2-L2 · Huecos y resampleo — tabla horaria con gaps resaltados (c2_l2.csv)
 * + interruptor de resampleo (ignorar / rellenar ffill) con cobertura en vivo.
 */
import { useMemo, useState } from "react";
import { CountUp, Reveal } from "./charts";
import { C2_GAPS_HORARIO } from "./lesson-data";

type Modo = "crudo" | "ffill";

export default function C2L2Visual() {
  const [modo, setModo] = useState<Modo>("crudo");
  const [soloGaps, setSoloGaps] = useState(false);

  const stats = useMemo(() => {
    const gaps = C2_GAPS_HORARIO.filter((p) => p.precio == null);
    const precios = C2_GAPS_HORARIO.map((p) => p.precio).filter((x): x is number => x != null);
    return {
      total: C2_GAPS_HORARIO.length,
      gaps: gaps.length,
      cobertura: ((C2_GAPS_HORARIO.length - gaps.length) / C2_GAPS_HORARIO.length) * 100,
      min: Math.min(...precios),
      max: Math.max(...precios),
    };
  }, []);

  const filas = useMemo(() => {
    let ultimo: number | null = null;
    const procesadas = C2_GAPS_HORARIO.map((p) => {
      const esGap = p.precio == null;
      const mostrado = esGap && modo === "ffill" ? ultimo : p.precio;
      if (p.precio != null) ultimo = p.precio;
      return { ...p, esGap, mostrado, rellenado: esGap && modo === "ffill" };
    });
    return soloGaps ? procesadas.filter((f) => f.esGap) : procesadas;
  }, [modo, soloGaps]);

  return (
    <div className="academia-viz">
      <Reveal>
        <p className="academia-viz-titulo">Detecta los huecos antes de operar</p>
        <p className="academia-viz-sub">
          48 horas de precio con {stats.gaps} huecos (sin datos del exchange). Un gap no es un cero:
          resamplear mal inventa retornos falsos.
        </p>
      </Reveal>
      <Reveal retraso={120}>
        <div className="academia-stat-grid academia-stat-grid-4">
          <div className="academia-stat"><span className="academia-stat-etiqueta">Horas</span><span className="academia-stat-valor"><CountUp valor={stats.total} decimales={0} /></span></div>
          <div className="academia-stat"><span className="academia-stat-etiqueta">Gaps</span><span className="academia-stat-valor academia-negativo"><CountUp valor={stats.gaps} decimales={0} /></span></div>
          <div className="academia-stat"><span className="academia-stat-etiqueta">Cobertura</span><span className="academia-stat-valor"><CountUp valor={stats.cobertura} decimales={1} sufijo=" %" /></span></div>
          <div className="academia-stat"><span className="academia-stat-etiqueta">Rango</span><span className="academia-stat-valor">{stats.min.toFixed(2)}–{stats.max.toFixed(2)}</span></div>
        </div>
      </Reveal>
      <Reveal retraso={200}>
        <div className="academia-filtros" role="group" aria-label="Modo de resampleo">
          <button type="button" className={`academia-chip${modo === "crudo" ? " academia-chip-activo" : ""}`} onClick={() => setModo("crudo")}>
            Crudo (NaN visible)
          </button>
          <button type="button" className={`academia-chip${modo === "ffill" ? " academia-chip-activo" : ""}`} onClick={() => setModo("ffill")}>
            Resampleo ffill
          </button>
          <label className="academia-check-lineal">
            <input type="checkbox" checked={soloGaps} onChange={(e) => setSoloGaps(e.target.checked)} /> Solo gaps
          </label>
        </div>
        <p className="academia-viz-sub">
          {modo === "crudo"
            ? "Modo crudo: los huecos quedan como NaN — pandas los excluye de medias y retornos."
            : "Modo ffill: cada gap hereda el último precio válido — útil para graficar, peligroso para entrenar."}
        </p>
        <div className="academia-tabla-scroll" style={{ maxHeight: "320px", overflowY: "auto" }}>
          <table className="academia-tabla">
            <thead><tr><th>Hora</th><th>Precio</th><th>Volumen</th><th>Estado</th></tr></thead>
            <tbody>
              {filas.map((f) => (
                <tr key={f.ts} className={f.esGap ? "academia-fila-gap" : undefined}>
                  <td>{f.ts.slice(5).replace(" ", " · ")}</td>
                  <td>{f.mostrado == null ? "—" : f.mostrado.toFixed(2)}{f.rellenado ? " ↩" : ""}</td>
                  <td>{f.volumen == null ? "—" : f.volumen.toFixed(1)}</td>
                  <td>{f.esGap ? (modo === "ffill" ? "⚠ rellenado" : "✗ gap") : "✓ ok"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="academia-viz-nota">df.resample(&quot;1h&quot;).ffill() tapa {stats.gaps} huecos · df.dropna() los elimina. Elige según el uso.</p>
      </Reveal>
    </div>
  );
}
