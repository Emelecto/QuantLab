"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * /status — Estado del sistema en vivo.
 * Consulta el health del worker midiendo latencia real.
 * Si el fetch falla, muestra CAÍDO (jamás simula éxito).
 */

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL ?? "";

type Status = "ok" | "slow" | "down" | "checking";

const STATUS_META: Record<
  Exclude<Status, "checking">,
  { label: string; dot: string; text: string }
> = {
  ok: {
    label: "Operativo",
    dot: "bg-[#10b981]",
    text: "text-[#10b981]",
  },
  slow: {
    label: "Degradado (lento)",
    dot: "bg-amber-400",
    text: "text-amber-400",
  },
  down: {
    label: "Caído",
    dot: "bg-short",
    text: "text-short",
  },
};

export default function StatusPage() {
  const [status, setStatus] = useState<Status>("checking");
  const [latency, setLatency] = useState<number | null>(null);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);

  const check = useCallback(async () => {
    setStatus("checking");
    setLatency(null);
    const start = performance.now();
    try {
      if (!WORKER_URL) throw new Error("WORKER_URL no configurada");
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 15000);
      const res = await fetch(`${WORKER_URL}/health`, { signal: ctrl.signal });
      clearTimeout(t);
      const ms = Math.round(performance.now() - start);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await res.json();
      setLatency(ms);
      setStatus(ms > 2000 ? "slow" : "ok");
      setCheckedAt(new Date().toLocaleTimeString("es-CO", { hour12: false }));
    } catch {
      setStatus("down");
      setCheckedAt(new Date().toLocaleTimeString("es-CO", { hour12: false }));
    }
  }, []);

  useEffect(() => {
    void check();
    const id = setInterval(() => void check(), 60_000);
    return () => clearInterval(id);
  }, [check]);

  const meta =
    status === "checking"
      ? { label: "Verificando…", dot: "bg-muted animate-pulse", text: "text-muted" }
      : STATUS_META[status];

  return (
    <main className="flex min-h-screen flex-col">
      <section className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">
          Estado del sistema
        </h1>
        <p className="mt-2 text-sm text-muted">
          Transparencia técnica: salud y latencia del worker de backtests,
          medidas en vivo desde tu navegador.
        </p>

        <div className="ql-glass ql-elev-1 mt-8 p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span aria-hidden className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />
              <div>
                <div className={`text-sm font-semibold ${meta.text}`}>
                  {meta.label}
                </div>
                <div className="metric mt-0.5 text-[11px] text-muted">
                  Worker · quantlab-worker
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="metric text-xl font-semibold text-ink tabular-nums">
                {latency != null ? `${latency} ms` : status === "down" ? "—" : "…"}
              </div>
              <div className="metric text-[11px] text-muted">latencia</div>
            </div>
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-4 text-[12px]">
            <div>
              <dt className="text-muted">Último chequeo</dt>
              <dd className="metric mt-0.5 text-ink">{checkedAt ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted">Fuentes de datos</dt>
              <dd className="metric mt-0.5 text-ink">Bybit · Binance · Yahoo</dd>
            </div>
          </dl>

          <button
            onClick={() => void check()}
            disabled={status === "checking"}
            className="mt-5 w-full rounded-md border border-line px-3 py-2 text-[13px] font-medium text-muted transition-colors hover:border-accent/40 hover:text-ink disabled:opacity-50"
          >
            Revisar de nuevo
          </button>
        </div>

        <p className="mt-4 text-[12px] leading-relaxed text-muted">
          El worker se auto-refresca cada 60 segundos. Si el servicio aparece
          caído puede ser un cold start del plan gratuito de Render (hasta ~50 s
          de arranque); reintenta en un minuto.
        </p>
      </section>
    </main>
  );
}
