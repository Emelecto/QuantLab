import Link from "next/link";

type Row = { date: string; open: number; high: number; low: number; close: number; volume: number };

interface DatasetMeta {
  id: string;
  name: string;
  symbol: string;
  source: "binance" | "yahoo";
  interval: "1d" | "1h" | "4h" | "1w";
  level: "beginner" | "advanced";
  assetClass: string;
  blurb: string;
  dateRange: string;
  frequency: string;
}

const MAP: Record<string, DatasetMeta> = {
  "btc-daily": { id: "btc-daily", name: "BTC/USD Diario", symbol: "BTCUSDT", source: "binance", interval: "1d", level: "beginner", assetClass: "Cripto", blurb: "Bitcoin en velas diarias. Datos reales desde Binance.", dateRange: "Tiempo real", frequency: "Diario" },
  "eth-daily": { id: "eth-daily", name: "ETH/USD Diario", symbol: "ETHUSDT", source: "binance", interval: "1d", level: "beginner", assetClass: "Cripto", blurb: "Ethereum diario. Datos reales desde Binance.", dateRange: "Tiempo real", frequency: "Diario" },
  "aapl-daily": { id: "aapl-daily", name: "AAPL Diario", symbol: "AAPL", source: "yahoo", interval: "1d", level: "beginner", assetClass: "Acciones", blurb: "Apple diario. Datos reales desde Yahoo Finance.", dateRange: "Tiempo real", frequency: "Diario" },
  "sp500-daily": { id: "sp500-daily", name: "S&P 500 (indice)", symbol: "^GSPC", source: "yahoo", interval: "1d", level: "advanced", assetClass: "Acciones", blurb: "Indice de referencia de EE.UU. Datos reales desde Yahoo Finance.", dateRange: "Tiempo real", frequency: "Diario" },
  "us-cpi-monthly": { id: "us-cpi-monthly", name: "IPC de EE.UU. Mensual", symbol: "CPI", source: "yahoo", interval: "1d", level: "advanced", assetClass: "Macro", blurb: "Inflacion mensual. Datos reales desde Yahoo Finance (proxy macro).", dateRange: "Tiempo real", frequency: "Diario" },
};

const INTERVALS = ["1d", "1h", "4h", "1w"] as const;
const LIMITS = [100, 250, 500, 1000] as const;
type Interval = (typeof INTERVALS)[number];
type Limit = (typeof LIMITS)[number];

function isInterval(value: string | undefined): value is Interval {
  return value !== undefined && (INTERVALS as readonly string[]).includes(value);
}

function isLimit(value: number): value is Limit {
  return LIMITS.includes(value as Limit);
}

function buildSearch(symbol: string, source: "binance" | "yahoo", interval: string, limit: number) {
  const p = new URLSearchParams({ symbol, source, interval, limit: String(limit) });
  return `/api/datasets/download?${p.toString()}`;
}

async function fetchRows(symbol: string, source: "binance" | "yahoo", interval: string, limit: number): Promise<{ rows: Row[]; error?: string }> {
  try {
    const params = new URLSearchParams({ symbol, source, interval, limit: String(limit) });
    const base =
      process.env.NEXT_PUBLIC_BASE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
    const url = `${base}/api/datasets?${params.toString()}`;
    const resp = await fetch(url, { signal: AbortSignal.timeout(20000) });
    if (!resp.ok) {
      const txt = await resp.text();
      return { rows: [], error: `HTTP ${resp.status}: ${txt.slice(0, 120)}` };
    }
    const json = await resp.json();
    return { rows: json.rows ?? [] };
  } catch (e) {
    return { rows: [], error: e instanceof Error ? e.message : "Error desconocido" };
  }
}

