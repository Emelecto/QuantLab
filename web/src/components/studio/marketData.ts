// Utilidades de datos de mercado SIN librerías externas y SIN API key.
// - Cripto: Binance público (/api/v3/klines).
// - Acciones: Yahoo Finance chart (/v8/finance/chart).
// Ambos usan fetch nativo del navegador. El llamador maneja errores de red/CORS.

export type AssetType = "crypto" | "stock";

export interface MarketSeries {
  /** Precios de cierre en orden cronológico. */
  closes: number[];
  /** Timestamps epoch ms alineados con `closes`. */
  times: number[];
}

/**
 * Descarga cierres reales. Lanza Error si la red falla o la respuesta es inválida
 * (el componente lo traduce a un mensaje amigable).
 */
export async function fetchMarketSeries(
  asset_type: AssetType,
  symbol: string,
  timeframe: string,
): Promise<MarketSeries> {
  if (asset_type === "crypto") {
    const url = `https://api.binance.com/api/v3/klines?symbol=${encodeURIComponent(
      symbol.toUpperCase(),
    )}&interval=${encodeURIComponent(timeframe)}&limit=200`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`Binance ${res.status}`);
    const raw = (await res.json()) as unknown[][];
    if (!Array.isArray(raw)) throw new Error("Binance: respuesta inválida");
    const closes: number[] = [];
    const times: number[] = [];
    for (const k of raw) {
      times.push(Number(k[0]));
      closes.push(Number(k[4])); // cierre
    }
    return { closes, times };
  }

  // Acciones vía Yahoo Finance (sin key).
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    symbol.toUpperCase(),
  )}?range=1y&interval=1d`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Yahoo ${res.status}`);
  const json = (await res.json()) as {
    chart?: { result?: Array<{ timestamp?: number[]; indicators?: { quote?: Array<{ close?: (number | null)[] }> } }> };
  };
  const result = json?.chart?.result?.[0];
  const closes = (result?.indicators?.quote?.[0]?.close ?? []).filter(
    (v): v is number => typeof v === "number" && !Number.isNaN(v),
  );
  const times = result?.timestamp ?? [];
  if (!closes.length) throw new Error("Yahoo: sin datos");
  return { closes, times: times.slice(0, closes.length) };
}

/** Devuelve solo los cierres (para normalizar un benchmark buy & hold). */
export async function fetchPrices(
  asset_type: AssetType,
  symbol: string,
  timeframe: string,
): Promise<number[]> {
  const series = await fetchMarketSeries(asset_type, symbol, timeframe);
  return series.closes;
}

/** Media móvil simple. Devuelve null hasta acumular `period` muestras. */
export function sma(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    if (i >= period - 1) out[i] = sum / period;
  }
  return out;
}

export type SignalType = "buy" | "sell";

export interface SignalPoint {
  index: number;
  type: SignalType;
  price: number;
}

/**
 * Señales por cruce de SMA: long cuando fast > slow.
 * Compra al pasar a long, venta al pasar a fuera de mercado.
 */
export function crossoverSignals(
  fast: (number | null)[],
  slow: (number | null)[],
  closes: number[],
): SignalPoint[] {
  const signals: SignalPoint[] = [];
  let inMarket = false;
  for (let i = 0; i < fast.length; i++) {
    const f = fast[i];
    const s = slow[i];
    if (f == null || s == null) continue;
    const longNow = f > s;
    if (longNow && !inMarket) {
      signals.push({ index: i, type: "buy", price: closes[i] });
      inMarket = true;
    } else if (!longNow && inMarket) {
      signals.push({ index: i, type: "sell", price: closes[i] });
      inMarket = false;
    }
  }
  return signals;
}

/** Extrae fast/slow del `code` (formato 'fast=XX,slow=YY'). Defaults si no está. */
export function parseFastSlow(code: string): { fast: number; slow: number } {
  const fast = Number(code.match(/fast\s*=\s*(\d+)/i)?.[1]);
  const slow = Number(code.match(/slow\s*=\s*(\d+)/i)?.[1]);
  return {
    fast: Number.isFinite(fast) && fast > 0 ? fast : 20,
    slow: Number.isFinite(slow) && slow > 0 ? slow : 50,
  };
}

/** Re-muestrea `src` a `n` puntos tomando índices equidistantes. */
export function resample(src: number[], n: number): number[] {
  if (n <= 1 || src.length === 0) return src.slice(0, n);
  if (src.length === n) return src.slice();
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const idx = Math.round((i / (n - 1)) * (src.length - 1));
    out.push(src[idx]);
  }
  return out;
}
