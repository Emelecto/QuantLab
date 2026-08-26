// Persistencia dual: Supabase (fuente de verdad) + localStorage (cache rápido).
// Supabase sobrevive a cierre de sesión y cambio de dispositivo.
// localStorage permite lectura instantánea sin esperar la red.
import type { BacktestResult } from "@/lib/api";

const KEY = "ql_runs";

// --- Helpers localStorage ---
function readAll(): BacktestResult[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as BacktestResult[]) : [];
  } catch {
    return [];
  }
}

function writeAll(runs: BacktestResult[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(runs));
}

// --- API Supabase ---
async function supabaseUpsert(run: BacktestResult, userId: string): Promise<void> {
  const { createBrowserSupabaseClient } = await import("@/lib/supabase/client");
  const sb = createBrowserSupabaseClient();
  await sb.from("strategies").upsert({
    id: run.id,
    user_id: userId,
    title: `${run.config.symbol} · ${run.config.timeframe}`,
    asset_type: run.config.asset_type,
    symbol: run.config.symbol,
    timeframe: run.config.timeframe,
    config: run.config as unknown as Record<string, unknown>,
    metrics: run.metrics as unknown as Record<string, unknown>,
    equity: run.equity_curve ?? [],
    integrity: run.integrity_label,
    created_at: run.created_at,
    updated_at: new Date().toISOString(),
  });
}

async function supabaseFetch(userId: string): Promise<BacktestResult[]> {
  const { createBrowserSupabaseClient } = await import("@/lib/supabase/client");
  const sb = createBrowserSupabaseClient();
  const { data, error } = await sb
    .from("strategies")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  // Normalización defensiva: filas del schema viejo pueden venir sin
  // metrics/equity/integrity. Nunca dejar pasar un null que crashee la UI.
  const out: BacktestResult[] = [];
  for (const row of data) {
    if (!row?.id) continue;
    const metrics = (row.metrics ?? {}) as BacktestResult["metrics"];
    out.push({
      id: row.id,
      config: (row.config ?? {}) as BacktestResult["config"],
      created_at: row.created_at ?? new Date().toISOString(),
      metrics,
      integrity_label: row.integrity ?? "High",
      equity_curve: (row.equity ?? []) as BacktestResult["equity_curve"],
    });
  }
  return out;
}

// --- API pública ---
/** Guarda un run: localStorage (inmediato) + Supabase (async con user_id). */
export async function saveRun(run: BacktestResult): Promise<void> {
  if (typeof window === "undefined") return;
  const all = readAll();
  all.unshift(run);
  writeAll(all);

  // Obtener user_id de la sesión actual.
  try {
    const { createBrowserSupabaseClient } = await import("@/lib/supabase/client");
    const sb = createBrowserSupabaseClient();
    const { data } = await sb.auth.getSession();
    const userId = data.session?.user?.id;
    if (userId) {
      await supabaseUpsert(run, userId);
    }
  } catch {
    // Best-effort: el próximo sync lo recupera.
  }
}

/** Guarda un run con user_id explícito (preferido). */
export function saveRunForUser(run: BacktestResult, userId: string): void {
  if (typeof window === "undefined") return;
  const all = readAll();
  all.unshift(run);
  writeAll(all);
  supabaseUpsert(run, userId).catch(() => {});
}

/** Busca un run por id en localStorage. */
export function getRun(id: string): BacktestResult | null {
  return readAll().find((r) => r.id === id) ?? null;
}

/** Lista todos los runs de localStorage (más recientes primero). */
export function getRuns(): BacktestResult[] {
  return readAll();
}

/** Carga runs desde Supabase y los sincroniza a localStorage.
 *  Usar al montar el dashboard para recuperar estrategias perdidas. */
export async function syncRunsFromSupabase(userId: string): Promise<BacktestResult[]> {
  try {
    const remote = await supabaseFetch(userId);
    if (remote.length > 0) {
      // Merge: priorizar remotos, añadir locales que no estén en remotos.
      const local = readAll();
      const ids = new Set(remote.map((r) => r.id));
      const merged = [...remote, ...local.filter((r) => !ids.has(r.id))];
      writeAll(merged);
    }
    return remote;
  } catch {
    return [];
  }
}
