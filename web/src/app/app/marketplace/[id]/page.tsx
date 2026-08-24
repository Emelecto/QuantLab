"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { EquityChart, DrawdownChart } from "@/components/EquityChart";
import { Badge } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";
import { getMarketplaceStrategy, type MarketplaceStrategy } from "@/lib/tokens";
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
      <div className="metric text-[11px] uppercase tracking-wide text-muted">
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

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={`text-sm ${i <= Math.round(rating) ? "text-accent" : "text-line"}`}
        >
          ★
        </span>
      ))}
      <span className="metric ml-1 text-xs text-muted">{rating.toFixed(1)}</span>
    </span>
  );
}

export default function StrategyDetailPage() {
  const params = useParams<{ id: string }>();
  const [strategy, setStrategy] = useState<MarketplaceStrategy | null>(null);
  const [run, setRun] = useState<BacktestResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    let active = true;
    getMarketplaceStrategy(params.id)
      .then((res) => {
        if (!active) return;
        setStrategy(res);
        if (res) {
          return getPublicStrategy(res.id);
        }
        return null;
      })
      .then((publicData) => {
        if (!active || !publicData) return;
        if (publicData.run) {
          setRun(supabaseRunToResult(publicData.strategy, publicData.run));
        }
      })
      .catch(() => undefined)
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [params.id]);

  async function handleSubscribe() {
    setSubscribing(true);
    // TODO: Integrar pasarela de pago / cobro QP
    await new Promise((r) => setTimeout(r, 600));
    setSubscribing(false);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center text-muted">
        Cargando…
      </main>
    );
  }

  if (!strategy) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6">
        <p className="text-muted">Estrategia no encontrada.</p>
        <Link href="/app/marketplace" className={buttonClasses("secondary", "sm")}>
          Volver al marketplace
        </Link>
      </main>
    );
  }

  const m = run?.metrics;
  const equity = run?.equity_curve ?? [];

  return (
    <main className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b border-line bg-bg/70 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-4 px-6">
          <Link
            href="/app/marketplace"
            className="text-[15px] font-semibold tracking-tight text-ink"
          >
            ← Marketplace
          </Link>
          <span className="text-sm text-muted">/ {strategy.title}</span>
        </div>
      </header>

      <section className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 mb-2">
              <span className="metric flex h-10 w-10 items-center justify-center rounded-full border border-line bg-[#1a2131] text-[14px] text-muted">
                {(strategy.author ?? "??").slice(0, 2).toUpperCase()}
              </span>
              <div>
                <Link
                  href={`/app/profile/${strategy.author_id}`}
                  className="metric text-sm text-muted hover:text-accent transition-colors"
                >
                  @{strategy.author ?? "anónimo"}
                </Link>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge tone="cyan" mono>
                    {strategy.asset_type === "crypto" ? "Cripto" : "Acción"}
                  </Badge>
                  <Badge tone="neutral" mono>
                    {strategy.symbol}
                  </Badge>
                </div>
              </div>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">
              {strategy.title}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted max-w-2xl">
              {strategy.description}
            </p>
            <div className="mt-3 flex items-center gap-4">
              <StarRating rating={strategy.rating ?? 0} />
              <span className="metric text-xs text-muted">
                {strategy.subscribers ?? 0} suscriptores
              </span>
            </div>
          </div>

          {/* Card de suscripción */}
          <div className="ql-glass ql-tier-featured ql-elev-2 w-72 shrink-0 rounded-xl p-5">
            <p className="metric text-[10px] uppercase tracking-wider text-muted">
              Precio semanal
            </p>
            <p className="metric text-accent ql-glow-text text-2xl font-bold mt-1">
              {strategy.price_qp} QP
              <span className="text-xs font-normal text-muted">/sem</span>
            </p>
            <button
              type="button"
              onClick={handleSubscribe}
              disabled={subscribing}
              className={buttonClasses("primary", "lg", "w-full mt-4")}
            >
              {subscribing ? "Procesando…" : `Suscribirse (${strategy.price_qp} QP/sem)`}
            </button>
            <p className="metric text-[10px] text-muted mt-2 text-center">
              Cancela cuando quieras
            </p>
          </div>
        </div>

        {/* Métricas rápidas */}
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <Metric
            label="Sharpe OOS"
            value={m ? m.sharpe_oos.toFixed(2) : (strategy.sharpe?.toFixed(2) ?? "—")}
            tone={m ? (m.sharpe_oos >= 0 ? "long" : "short") : undefined}
          />
          <Metric
            label="Max Drawdown"
            value={m ? `${(m.maxdd * 100).toFixed(1)}%` : (strategy.max_dd != null ? `${strategy.max_dd.toFixed(1)}%` : "—")}
            tone="short"
          />
          <Metric
            label="Win Rate"
            value={m ? `${(m.winrate * 100).toFixed(0)}%` : "—"}
          />
          <Metric
            label="Trades"
            value={m ? String(m.n_trades) : "—"}
          />
          <Metric
            label="Retorno total"
            value={m ? `${(m.ret_total * 100).toFixed(1)}%` : "—"}
            tone={m ? (m.ret_total >= 0 ? "long" : "short") : undefined}
          />
        </div>

        {/* Curva de equity */}
        {equity.length > 0 && (
          <div className="ql-glass ql-elev-2 mt-8 rounded-xl p-6">
            <h2 className="mb-4 text-sm font-semibold tracking-tight text-ink">
              Curva de equity (backtest)
            </h2>
            <EquityChart curve={equity} height={260} />
            <h3 className="mt-6 mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
              Drawdown
            </h3>
            <DrawdownChart data={equity} height={120} />
          </div>
        )}

        {/* Código o descripción completa */}
        <div className="ql-glass ql-elev-1 mt-8 rounded-xl p-6">
          <h2 className="mb-4 text-sm font-semibold tracking-tight text-ink">
            {strategy.is_public && strategy.code ? "Código fuente" : "Descripción"}
          </h2>
          {strategy.is_public && strategy.code ? (
            <pre className="overflow-x-auto rounded-lg bg-bg/60 border border-line p-4 text-[12px] font-mono text-muted leading-relaxed max-h-[400px] overflow-y-auto">
              <code>{strategy.code}</code>
            </pre>
          ) : (
            <p className="text-sm leading-relaxed text-muted">
              {strategy.description}
              {"\n\n"}
              El código fuente es privado. Al suscribirte recibes las señales
              generadas por la estrategia en tiempo real.
            </p>
          )}
        </div>

        {/* Panel de señales recientes (placeholder) */}
        <div className="mt-8">
          <h2 className="mb-4 text-sm font-semibold tracking-tight text-ink">
            Señales recientes
          </h2>
          <div className="ql-glass ql-elev-1 rounded-xl px-6 py-10 text-center">
            <p className="text-sm text-muted">
              Las señales aparecerán aquí al suscribirte.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}