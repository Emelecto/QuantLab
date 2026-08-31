import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MARKET_RANGES = {
  "30d": { label: "30 días", limit: 30 },
  "90d": { label: "90 días", limit: 90 },
  "1y": { label: "1 año", limit: 365 },
} as const;

type MarketRange = keyof typeof MARKET_RANGES;

type MarketCandle = {
  time: number;
  close: number;
};

const noStoreHeaders = {
  "Cache-Control": "no-store, max-age=0",
};

function isMarketRange(value: string): value is MarketRange {
  return Object.prototype.hasOwnProperty.call(MARKET_RANGES, value);
}

function parseKline(value: unknown): MarketCandle | null {
  if (!Array.isArray(value)) return null;

  const time = Number(value[0]);
  const close = Number(value[4]);

  if (!Number.isSafeInteger(time) || time <= 0 || !Number.isFinite(close) || close <= 0) {
    return null;
  }

  return { time, close };
}

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: noStoreHeaders });
}

/**
 * Proxy acotado para el demo público: no acepta símbolos, intervalos ni URLs arbitrarias.
 * Así el cliente solo puede solicitar BTCUSDT diario en uno de los rangos visibles.
 */
export async function GET(request: NextRequest) {
  const requestedRange = request.nextUrl.searchParams.get("range") ?? "90d";

  if (!isMarketRange(requestedRange)) {
    return errorResponse("Rango de mercado no válido.", 400);
  }

  const range = MARKET_RANGES[requestedRange];
  const endpoint = new URL("https://api.binance.com/api/v3/klines");
  endpoint.searchParams.set("symbol", "BTCUSDT");
  endpoint.searchParams.set("interval", "1d");
  endpoint.searchParams.set("limit", String(range.limit));

  try {
    const response = await fetch(endpoint, {
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Binance respondió ${response.status}`);
    }

    const payload: unknown = await response.json();
    if (!Array.isArray(payload)) {
      throw new Error("Binance devolvió una respuesta inválida");
    }

    const parsed = payload
      .map(parseKline)
      .filter((candle): candle is MarketCandle => candle !== null)
      .sort((a, b) => a.time - b.time);

    const candles = parsed.filter(
      (candle, index) => index === 0 || candle.time !== parsed[index - 1].time,
    );

    if (candles.length < 2) {
      throw new Error("Binance no devolvió suficientes velas");
    }

    return NextResponse.json(
      {
        source: "Binance",
        symbol: "BTCUSDT",
        interval: "1d",
        range: requestedRange,
        period: `${candles.length} días`,
        fetchedAt: new Date().toISOString(),
        candles,
      },
      { headers: noStoreHeaders },
    );
  } catch {
    return errorResponse("No fue posible cargar los datos de Binance.", 502);
  }
}
