"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { StrategyEditor, DEFAULT_STRATEGY_CODE } from "@/components/Editor";
import { RiskAdvisor, StrategyExplainer } from "@/components/studio";
import { SymbolPicker, timeframesFor } from "@/components/SymbolPicker";
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

export default function NewStrategyPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [config, setConfig] = useState<StrategyConfig>({
    code: DEFAULT_STRATEGY_CODE,
    asset_type: "crypto",
    symbol: "BTCUSDT",
    timeframe: "1d",
    capital: 1000,
    commission: 0.001,
    slippage: 0.0005,
    folds: 3,
    split: 70,
    start: "",
    end: "",
  });
  const [isPublic, setIsPublic] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [importMsg, setImportMsg] = useState<string | null>(null);

  function update<K extends keyof StrategyConfig>(key: K, value: StrategyConfig[K]) {
    setConfig((c) => ({ ...c, [key]: value }));
  }

  function changeAsset(asset: "crypto" | "stock" | "etf") {
    setConfig((c) => ({
      ...c,
      asset_type: asset,
      // Resetea símbolo y timeframe a defaults coherentes con el nuevo activo.
      symbol: asset === "crypto" ? "BTCUSDT" : asset === "etf" ? "SPY" : "AAPL",
      timeframe: "1d",
    }));
  }

  // ------------------------------------------------------------------
  // Import / Export de estrategia (JSON completo: código + config)
  // ------------------------------------------------------------------
  function exportStrategy() {
    const payload = {
      quantlab_strategy: true,
      version: 1,
      exported_at: new Date().toISOString(),
      config,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `quantlab-${config.symbol.toLowerCase()}-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importStrategy(file: File) {
    setImportMsg(null);
    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const raw = JSON.parse(String(reader.result));
        // Acepta el formato exportado por QuantLab o un config plano.
        const cfg = raw?.config ?? raw;
        if (typeof cfg.code !== "string" || !cfg.code.trim()) {
          throw new Error("El archivo no contiene código de estrategia ('code').");
        }
        setConfig((c) => ({
          ...c,
          code: String(cfg.code),
          ...(cfg.asset_type ? { asset_type: normalizeAsset(cfg.asset_type) } : {}),
          ...(cfg.symbol ? { symbol: String(cfg.symbol).toUpperCase() } : {}),
          ...(cfg.timeframe
            ? { timeframe: String(cfg.timeframe) as StrategyConfig["timeframe"] }
            : {}),
          ...(typeof cfg.capital === "number" ? { capital: cfg.capital } : {}),
          ...(typeof cfg.commission === "number" ? { commission: cfg.commission } : {}),
          ...(typeof cfg.slippage === "number" ? { slippage: cfg.slippage } : {}),
          ...(typeof cfg.folds === "number" ? { folds: cfg.folds } : {}),
          ...(typeof cfg.split === "number" ? { split: cfg.split } : {}),
          ...(cfg.start ? { start: String(cfg.start) } : {}),
          ...(cfg.end ? { end: String(cfg.end) } : {}),
        }));
        setImportMsg(`Estrategia "${file.name}" importada correctamente.`);
      } catch (e) {
        setError(
          `No se pudo importar: ${e instanceof Error ? e.message : "archivo inválido"}`,
        );
      }
    };
    reader.readAsText(file);
  }

  async function handleBacktest() {
    setRunning(true);
    setError(null);
    try {
      const validation = await validateStrategy(config);
      if (!validation.valid) {
        setError(validation.warnings.join(" · "));
        setRunning(false);
        return;
      }
      if (validation.warnings.length) {
        console.warn("[QuantLab warnings]", validation.warnings);
      }

      const result: BacktestResult = await runBacktest(config);

      const run: BacktestResult = {
        id: result.id || crypto.randomUUID(),
        config,
        created_at: new Date().toISOString(),
        metrics: result.metrics,
        integrity_label: result.integrity_label,
        equity_curve: result.equity_curve,
        report: result.report,
      };
      saveRun(run);

      try {
        await saveStrategy(config, config.code, isPublic);
        await saveBacktestRun(run.id, result);
      } catch (dbErr) {
        // Persistencia en la nube best-effort; el run ya está en localStorage.
        console.warn("No se pudo guardar en la nube:", dbErr);
      }
      router.push(`/app/strategies/${run.id}/results`);
    } catch (err) {
      if (err instanceof BacktestError) setError(err.message);
      else setError(err instanceof Error ? err.message : "Error inesperado.");
      setRunning(false);
    }
  }

  const tfs = timeframesFor(config.asset_type as "crypto" | "stock" | "etf");

  return (
    <main className="flex min-h-screen flex-col">
      <section className="mx-auto grid w-full max-w-6xl flex-1 gap-6 px-6 py-10 lg:grid-cols-[1fr_360px]">
        {/* Columna principal: editor + asistente IA */}
        <div className="flex flex-col gap-3">
          {/* Barra de acciones del editor */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h1 className="text-lg font-semibold tracking-tight text-ink">
              Nueva estrategia
            </h1>
            <div className="flex items-center gap-2">
              <input
                ref={fileRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) importStrategy(f);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className={buttonClasses("secondary", "sm")}
                title="Importar estrategia desde archivo JSON"
              >
                Importar
              </button>
              <button
                type="button"
                onClick={exportStrategy}
                className={buttonClasses("secondary", "sm")}
                title="Exportar estrategia como JSON"
              >
                Exportar
              </button>
            </div>
          </div>

          {importMsg && (
            <p className="rounded-md border border-long/30 bg-long/[0.08] px-3 py-2 text-[12px] text-long">
              {importMsg}
            </p>
          )}
          {error && (
            <p className="rounded-md border border-short/30 bg-short/10 px-3 py-2 text-[12px] text-short">
              {error}
            </p>
          )}

          <div className="ql-glass ql-elev-2 overflow-hidden rounded-xl">
            <div className="flex items-center justify-between border-b border-line px-4 py-2">
              <span className="text-xs font-medium uppercase tracking-wide text-muted">
                strategy.py
              </span>
              <span className="text-xs text-muted">Python</span>
            </div>
            <StrategyEditor value={config.code} onChange={(v) => update("code", v)} />
          </div>

          {/* Chat IA */}
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
              <p className="mt-2 rounded-md border border-line bg-white/[0.03] px-3 py-2 text-[12px] leading-relaxed text-ink">
                {aiExplanation}
              </p>
            )}
          </div>
        </div>

        {/* Panel lateral: configuración + riesgo + explicador */}
        <aside className="flex flex-col gap-4">
          <div className="ql-glass ql-elev-1 rounded-xl p-5">
            <h2 className="text-sm font-semibold tracking-tight text-ink">Configuración</h2>
            <div className="mt-4 flex flex-col gap-3.5">
              {/* Tipo de activo */}
              <label className="block">
                <span className="mb-1.5 block text-[12px] font-medium text-muted">
                  Tipo de activo
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {(
                    [
                      { k: "crypto", label: "Cripto" },
                      { k: "stock", label: "Acción" },
                      { k: "etf", label: "ETF" },
                    ] as const
                  ).map((a) => (
                    <button
                      key={a.k}
                      type="button"
                      onClick={() => changeAsset(a.k)}
                      className={
                        "rounded-md border px-2 py-2 text-[13px] font-medium transition-colors " +
                        (config.asset_type === a.k
                          ? "border-accent bg-white/[0.06] text-ink"
                          : "border-line text-muted hover:text-ink")
                      }
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </label>

              {/* Símbolo — combobox con búsqueda */}
              <label className="block">
                <span className="mb-1.5 block text-[12px] font-medium text-muted">
                  Símbolo
                </span>
                <SymbolPicker
                  assetType={config.asset_type as "crypto" | "stock" | "etf"}
                  value={config.symbol}
                  onChange={(s) => update("symbol", s)}
                />
              </label>

              {/* Timeframe */}
              <label className="block">
                <span className="mb-1.5 block text-[12px] font-medium text-muted">
                  Temporalidad
                </span>
                <select
                  value={config.timeframe}
                  onChange={(e) =>
                    update("timeframe", e.target.value as StrategyConfig["timeframe"])
                  }
                  className="ql-input h-10 w-full rounded-md px-3 text-sm text-ink"
                >
                  {tfs.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label} ({t.value})
                    </option>
                  ))}
                </select>
              </label>

              {/* Fechas */}
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1.5 block text-[12px] font-medium text-muted">
                    Desde
                  </span>
                  <input
                    type="date"
                    value={config.start}
                    max={config.end || undefined}
                    onChange={(e) => update("start", e.target.value)}
                    className="ql-input h-10 w-full rounded-md px-3 text-sm text-ink"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[12px] font-medium text-muted">
                    Hasta
                  </span>
                  <input
                    type="date"
                    value={config.end}
                    min={config.start || undefined}
                    onChange={(e) => update("end", e.target.value)}
                    className="ql-input h-10 w-full rounded-md px-3 text-sm text-ink"
                  />
                </label>
              </div>
              {!config.start || !config.end ? (
                <p className="text-[11px] text-muted">
                  Elige el rango de datos históricos para el backtest.
                </p>
              ) : null}

              {/* Capital */}
              <label className="block">
                <span className="mb-1.5 block text-[12px] font-medium text-muted">
                  Capital inicial (USD)
                </span>
                <input
                  type="number"
                  min={100}
                  step={100}
                  value={config.capital}
                  onChange={(e) => update("capital", Number(e.target.value))}
                  className="ql-input h-10 w-full rounded-md px-3 text-sm text-ink"
                />
              </label>

              {/* Comisión / slippage */}
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1.5 block text-[12px] font-medium text-muted">
                    Comisión %
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={config.commission}
                    onChange={(e) => update("commission", Number(e.target.value))}
                    className="ql-input h-10 w-full rounded-md px-3 text-sm text-ink"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[12px] font-medium text-muted">
                    Slippage %
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={config.slippage}
                    onChange={(e) => update("slippage", Number(e.target.value))}
                    className="ql-input h-10 w-full rounded-md px-3 text-sm text-ink"
                  />
                </label>
              </div>

              {/* Compartir */}
              <label className="flex items-center justify-between gap-3 rounded-md border border-line bg-white/[0.02] px-3 py-2.5">
                <span className="text-[13px] text-ink">Compartir en la comunidad</span>
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="h-4 w-4 accent-[#f8fafc]"
                />
              </label>
            </div>

            <button
              onClick={handleBacktest}
              disabled={running}
              className={buttonClasses("primary", "lg") + " mt-5 w-full justify-center"}
            >
              {running ? "Ejecutando backtest…" : "Ejecutar backtest OOS"}
            </button>
            <p className="mt-2 text-center text-[11px] text-muted">
              Walk-forward · {config.folds} folds · split {config.split}/{100 - config.split}
            </p>
          </div>

          <RiskAdvisor
            onApply={(p) => {
              if (p.commission !== undefined) update("commission", p.commission);
            }}
          />
          <StrategyExplainer code={config.code} />
        </aside>
      </section>
    </main>
  );
}

function normalizeAsset(v: unknown): "crypto" | "stock" | "etf" {
  const s = String(v).toLowerCase().trim();
  return s === "stock" ? "stock" : s === "etf" ? "etf" : "crypto";
}
