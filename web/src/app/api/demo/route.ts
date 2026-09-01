import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WORKER = process.env.NEXT_PUBLIC_WORKER_URL || "http://localhost:8001";

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * API de demo pública: ejecuta un backtest SMA crossover con parámetros simples.
 * No requiere autenticación. Limitado a parámetros seguros.
 * 
 * Query params:
 * - fast: ventana rápida (5-50, default 20)
 * - slow: ventana lenta (20-200, default 50)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  
  const fast = Math.max(5, Math.min(50, parseInt(searchParams.get("fast") || "20", 10)));
  const slow = Math.max(fast + 5, Math.min(200, parseInt(searchParams.get("slow") || "50", 10)));
  
  const end = new Date();
  const start = new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000);
  
  const config = {
    code: `fast=${fast},slow=${slow}`,
    asset_type: "crypto",
    symbol: "BTCUSDT",
    timeframe: "1d",
    capital: 10000,
    commission: 0.1,
    slippage: 0.0005,
    fast,
    slow,
    folds: 3,
    split: 70,
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
  };

  try {
    const res = await fetch(`${WORKER}/backtest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });

    const json = await res.json();
    
    if (!res.ok) {
      return errorResponse(json.error || "Error en el backtest", res.status);
    }

    return NextResponse.json({
      success: true,
      config: { fast, slow },
      result: json,
    });
  } catch (e: any) {
    return errorResponse(`Error de conexión: ${e.message}`, 502);
  }
}
