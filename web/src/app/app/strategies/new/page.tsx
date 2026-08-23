"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { StrategyEditor, DEFAULT_STRATEGY_CODE } from "@/components/Editor";
import { buttonClasses } from "@/components/ui/Button";
import {
  runBacktest,
  validateStrategy,
  BacktestError,
  type StrategyConfig,
  type BacktestResult,
} from "@/lib/api";
import { saveRun } from "@/lib/runs";
import { saveStrategy, saveBacktestRun } from "@/lib/db";

type AssetType = "crypto" | "stock";

const DEFAULTS: StrategyConfig = {
  code: DEFAULT_STRATEGY_CODE,
  asset_type: "crypto",
  symbol: "BTCUSDT",
  timeframe: "1d",
  start: "2023-01-01",
  end: "2023-12-31",
  capital: 1000,
  commission: 0.1,
  folds: 3,
  split: 70,
};

export default function NewStrategyPage() {
  const router = useRouter();
  const [config, setConfig] = useState<StrategyConfig>(DEFAULTS);
  const [isPublic, setIsPublic] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof StrategyConfig>(
    key: K,
    value: StrategyConfig[K],
  ) {
    setConfig((c) => ({ ...c, [key]: value }));
  }

  async function handleRun() {
    setError(null);
    setRunning(true);
    try {
      // Validación ligera (no bloquea si el worker no responde).
      const validation = await validateStrategy(config);
      if (!validation.valid) {
        setError(validation.warnings.join(" · "));
        setRunning(false);
        return;
      }
      const result = await runBacktest(config);
      const run: BacktestResult = {
        id: crypto.randomUUID(),
        config,
        created_at: new Date().toISOString(),
        metrics: result.metrics,
        integrity_label: result.integrity_label,
        equity_curve: result.equity_curve,
      };
      // Caché local (source of truth es Supabase, pero esto permite ver el
      // resultado de inmediato aunque falle la nube).
      saveRun(run);

      try {
        const strategyId = await saveStrategy(config, config.code, isPublic);
        await saveBacktestRun(strategyId, result);
      } catch (dbErr) {
        const msg = dbErr instanceof Error ? dbErr.message : "Error desconocido";
        if (msg === "AUTH_REQUIRED") {
          // Sin sesión: la estrategia no se puede guardar en la nube.
          router.push("/login");
          return;
        }
        setError(
          "El backtest salió bien, pero no se pudo guardar en la nube: " + msg,
        );
        setRunning(false);
        return;
      }

      router.push(`/app/strategies/${run.id}/results`);
    } catch (e) {
      const msg =
        e instanceof BacktestError
          ? e.message
          : "Ocurrió un error inesperado.";
      setError(msg);
      setRunning(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b border-line bg-bg/70 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-4 px-6">
          <Link
            href="/app"
            className="text-[15px] font-semibold tracking-tight text-ink"
          >
            QuantLab
          </Link>
          <span className="text-sm text-muted">/ Nueva estrategia</span>
          <Link
            href="/app"
            className="ml-auto text-sm text-muted transition-colors hover:text-ink"
          >
            Volver
          </Link>
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-6xl flex-1 gap-6 px-6 py-10 lg:grid-cols-[1fr_360px]">
        {/* Editor */}
        <div className="ql-glass ql-elev-2 overflow-hidden rounded-xl">
          <div className="flex items-center justify-between border-b border-line px-4 py-2">
            <span className="text-xs font-medium uppercase tracking-wide text-muted">
              strategy.py
            </span>
            <span className="text-xs text-muted">Python</span>
          </div>
          <StrategyEditor
            value={config.code}
            onChange={(v) => update("code", v)}
          />
        </div>

        {/* Panel de configuración */}
        <aside className="flex flex-col gap-4">
          <div className="ql-glass ql-elev-1 rounded-xl p-5">
            <h2 className="text-sm font-semibold tracking-tight text-ink">
              Configuración
            </h2>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-xs text-muted">
                Activo
                <select
                  className="ql-input rounded-md px-3 py-2 text-sm text-ink"
                  value={config.asset_type}
                  onChange={(e) =>
                    update("asset_type", e.target.value as AssetType)
                  }
                >
                  <option value="crypto">Cripto</option>
                  <option value="stock">Acción</option>
                </select>
              </label>

              <label className="flex flex-col gap-1 text-xs text-muted">
                Símbolo
                <input
                  className="ql-input rounded-md px-3 py-2 text-sm text-ink"
                  value={config.symbol}
                  placeholder="BTCUSDT / AAPL"
                  onChange={(e) => update("symbol", e.target.value.toUpperCase())}
                />
              </label>

              <label className="flex flex-col gap-1 text-xs text-muted">
                Timeframe
                <select
                  className="ql-input rounded-md px-3 py-2 text-sm text-ink"
                  value={config.timeframe}
                  onChange={(e) =>
                    update("timeframe", e.target.value as StrategyConfig["timeframe"])
                  }
                >
                  <option value="1d">1d</option>
                  <option value="4h">4h</option>
                  <option value="1h">1h</option>
                </select>
              </label>

              <label className="flex flex-col gap-1 text-xs text-muted">
                Capital (USDT)
                <input
                  type="number"
                  className="ql-input rounded-md px-3 py-2 text-sm text-ink"
                  value={config.capital}
                  onChange={(e) => update("capital", Number(e.target.value))}
                />
              </label>

              <label className="flex flex-col gap-1 text-xs text-muted">
                Desde
                <input
                  type="date"
                  className="ql-input rounded-md px-3 py-2 text-sm text-ink"
                  value={config.start}
                  onChange={(e) => update("start", e.target.value)}
                />
              </label>

              <label className="flex flex-col gap-1 text-xs text-muted">
                Hasta
                <input
                  type="date"
                  className="ql-input rounded-md px-3 py-2 text-sm text-ink"
                  value={config.end}
                  onChange={(e) => update("end", e.target.value)}
                />
              </label>

              <label className="flex flex-col gap-1 text-xs text-muted">
                Comisión (%)
                <input
                  type="number"
                  step="0.01"
                  className="ql-input rounded-md px-3 py-2 text-sm text-ink"
                  value={config.commission}
                  onChange={(e) => update("commission", Number(e.target.value))}
                />
              </label>

              <label className="flex flex-col gap-1 text-xs text-muted">
                Folds (walk-forward)
                <input
                  type="number"
                  className="ql-input rounded-md px-3 py-2 text-sm text-ink"
                  value={config.folds}
                  onChange={(e) => update("folds", Number(e.target.value))}
                />
              </label>
            </div>

            <label className="mt-4 flex items-center justify-between rounded-md border border-line bg-white/[0.02] px-3 py-2">
              <span className="text-xs text-ink">Walk-forward OOS</span>
              <input type="checkbox" checked readOnly />
            </label>
            <p className="mt-2 text-[11px] leading-relaxed text-muted">
              Integridad activada: el backtest usa datos que la estrategia
              nunca vio. No se puede desactivar.
            </p>

            <label className="mt-4 flex items-start gap-2.5 rounded-md border border-line bg-white/[0.02] px-3 py-2.5">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
              />
              <span className="text-xs leading-relaxed text-ink">
                Compartir en la comunidad
                <span className="mt-0.5 block text-[11px] text-muted">
                  Tu estrategia aparecerá en /community y en el ranking OOS.
                </span>
              </span>
            </label>
          </div>

          {error && (
            <div className="rounded-lg border border-short/40 bg-short/[0.08] px-4 py-3 text-sm text-short">
              {error}
            </div>
          )}

          <button
            onClick={handleRun}
            disabled={running}
            className={buttonClasses("primary", "lg") + " w-full justify-center"}
          >
            {running ? "Probando…" : "Probar estrategia"}
          </button>
        </aside>
      </section>
    </main>
  );
}
