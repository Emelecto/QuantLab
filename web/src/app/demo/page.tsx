"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { QuantChart, type QuantPoint } from "@/components/charts/QuantChart";
import { buttonClasses } from "@/components/ui/Button";

interface DemoResult {
  success: boolean;
  config: { fast: number; slow: number };
  result: {
    metrics: {
      sharpe_oos: number;
      sharpe_is: number;
      deflated_sharpe_oos: number;
      ret_total: number;
      maxdd: number;
      n_trades: number;
      winrate: number;
      calmar: number;
      vol: number;
    };
    integrity_label: string;
    equity_curve: Array<{ t: string; oos?: number }>;
    report: string;
    data_hash: string;
    folds_used: number;
  };
}

function Slider({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-ink">{label}</label>
        <span className="metric text-sm font-bold text-accent">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer bg-line accent-[var(--ql-accent)]"
      />
      <div className="flex justify-between text-[11px] text-muted">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "positive" | "negative" | "neutral";
}) {
  const toneClass =
    tone === "positive"
      ? "text-long"
      : tone === "negative"
        ? "text-short"
        : "text-accent";
  return (
    <div className="ql-glass ql-elev-1 rounded-lg p-3">
      <p className="text-[11px] uppercase tracking-wider text-muted">{label}</p>
      <p className={`metric text-lg font-bold ${toneClass}`}>{value}</p>
    </div>
  );
}

