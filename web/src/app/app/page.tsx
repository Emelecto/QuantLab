"use client";

import Link from "next/link";
import { useAuth } from "@/lib/useAuth";
import { AuthGuard } from "@/lib/AuthGuard";
import { buttonClasses } from "@/components/ui/Button";
import { getRuns } from "@/lib/runs";
import { fetchMarketSeries } from "@/components/studio/marketData";
import { useEffect, useMemo, useState } from "react";
import type { BacktestResult } from "@/lib/api";

function MetricCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "long" | "short";
}) {
  return (
    <div className="ql-glass ql-elev-1 rounded-lg px-4 py-4">
      <div className="metric text-[11px] uppercase tracking-wide text-muted">
        {label}
      </div>
      <div
        className={`metric mt-1.5 text-2xl font-semibold ${
          tone === "long" ? "text-long" : tone === "short" ? "text-short" : "text-ink"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function DashboardContent() {
  const { user, signOut } = useAuth();
  const email = user?.email ?? "";
  const [displayName, setDisplayName] = useState<string>("");
  const [runs, setRuns] = useState<BacktestResult[]>([]);

  // Carga el nombre a mostrar desde profiles (username > display_name > email).
  useEffect(() => {
    let active = true;
    (async () => {
      const { createBrowserSupabaseClient } = await import("@/lib/supabase/client");
      const supabase = createBrowserSupabaseClient();
      const { data } = await supabase
        .from("profiles")
        .select("username, display_name")
        .maybeSingle();
      if (active && data) {
        setDisplayName(data.display_name || data.username || "");
      }
    })();
    return () => {
      active = false;
    };
  }, [user?.id]);

  const greeting = displayName || email.split("@")[0] || "trader";

  // B7: % de estrategias que superaron al benchmark (buy & hold real).
  const [beatPct, setBeatPct] = useState<number | null>(null);
  const [beatLoading, setBeatLoading] = useState(false);

  useEffect(() => {
    setRuns(getRuns());
  }, []);

  useEffect(() => {
    if (runs.length === 0) {
      setBeatPct(null);
      return;
    }
    let active = true;
    setBeatLoading(true);
    (async () => {
      // Una sola consulta de benchmark por (activo, símbolo, timeframe).
      const keys = new Map<
        string,
        { asset_type: "crypto" | "stock"; symbol: string; timeframe: string }
      >();
      for (const r of runs) {
        const k = `${r.config.asset_type}|${r.config.symbol}|${r.config.timeframe}`;
        if (!keys.has(k)) {
          keys.set(k, {
            asset_type: r.config.asset_type,
            symbol: r.config.symbol,
            timeframe: r.config.timeframe,
          });
        }
      }
      const bench = new Map<string, number | null>();
      await Promise.all(
        [...keys.entries()].map(async ([k, v]) => {
          try {
            const series = await fetchMarketSeries(
              v.asset_type,
              v.symbol,
              v.timeframe,
            );
            if (!series.closes.length) {
              bench.set(k, null);
              return;
            }
            bench.set(k, series.closes[series.closes.length - 1] / series.closes[0]);
          } catch {
            bench.set(k, null);
          }
        }),
      );
      if (!active) return;

      let beats = 0;
      let total = 0;
      for (const r of runs) {
        const curve = (r.equity_curve ?? []).filter((p) => p.oos != null);
        if (!curve.length) continue;
        const stratMult = curve[curve.length - 1].oos as number;
        const k = `${r.config.asset_type}|${r.config.symbol}|${r.config.timeframe}`;
        const b = bench.get(k);
        if (b == null) continue;
        total += 1;
        if (stratMult > b) beats += 1;
      }
      setBeatPct(total ? Math.round((beats / total) * 100) : null);
      setBeatLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [runs]);

  // B7: mejor Deflated Sharpe OOS del usuario.
  const bestDeflated = useMemo(() => {
    const vals = runs
      .map((r) => r.metrics.deflated_sharpe_oos)
      .filter((v): v is number => typeof v === "number");
    if (!vals.length) return null;
    return Math.max(...vals);
  }, [runs]);

  return (
    <main className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b border-line bg-bg/70 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-8 px-6">
          <Link
            href="/app"
            className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-ink"
          >
            <span
              aria-hidden
              className="ql-glow-box inline-block h-2.5 w-2.5 rounded-sm bg-accent"
            />
            QuantLab
          </Link>
          <span className="text-sm text-muted">Dashboard</span>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm text-muted sm:inline">{email}</span>
            <button
              onClick={signOut}
              className="text-sm font-medium text-muted transition-colors hover:text-ink"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto w-full max-w-5xl flex-1 px-6 py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-ink">
              Hola {greeting}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
              Crea una estrategia, pruébala con datos reales y mira si
              sobrevive a datos que nunca vio. Sin overfitting.
            </p>
          </div>
          <Link
            href="/app/strategies/new"
            className={buttonClasses("primary", "lg")}
          >
            Nueva estrategia
          </Link>
        </div>

        {/* B7: tarjetas resumen */}
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <MetricCard
            label="Estrategias"
            value={String(runs.length)}
          />
          <MetricCard
            label="Mejor Deflated Sharpe OOS"
            value={bestDeflated != null ? bestDeflated.toFixed(2) : "—"}
            tone={bestDeflated != null ? (bestDeflated >= 0 ? "long" : "short") : undefined}
          />
          <MetricCard
            label="% que superó al benchmark"
            value={beatPct == null ? (beatLoading ? "…" : "—") : `${beatPct}%`}
          />
        </div>

        <div className="mt-12">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Backtests recientes
          </h2>
          {runs.length === 0 ? (
            /* B5: estado vacío amable */
            <div className="ql-glass ql-elev-1 mt-4 flex flex-col items-center gap-4 rounded-xl px-6 py-14 text-center">
              <span
                aria-hidden
                className="flex h-14 w-14 items-center justify-center rounded-full border border-accent/30 bg-accent/10 text-accent"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-7 w-7"
                >
                  <path d="M3 3v18h18" />
                  <path d="M7 14l3-4 3 3 4-6" />
                  <circle cx="17" cy="7" r="1.4" fill="currentColor" stroke="none" />
                </svg>
              </span>
              <div>
                <h3 className="text-lg font-semibold text-ink">
                  Crea tu primera estrategia
                </h3>
                <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-muted">
                  Aún no tienes estrategias. Escribe una idea, pruébala con datos
                  reales y descubre si sobrevive fuera de muestra.
                </p>
              </div>
              <Link
                href="/app/strategies/new"
                className={buttonClasses("primary", "md")}
              >
                Crear estrategia
              </Link>
            </div>
          ) : (
            <ul className="mt-4 flex flex-col gap-2">
              {runs.slice(0, 8).map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/app/strategies/${r.id}/results`}
                    className="ql-glass ql-elev-1 flex items-center justify-between rounded-lg px-4 py-3 transition-all hover:border-accent hover:ql-elev-2"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-medium text-ink">
                        {r.config.symbol}
                      </span>
                      <span className="text-xs text-muted">
                        {r.config.asset_type === "crypto" ? "Cripto" : "Acción"} ·{" "}
                        {r.created_at.slice(0, 10)}
                      </span>
                    </div>
                    <span
                      className={`metric text-sm font-medium ${
                        r.metrics.sharpe_oos >= 0 ? "text-long" : "text-short"
                      }`}
                    >
                      Sharpe OOS {r.metrics.sharpe_oos.toFixed(2)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}

export default function AppDashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}
