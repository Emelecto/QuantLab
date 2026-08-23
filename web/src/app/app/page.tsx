"use client";

import Link from "next/link";
import { useAuth } from "@/lib/useAuth";
import { AuthGuard } from "@/lib/AuthGuard";
import { buttonClasses } from "@/components/ui/Button";
import { getRuns } from "@/lib/runs";
import { useEffect, useState } from "react";
import type { BacktestResult } from "@/lib/api";

function DashboardContent() {
  const { user, signOut } = useAuth();
  const email = user?.email ?? "";
  const [runs, setRuns] = useState<BacktestResult[]>([]);

  useEffect(() => {
    setRuns(getRuns());
  }, []);

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
              Hola {email || "trader"}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
              Crea una estrategia, pruébala con datos reales y mira si
              sobrevive a datos que nunca vio. Sin overfitting.
            </p>
          </div>
          <Link href="/app/strategies/new" className={buttonClasses("primary", "lg")}>
            Nueva estrategia
          </Link>
        </div>

        <div className="mt-12">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Backtests recientes
          </h2>
          {runs.length === 0 ? (
            <div className="ql-glass ql-elev-1 mt-4 rounded-lg p-8 text-center text-sm text-muted">
              Aún no has corrido ningún backtest. Crea tu primera estrategia.
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
