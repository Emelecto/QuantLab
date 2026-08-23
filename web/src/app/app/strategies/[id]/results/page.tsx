"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { EquityChart } from "@/components/EquityChart";
import { buttonClasses } from "@/components/ui/Button";
import { getRun } from "@/lib/runs";
import { getPublicStrategy, supabaseRunToResult } from "@/lib/db";
import type { BacktestResult } from "@/lib/api";

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "long" | "short";
}) {
  return (
    <div className="ql-glass ql-elev-1 rounded-lg px-4 py-3">
      <div className="text-[11px] uppercase tracking-wide text-muted">
        {label}
      </div>
      <div
        className={`metric mt-1 text-xl font-semibold ${
          tone === "long"
            ? "text-long"
            : tone === "short"
              ? "text-short"
              : "text-ink"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

export default function ResultsPage() {
  const params = useParams<{ id: string }>();
  const [run, setRun] = useState<BacktestResult | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // 1) Caché local (runs propios del editor).
    const local = getRun(params.id);
    if (local) {
      setRun(local);
      setLoaded(true);
      return;
    }
    // 2) Fallback: vista pública por strategy id (desde /community o /leaderboard).
    let active = true;
    getPublicStrategy(params.id)
      .then((res) => {
        if (!active) return;
        if (res && res.run) {
          setRun(supabaseRunToResult(res.strategy, res.run));
        }
        setLoaded(true);
      })
      .catch(() => active && setLoaded(true));
    return () => {
      active = false;
    };
  }, [params.id]);

  if (loaded && !run) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6">
        <p className="text-muted">Resultado no encontrado.</p>
        <Link href="/app" className={buttonClasses("secondary", "sm")}>
          Volver al dashboard
        </Link>
      </main>
    );
  }

  if (!run) {
    return (
      <main className="flex min-h-screen items-center justify-center text-muted">
        Cargando…
      </main>
    );
  }

  const m = run.metrics;
  const integrityHigh = run.integrity_label === "High";

  return (
    <main className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b border-line bg-bg/70 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-4 px-6">
          <Link
            href="/app"
            className="text-[15px] font-semibold tracking-tight text-ink"
          >
            QuantLab
          </Link>
          <span className="text-sm text-muted">
            / Resultado · {run.config.symbol}
          </span>
          <Link
            href="/app"
            className="ml-auto text-sm text-muted transition-colors hover:text-ink"
          >
            Volver
          </Link>
        </div>
      </header>

      <section className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">
              {run.config.symbol}
            </h1>
            <p className="mt-1 text-sm text-muted">
              {run.config.asset_type === "crypto" ? "Cripto" : "Acción"} ·{" "}
              {run.config.timeframe} · {run.config.start} → {run.config.end}
            </p>
          </div>
          <span
            className={`metric rounded-md border px-3 py-1.5 text-sm font-medium ${
              integrityHigh
                ? "border-long/40 bg-long/[0.08] text-long"
                : "border-short/40 bg-short/[0.08] text-short"
            }`}
          >
            Integridad: {run.integrity_label}
          </span>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <Metric
            label="Sharpe OOS"
            value={m.sharpe_oos.toFixed(2)}
            tone={m.sharpe_oos >= 0 ? "long" : "short"}
          />
          <Metric
            label="Deflated Sharpe OOS"
            value={m.deflated_sharpe_oos.toFixed(2)}
            tone={m.deflated_sharpe_oos >= 0 ? "long" : "short"}
          />
          <Metric label="Sortino" value={m.sortino.toFixed(2)} />
          <Metric
            label="Max Drawdown"
            value={`${(m.maxdd * 100).toFixed(1)}%`}
            tone="short"
          />
          <Metric
            label="Win Rate"
            value={`${(m.winrate * 100).toFixed(0)}%`}
          />
          <Metric label="Trades" value={String(m.n_trades)} />
          <Metric
            label="Retorno total"
            value={`${(m.ret_total * 100).toFixed(1)}%`}
            tone={m.ret_total >= 0 ? "long" : "short"}
          />
          <Metric
            label="Volatilidad"
            value={`${(m.vol * 100).toFixed(1)}%`}
          />
        </div>

        <div className="ql-glass ql-elev-2 mt-8 rounded-xl p-6">
          <h2 className="mb-4 text-sm font-semibold tracking-tight text-ink">
            Curva de equity
          </h2>
          <EquityChart curve={run.equity_curve} />
        </div>

        <div className="mt-8">
          <Link href="/app/strategies/new" className={buttonClasses("primary", "lg")}>
            Nuevo backtest
          </Link>
        </div>
      </section>
    </main>
  );
}
