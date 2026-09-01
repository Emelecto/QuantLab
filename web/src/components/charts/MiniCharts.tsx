"use client";

/**
 * MiniCharts — curvas demo para la sección "Por qué no sobreajustes".
 * Misma tecnología que el hero (Lightweight Charts) pero en versión compacta,
 * con línea vertical marcando el corte train→OOS: la historia visual del overfitting.
 *
 * - OverfitMiniChart: sube perfecto in-sample, se desploma en OOS (rojo).
 * - OosMiniChart: sube modesto y sostenido cruzando el corte (verde).
 */

import { useEffect, useMemo, useRef } from "react";
import {
  createChart,
  ColorType,
  LineStyle,
  AreaSeries,
  LineSeries,
  LineSeriesOptions,
  type IChartApi,
  type UTCTimestamp,
} from "lightweight-charts";

const HEIGHT = 150;

/** PRNG determinista (mulberry32) — misma curva en cada render. */
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Pt = { time: UTCTimestamp; value: number };

function genDates(n: number): UTCTimestamp[] {
  const out: UTCTimestamp[] = [];
  const d = new Date(Date.UTC(2023, 0, 1));
  for (let i = 0; i < n; i++) {
    out.push(Math.floor(d.getTime() / 1000) as UTCTimestamp);
    d.setUTCDate(d.getUTCDate() + 7); // semanal
  }
  return out;
}

function useMiniChart(
  containerRef: React.RefObject<HTMLDivElement | null>,
  stratData: Pt[],
  splitIndex: number,
  crashAfterSplit?: boolean,
) {
  useEffect(() => {
    const el = containerRef.current;
    if (!el || stratData.length === 0) return;

    const chart = createChart(el, {
      height: HEIGHT,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#8b93a7",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 9,
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.03)" },
        horzLines: { color: "rgba(255,255,255,0.03)" },
      },
      rightPriceScale: { borderVisible: false, visible: false },
      // Sin eje temporal: la sección ya lo explica con texto; el gráfico es pura forma.
      timeScale: { borderVisible: false, visible: false },
      handleScroll: false,
      handleScale: false,
      crosshair: { mode: 0 },
    });

    const area = chart.addSeries(AreaSeries, {
      lineColor: "#eef2f7",
      topColor: "rgba(248,250,252,0.14)",
      bottomColor: "rgba(248,250,252,0.01)",
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
    });
    area.setData(stratData);

    // Línea vertical del corte train → OOS.
    const splitTime = stratData[splitIndex].time;
    const marker = chart.addSeries(LineSeries, {
      color: "rgba(139,147,167,0.45)",
      lineStyle: LineStyle.Dashed,
      lineWidth: 1,
      lastValueVisible: false,
      priceLineVisible: false,
    } as Partial<LineSeriesOptions>);
    marker.setData([
          { time: splitTime, value: Math.min(...stratData.map((p) => p.value)) * 0.98 },
          { time: splitTime, value: Math.max(...stratData.map((p) => p.value)) * 1.02 },
        ]);

    if (crashAfterSplit) {
      // Sombreado rojo tenue de la zona OOS (donde se desploma).
      const oosArea = chart.addSeries(AreaSeries, {
        lineColor: "rgba(239,68,68,0)",
        topColor: "rgba(239,68,68,0.10)",
        bottomColor: "rgba(239,68,68,0.02)",
        lineWidth: 1,
        lastValueVisible: false,
        priceLineVisible: false,
      });
      oosArea.setData(stratData.slice(splitIndex));
    }

    chart.timeScale().fitContent();

    return () => chart.remove();
  }, [stratData, splitIndex, crashAfterSplit]);
}

export function OverfitMiniChart() {
  const ref = useRef<HTMLDivElement>(null);

  // 52 semanas in-sample (subida casi perfecta con ruido mínimo) + 26 OOS (desplome).
  const data = useMemo<Pt[]>(() => {
    const rand = mulberry32(1337);
    const dates = genDates(78);
    const split = 52;
    const pts: Pt[] = [];
    let v = 1;
    for (let i = 0; i < 78; i++) {
      if (i < split) {
        v *= 1 + 0.028 + (rand() - 0.5) * 0.008; // subida casi perfecta
      } else {
        v *= 1 - 0.035 - rand() * 0.03; // desploma
      }
      pts.push({ time: dates[i], value: Number(v.toFixed(4)) });
    }
    void split;
    return pts;
  }, []);

  useMiniChart(ref, data, 52, true);
  return <div ref={ref} className="w-full" />;
}

export function OosMiniChart() {
  const ref = useRef<HTMLDivElement>(null);

  // Subida modesta y sostenida a través de ambos tramos; algo de ruido real.
  const data = useMemo<Pt[]>(() => {
    const rand = mulberry32(4242);
    const dates = genDates(78);
    const pts: Pt[] = [];
    let v = 1;
    for (let i = 0; i < 78; i++) {
      v *= 1 + 0.007 + (rand() - 0.5) * 0.02;
      pts.push({ time: dates[i], value: Number(v.toFixed(4)) });
    }
    return pts;
  }, []);

  useMiniChart(ref, data, 52, false);
  return <div ref={ref} className="w-full" />;
}