export default function DemoPage() {
  const [fast, setFast] = useState(20);
  const [slow, setSlow] = useState(50);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DemoResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runBacktest = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/demo?fast=${fast}&slow=${slow}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Error al ejecutar el backtest");
        return;
      }
      setResult(json);
    } catch (e: any) {
      setError(e.message || "Error de conexión");
    } finally {
      setLoading(false);
    }
  }, [fast, slow]);

  const points: QuantPoint[] = result?.result.equity_curve
    ? result.result.equity_curve.map((p) => ({
        t: p.t,
        oos: p.oos ?? null,
      }))
    : [];

  const metrics = result?.result.metrics;
  const retTotal = metrics ? metrics.ret_total * 100 : 0;
  const maxdd = metrics ? metrics.maxdd * 100 : 0;

  return (
    <main className="flex min-h-screen flex-col">
      <section className="border-b border-line">
        <div className="mx-auto w-full max-w-5xl px-6 py-16">
          <h1 className="text-3xl font-semibold tracking-tight text-ink md:text-4xl">
            Prueba QuantLab{" "}
            <span className="text-accent">sin crear cuenta</span>
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted md:text-base">
            Ajusta los parámetros del cruce de medias móviles y mira cómo habría
            rendido tu estrategia en datos reales de BTC/USDT. Sin registro, sin
            compromiso.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
          {/* Panel de controles */}
          <div className="flex flex-col gap-6">
            <div className="ql-glass ql-elev-1 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-ink mb-4">
                Parámetros
              </h2>
              <div className="flex flex-col gap-5">
                <Slider
                  label="Media rápida (fast)"
                  value={fast}
                  min={5}
                  max={50}
                  onChange={(v) => {
                    setFast(v);
                    if (slow <= v + 5) setSlow(Math.min(v + 5, 200));
                  }}
                />
                <Slider
                  label="Media lenta (slow)"
                  value={slow}
                  min={Math.min(fast + 5, 200)}
                  max={200}
                  onChange={setSlow}
                />
              </div>
              <button
                type="button"
                onClick={runBacktest}
                disabled={loading}
                className={buttonClasses("primary", "lg") + " w-full mt-6"}
              >
                {loading ? "Ejecutando..." : "Correr backtest"}
              </button>
            </div>

            {/* Tips */}
            <div className="ql-glass ql-elev-1 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-ink mb-2">Tips</h3>
              <ul className="text-xs text-muted space-y-2">
                <li>
                  • <strong className="text-ink">Fast baja (5-15)</strong>: más
                  operaciones, más ruido
                </li>
                <li>
                  • <strong className="text-ink">Fast alta (30-50)</strong>: menos
                  operaciones, señales más limpias
                </li>
                <li>
                  • <strong className="text-ink">Slow &gt; Fast + 20</strong>:
                  evita señales falsas
                </li>
              </ul>
            </div>
          </div>

          {/* Resultados */}
          <div className="flex flex-col gap-6">
            {error && (
              <div className="rounded-md border border-short/30 bg-short/10 px-4 py-3 text-sm text-short">
                {error}
              </div>
            )}

            {!result && !error && (
              <div className="ql-glass ql-elev-1 rounded-xl px-6 py-16 text-center">
                <p className="text-muted">
                  Ajusta los parámetros y presiona{" "}
                  <strong className="text-ink">Correr backtest</strong> para ver
                  el resultado.
                </p>
              </div>
            )}

            {result && metrics && (
              <>
                {/* Métricas principales */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <MetricCard
                    label="Retorno OOS"
                    value={`${retTotal >= 0 ? "+" : ""}${retTotal.toFixed(1)}%`}
                    tone={retTotal >= 0 ? "positive" : "negative"}
                  />
                  <MetricCard
                    label="Sharpe OOS"
                    value={metrics.sharpe_oos.toFixed(2)}
                    tone={metrics.sharpe_oos > 1 ? "positive" : "neutral"}
                  />
                  <MetricCard
                    label="Max Drawdown"
                    value={`${maxdd.toFixed(1)}%`}
                    tone={maxdd > -20 ? "positive" : "negative"}
                  />
                  <MetricCard
                    label="Operaciones"
                    value={String(metrics.n_trades)}
                  />
                </div>

                {/* Equity curve */}
                <div className="ql-glass ql-elev-1 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-ink mb-3">
                    Curva de equity (out-of-sample)
                  </h3>
                  {points.length > 0 ? (
                    <QuantChart points={points} height={280} showRanges={false} />
                  ) : (
                    <p className="text-sm text-muted text-center py-10">
                      Sin datos de equity
                    </p>
                  )}
                </div>

                {/* Reporte */}
                <div className="ql-glass ql-elev-1 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-ink mb-2">
                    Reporte
                  </h3>
                  <p className="text-sm text-muted leading-relaxed">
                    {result.result.report}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs">
                    <span className="rounded border border-line bg-surface px-2 py-1 text-muted">
                      Integridad:{" "}
                      <strong
                        className={
                          result.result.integrity_label === "Alta"
                            ? "text-long"
                            : result.result.integrity_label === "Baja"
                              ? "text-short"
                              : "text-ink"
                        }
                      >
                        {result.result.integrity_label}
                      </strong>
                    </span>
                    <span className="rounded border border-line bg-surface px-2 py-1 text-muted">
                      Folds: {result.result.folds_used}
                    </span>
                    <span className="rounded border border-line bg-surface px-2 py-1 text-muted">
                      Win rate: {(metrics.winrate * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                {/* CTA */}
                <div className="ql-glass ql-elev-1 rounded-xl p-6 text-center">
                  <h3 className="text-lg font-semibold text-ink mb-2">
                    ¿Te gustó? Guarda tus estrategias y compite
                  </h3>
                  <p className="text-sm text-muted mb-4">
                    Crea una cuenta gratuita para guardar tus backtests,
                    participar en torneos y ganar QP.
                  </p>
                  <div className="flex flex-wrap justify-center gap-3">
                    <Link
                      href="/register"
                      className={buttonClasses("primary", "lg")}
                    >
                      Crear cuenta gratis
                    </Link>
                    <Link
                      href="/"
                      className={buttonClasses("secondary", "lg")}
                    >
                      Ver landing
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <div className="border-t border-line">
        <div className="mx-auto w-full max-w-5xl px-6 py-4">
          <p className="text-[11px] text-muted">
            QuantLab es una herramienta de investigación. No es asesoría
            financiera ni recomendación de inversión. El rendimiento pasado no
            garantiza resultados futuros.
          </p>
        </div>
      </div>
    </main>
  );
}
