"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { StrategyEditor, DEFAULT_STRATEGY_CODE } from "@/components/Editor";
import { StrategyBuilder } from "@/components/StrategyBuilder";
import {
  StrategyTemplates,
  LiveSignals,
  BlockBuilder,
  RiskAdvisor,
  StrategyExplainer,
} from "@/components/studio";
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
  commission: 0.001, // 0.1%
  slippage: 0.0005, // 0.05% por lado
  folds: 3,
  split: 70,
};

type Mode = "visual" | "code";

export default function NewStrategyPage() {
  const router = useRouter();
  const [config, setConfig] = useState<StrategyConfig>(DEFAULTS);
  const [mode, setMode] = useState<Mode>("visual");
  const [visualTab, setVisualTab] = useState<"templates" | "builder" | "blocks" | "signals">("builder");
  const [isPublic, setIsPublic] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);

  function update<K extends keyof StrategyConfig>(key: K, value: StrategyConfig[K]) {
    setConfig((c) => ({ ...c, [key]: value }));
  }

  async function handleRun() {
    setError(null);
    setRunning(true);
    try {
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
      saveRun(run);

      try {
        const strategyId = await saveStrategy(config, config.code, isPublic);
        await saveBacktestRun(strategyId, result);
      } catch (dbErr) {
        const msg = dbErr instanceof Error ? dbErr.message : "Error desconocido";
        if (msg === "AUTH_REQUIRED") {
          router.push("/login");
          return;
        }
        setError("El backtest salió bien, pero no se pudo guardar en la nube: " + msg);
        setRunning(false);
        return;
      }

      router.push(`/app/strategies/${run.id}/results`);
    } catch (e) {
      const msg = e instanceof BacktestError ? e.message : "Ocurrió un error inesperado.";
      setError(msg);
      setRunning(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b border-line bg-bg/70 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-4 px-6">
          <Link href="/app" className="text-[15px] font-semibold tracking-tight text-ink">
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
        {/* Columna principal: tabs Asistente visual <-> Código pro */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-1 rounded-lg border border-line bg-white/[0.02] p-1">
            <button
              onClick={() => setMode("visual")}
              className={
                "rounded-md px-4 py-1.5 text-sm font-medium transition-colors " +
                (mode === "visual"
                  ? "bg-accent/15 text-accent"
                  : "text-muted hover:text-ink")
              }
            >
              🧭 Asistente visual
            </button>
            <button
              onClick={() => setMode("code")}
              className={
                "rounded-md px-4 py-1.5 text-sm font-medium transition-colors " +
                (mode === "code"
                  ? "bg-accent/15 text-accent"
                  : "text-muted hover:text-ink")
              }
            >
              💻 Código pro
            </button>
          </div>

          {mode === "visual" ? (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-1 rounded-lg border border-line bg-white/[0.02] p-1">
                {(
                  [
                    { k: "templates", label: "Plantillas" },
                    { k: "builder", label: "Constructor" },
                    { k: "blocks", label: "Por bloques" },
                    { k: "signals", label: "Señales en vivo" },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.k}
                    onClick={() => setVisualTab(t.k)}
                    className={
                      "rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors " +
                      (visualTab === t.k
                        ? "bg-accent/15 text-accent"
                        : "text-muted hover:text-ink")
                    }
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {visualTab === "templates" && (
                <StrategyTemplates
                  onSelect={(code) => {
                    update("code", code);
                    setVisualTab("builder");
                  }}
                />
              )}

              {visualTab === "builder" && (
                <div className="ql-glass ql-elev-2 overflow-hidden rounded-xl">
                  <div className="border-b border-line px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted">
                    Constructor visual
                  </div>
                  <StrategyBuilder
                    code={config.code}
                    onChange={(c) => update("code", c)}
                    onParams={(commission, slippage) => {
                      update("commission", commission);
                      update("slippage", slippage);
                    }}
                  />
                </div>
              )}

              {visualTab === "blocks" && (
                <div className="ql-glass ql-elev-2 overflow-hidden rounded-xl">
                  <div className="border-b border-line px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted">
                    Constructor por bloques
                  </div>
                  <BlockBuilder onGenerate={(c) => update("code", c)} />
                </div>
              )}

              {visualTab === "signals" && (
                <div className="ql-glass ql-elev-1 overflow-hidden rounded-xl">
                  <div className="border-b border-line px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted">
                    Señales en vivo (datos reales)
                  </div>
                  <LiveSignals
                    asset_type={config.asset_type}
                    symbol={config.symbol}
                    timeframe={config.timeframe}
                    code={config.code}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="ql-glass ql-elev-2 overflow-hidden rounded-xl">
                <div className="flex items-center justify-between border-b border-line px-4 py-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted">
                    strategy.py
                  </span>
                  <span className="text-xs text-muted">Python</span>
                </div>
                <StrategyEditor value={config.code} onChange={(v) => update("code", v)} />
              </div>
              {/* Chat IA para el editor de código */}
              <div className="ql-glass ql-elev-1 rounded-xl p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <span className="inline-block h-2 w-2 rounded-full bg-accent" />
                  Asistente IA
                </div>
                <p className="mt-1 text-[12px] text-muted">
                  Describe tu idea y genera código real para el motor.
                </p>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.target as HTMLFormElement;
                    const input = form.elements.namedItem("ai-prompt") as HTMLTextAreaElement;
                    const prompt = input.value.trim();
                    if (!prompt) return;
                    input.value = "";
                    setAiLoading(true);
                    setAiError(null);
                    try {
                      const res = await fetch("/api/strategy-ai", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          prompt,
                          asset_type: config.asset_type,
                          symbol: config.symbol,
                        }),
                      });
                      const data = await res.json();
                      if (!res.ok) {
                        setAiError(data.error ?? "Error del asistente.");
                      } else {
                        if (data.code) update("code", data.code);
                        if (typeof data.commission === "number") update("commission", data.commission);
                        if (typeof data.slippage === "number") update("slippage", data.slippage);
                        setAiExplanation(data.explanation ?? "");
                      }
                    } catch {
                      setAiError("No se pudo contactar con la IA.");
                    } finally {
                      setAiLoading(false);
                    }
                  }}
                  className="mt-3 flex flex-col gap-2"
                >
                  <textarea
                    name="ai-prompt"
                    rows={2}
                    placeholder="Ej: comprar cuando la media de 10 cruza sobre la de 30"
                    className="ql-input resize-y rounded-md px-3 py-2 text-sm text-ink"
                  />
                  <button
                    type="submit"
                    disabled={aiLoading}
                    className={buttonClasses("secondary", "md") + " w-full justify-center"}
                  >
                    {aiLoading ? "Generando…" : "Generar código"}
                  </button>
                </form>
                {aiError && (
                  <p className="mt-2 rounded-md border border-short/30 bg-short/10 px-3 py-2 text-[12px] text-short">
                    {aiError}
                  </p>
                )}
                {aiExplanation && (
                  <p className="mt-2 rounded-md border border-accent/30 bg-accent/10 px-3 py-2 text-[12px] leading-relaxed text-ink">
                    {aiExplanation}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Panel de configuración + riesgo + explicador */}
        <aside className="flex flex-col gap-4">
          <div className="ql-glass ql-elev-1 rounded-xl p-5">
            <h2 className="text-sm font-semibold tracking-tight text-ink">Configuración</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-xs text-muted">
                Activo
                <select
                  className="ql-input rounded-md px-3 py-2 text-sm text-ink"
                  value={config.asset_type}
                  onChange={(e) => update("asset_type", e.target.value as AssetType)}
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
                  onChange={(e) => update("timeframe", e.target.value as StrategyConfig["timeframe"])}
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
                  value={(config.commission * 100).toFixed(3)}
                  onChange={(e) =>
                    update("commission", Number(e.target.value) / 100)
                  }
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-muted">
                Slippage (%)
                <input
                  type="number"
                  step="0.01"
                  className="ql-input rounded-md px-3 py-2 text-sm text-ink"
                  value={(config.slippage * 100).toFixed(3)}
                  onChange={(e) =>
                    update("slippage", Number(e.target.value) / 100)
                  }
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
              Integridad activada: el backtest usa datos que la estrategia nunca vio.
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

          <RiskAdvisor
            onApply={(p) => {
              if (p.commission !== undefined) update("commission", p.commission);
            }}
          />
          <StrategyExplainer code={config.code} />

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
