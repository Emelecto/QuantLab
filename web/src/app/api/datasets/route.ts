import { NextRequest, NextResponse } from "next/server";

type Source = "binance" | "yahoo" | "auto";
type Interval = "1d" | "1h" | "4h" | "1w";

interface Row {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const CRYPTO_SYMBOLS = new Set([
  "BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT", "ADAUSDT", "DOGEUSDT",
  "BTCUSD", "ETHUSD", "BNBUSD", "SOLUSD", "XRPUSD", "ADAUSD", "DOGEUSD",
  "BTC", "ETH", "BNB", "SOL", "XRP", "ADA", "DOGE",
]);

function isCrypto(symbol: string): boolean {
  const s = symbol.toUpperCase().replace(/[^A-Z]/g, "");
  if (CRYPTO_SYMBOLS.has(symbol.toUpperCase())) return true;
  if (/^(BTC|ETH|BNB|SOL|XRP|ADA|DOGE|AVAX|MATIC|LINK|UNI|ATOM|LTC|DOT|TRX)/.test(s)) return true;
  if (/USDT$|USD$/.test(symbol.toUpperCase())) return true;
  return false;
}

function normalizeInterval(interval: string): Interval {
  const v = interval.toLowerCase();
  if (v === "1d" || v === "daily" || v === "1day") return "1d";
  if (v === "1h" || v === "1hour" || v === "hourly") return "1h";
  if (v === "4h" || v === "4hour") return "4h";
  if (v === "1w" || v === "weekly" || v === "1week") return "1w";
  return "1d";
}

function normalizeLimit(limit: string | null): number {
  const n = parseInt(limit ?? "500", 10);
  if (isNaN(n)) return 500;
  return Math.max(100, Math.min(1000, n));
}

async function fetchBinance(symbol: string, interval: Interval, limit: number): Promise<Row[]> {
  const url = `https://api.binance.com/api/v3/klines?symbol=${encodeURIComponent(symbol.toUpperCase())}&interval=${interval}&limit=${limit}`;
  const resp = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!resp.ok) throw new Error(`Binance ${resp.status}`);
  const data: unknown[][] = await resp.json();
  return data.map((k) => ({
    date: new Date(k[0] as number).toISOString(),
    open: parseFloat(k[1] as string),
    high: parseFloat(k[2] as string),
    low: parseFloat(k[3] as string),
    close: parseFloat(k[4] as string),
    volume: parseFloat(k[5] as string),
  }));
}

async function fetchYahoo(symbol: string, interval: Interval, limit: number): Promise<Row[]> {
  const yahooInterval = interval === "1w" ? "1wk" : interval === "4h" ? "1h" : interval === "1h" ? "1h" : "1d";
  const range = interval === "1h" ? "730d" : interval === "4h" ? "730d" : "max";
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${yahooInterval}`;
  const resp = await fetch(url, {
    signal: AbortSignal.timeout(15000),
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
  });
  if (!resp.ok) throw new Error(`Yahoo ${resp.status}`);
  const json: any = await resp.json();
  const result = json?.chart?.result?.[0];
  if (!result) throw new Error("Yahoo: sin datos");
  const timestamps: number[] = result.timestamp ?? [];
  const quote = result?.indicators?.quote?.[0];
  if (!quote) throw new Error("Yahoo: sin indicadores");
  const rows: Row[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    const o = quote.open?.[i];
    const h = quote.high?.[i];
    const l = quote.low?.[i];
    const c = quote.close?.[i];
    const v = quote.volume?.[i];
    if (o == null || h == null || l == null || c == null) continue;
    rows.push({
      date: new Date(timestamps[i] * 1000).toISOString(),
      open: o,
      high: h,
      low: l,
      close: c,
      volume: v ?? 0,
    });
  }
  return rows.slice(-limit);
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const symbol = (sp.get("symbol") ?? "BTCUSDT").trim();
  const interval = normalizeInterval(sp.get("interval") ?? "1d");
  const limit = normalizeLimit(sp.get("limit"));
  const source = (sp.get("source") ?? "auto").toLowerCase() as Source;

  const useBinance = source === "binance" || (source === "auto" && isCrypto(symbol));
  const useYahoo = source === "yahoo" || (source === "auto" && !isCrypto(symbol));

  let rows: Row[] = [];
  let usedSource = "";
  const errors: string[] = [];

  if (useBinance) {
    try {
      rows = await fetchBinance(symbol, interval, limit);
      usedSource = "binance";
    } catch (e) {
      errors.push(`binance: ${e instanceof Error ? e.message : "error"}`);
      if (source === "binance") {
        return NextResponse.json({ error: "Binance fallo", detail: errors }, { status: 502 });
      }
    }
  }

  if (usedSource === "" && useYahoo) {
    try {
      rows = await fetchYahoo(symbol, interval, limit);
      usedSource = "yahoo";
    } catch (e) {
      errors.push(`yahoo: ${e instanceof Error ? e.message : "error"}`);
    }
  }

  if (usedSource === "" && source === "auto" && !useBinance) {
    try {
      rows = await fetchBinance(symbol, interval, limit);
      usedSource = "binance";
    } catch (e) {
      errors.push(`binance-fallback: ${e instanceof Error ? e.message : "error"}`);
    }
  }

  if (rows.length === 0) {
    return NextResponse.json({ error: "No se pudieron obtener datos", detail: errors, symbol, interval, source }, { status: 502 });
  }

  return NextResponse.json(
    { source: usedSource, symbol: symbol.toUpperCase(), interval, rows },
    {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=60, stale-while-revalidate=30",
      },
    }
  );
}