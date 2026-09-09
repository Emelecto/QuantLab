"use client";

/**
 * C4-L1 · Calculadora de sizing — sliders cuenta/riesgo/stop → tamaño de posición.
 * Datos reales de muestra (c4_l1.csv): cuenta 10 000, riesgo 1–2 %.
 */
import { useMemo, useState } from "react";
import { CountUp, Reveal } from "./charts";
import { C4_SIZING } from "./lesson-data";

export default function C4L1Visual() {
  const [cuenta, setCuenta] = useState(10000);
  const [riesgoPct, setRiesgoPct] = useState(1);
  const [stop, setStop] = useState(450);

  const calc = useMemo(() => {
    const riesgoUsd = (cuenta * riesgoPct) / 100;
    const qty = stop > 0 ? riesgoUsd / stop : 0;
    return { riesgoUsd, qty };
  }, [cuenta, riesgoPct, stop]);

  return (
    <div className="academia-viz">
      <Reveal>
        <p className="academia-viz-titulo">Calculadora de tamaño de posición</p>
        <p className="academia-viz-sub">
          Arriesga un % fijo de tu cuenta por trade. Cantidad = (cuenta × riesgo %) ÷ distancia al stop.
        </p>
      </Reveal>
      <Reveal retraso={120}>
        <div className="academia-simulador-grid">
          <div className="academia-control">
            <label htmlFor="ac-c4l1-cuenta">Cuenta: ${cuenta.toLocaleString("es-MX")}</label>
            <input id="ac-c4l1-cuenta" type="range" min={1000} max={100000} step={1000} value={cuenta}
              onChange={(e) => setCuenta(Number(e.target.value))} className="academia-deslizador" />
          </div>
          <div className="academia-control">
            <label htmlFor="ac-c4l1-riesgo">Riesgo por trade: {riesgoPct} %</label>
            <input id="ac-c4l1-riesgo" type="range" min={0.25} max={5} step={0.25} value={riesgoPct}
              onChange={(e) => setRiesgoPct(Number(e.target.value))} className="academia-deslizador" />
          </div>
          <div className="academia-control">
            <label htmlFor="ac-c4l1-stop">Distancia al stop: ${stop}</label>
            <input id="ac-c4l1-stop" type="range" min={50} max={2000} step={10} value={stop}
              onChange={(e) => setStop(Number(e.target.value))} className="academia-deslizador" />
          </div>
        </div>
      </Reveal>
      <Reveal retraso={200}>
        <div className="academia-stat-grid academia-stat-grid-3">
          <div className="academia-stat"><span className="academia-stat-etiqueta">Riesgo en USD</span><span className="academia-stat-valor"><CountUp valor={calc.riesgoUsd} decimales={0} prefijo="$" /></span></div>
          <div className="academia-stat"><span className="academia-stat-etiqueta">Tamaño (BTC)</span><span className="academia-stat-valor"><CountUp valor={calc.qty} decimales={4} /></span></div>
          <div className="academia-stat"><span className="academia-stat-etiqueta">Rachas de 10 stops</span><span className="academia-stat-valor academia-negativo"><CountUp valor={riesgoPct * 10} decimales={1} prefijo="−" sufijo=" %" /></span></div>
        </div>
        {riesgoPct > 2 && <p className="academia-viz-nota">⚠ Riesgo alto: con {riesgoPct} % por trade, 10 pérdidas seguidas recortan {riesgoPct * 10} % de la cuenta.</p>}
      </Reveal>
      <Reveal retraso={280}>
        <p className="academia-viz-graf-titulo">Muestra real · sizing BTC (c4_l1.csv)</p>
        <div className="academia-tabla-scroll">
          <table className="academia-tabla">
            <thead><tr><th>#</th><th>Riesgo %</th><th>Entrada</th><th>Stop</th><th>Riesgo USD</th><th>Tamaño</th></tr></thead>
            <tbody>
              {C4_SIZING.map((t) => (
                <tr key={t.trade}>
                  <td>{t.trade}</td><td>{t.riesgoPct.toFixed(1)} %</td>
                  <td>{t.entrada.toLocaleString("es-MX", { maximumFractionDigits: 0 })}</td>
                  <td>{t.stop.toLocaleString("es-MX", { maximumFractionDigits: 0 })}</td>
                  <td>${t.riesgoUsd.toFixed(0)}</td><td><strong>{t.tamano.toFixed(4)}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Reveal>
    </div>
  );
}