export default async function DatasetDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ interval?: string; limit?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const meta = MAP[id];

  if (!meta) {
    return (
      <div className="ql-learn-wrap">
        <div className="ql-glass" style={{ padding: 32, marginTop: 40, textAlign: "center" }}>
          <h2 style={{ color: "var(--ql-ink)" }}>Dataset no encontrado</h2>
          <p style={{ color: "var(--ql-muted)" }}>Id desconocido: {id}</p>
          <Link href="/app/library" className="btn-primary" style={{ display: "inline-block", marginTop: 16, textDecoration: "none" }}>Volver a Biblioteca</Link>
        </div>
      </div>
    );
  }

  const interval: Interval = isInterval(sp.interval) ? sp.interval : meta.interval;
  const requestedLimit = Number(sp.limit);
  const limit: Limit = isLimit(requestedLimit) ? requestedLimit : 500;

  const { rows, error } = await fetchRows(meta.symbol, meta.source, interval, limit);

  const currentUrl = `/app/library/${id}`;

  return (
    <div className="ql-learn-wrap">
      <div style={{ marginBottom: 16 }}>
        <Link href="/app/library" className="link-back">← Volver a Biblioteca</Link>
      </div>

      <div className="ql-glass" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div>
            <span className="lesson-kicker">{meta.assetClass} · {meta.level === "beginner" ? "Principiante" : "Avanzado"}</span>
            <h1 style={{ margin: "6px 0 4px", fontSize: 28, color: "var(--ql-ink)" }}>{meta.name}</h1>
            <p style={{ color: "var(--ql-muted)", margin: 0 }}>{meta.blurb}</p>
            <div className="lib-meta" style={{ marginTop: 8 }}>
              Fuente: <strong>{meta.source === "binance" ? "Binance" : "Yahoo Finance"}</strong> · Simbolo: <strong>{meta.symbol}</strong> · Intervalo: <strong>{interval}</strong> · Velas: <strong>{rows.length}</strong>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {INTERVALS.map((iv) => (
              <Link
                key={iv}
                href={`${currentUrl}?interval=${iv}&limit=${limit}`}
                className={`btn-secondary ${interval === iv ? "sel" : ""}`}
                style={{ textDecoration: "none" }}
              >
                {iv}
              </Link>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <label style={{ color: "var(--ql-muted)", fontSize: 13 }}>Limite:</label>
          <div style={{ display: "flex", gap: 6 }}>
            {LIMITS.map((l) => (
              <Link
                key={l}
                href={`${currentUrl}?interval=${interval}&limit=${l}`}
                className={`btn-secondary ${limit === l ? "sel" : ""}`}
                style={{ padding: "6px 12px", fontSize: 12, textDecoration: "none" }}
              >
                {l}
              </Link>
            ))}
          </div>
          <div style={{ flex: 1 }} />
          <a href={buildSearch(meta.symbol, meta.source, interval, limit)} className="btn-primary" style={{ textDecoration: "none" }}>
            Descargar CSV
          </a>
        </div>
      </div>

      {error && (
        <div className="ql-glass" style={{ padding: 20, marginBottom: 20, color: "var(--ql-short)" }}>
          <strong>Error al obtener datos:</strong> {error}
        </div>
      )}

      {rows.length === 0 && !error ? (
        <div className="ql-glass" style={{ padding: 40, textAlign: "center", color: "var(--ql-muted)" }}>
          No hay datos disponibles para estos parametros.
        </div>
      ) : (
        <div className="ql-glass" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ maxHeight: 560, overflowY: "auto" }}>
            <table className="ohclv">
              <thead>
                <tr>
                  <th>fecha</th>
                  <th>open</th>
                  <th>high</th>
                  <th>low</th>
                  <th>close</th>
                  <th>volume</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={`${r.date}-${i}`}>
                    <td>{r.date}</td>
                    <td>{r.open.toFixed(2)}</td>
                    <td>{r.high.toFixed(2)}</td>
                    <td>{r.low.toFixed(2)}</td>
                    <td>{r.close.toFixed(2)}</td>
                    <td>{r.volume.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="read-hint" style={{ marginTop: 12 }}>
        Datos reales en formato OHLCV. Mismos datos que usan los torneos y ejercicios de QuantLab.
      </p>
    </div>
  );
}