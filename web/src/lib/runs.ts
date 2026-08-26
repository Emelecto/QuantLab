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
  const c = run.config ?? ({} as BacktestResult["config"]);
  // IMPORTANTE: las columnas de aquí deben existir en public.strategies.
  // NO hay columna `config`: los parámetros viven en columnas planas
  // (code, capital, commission, folds, split, slippage). Escribir `config`
  // devuelve 400 PGRST204 y el run se perdía en silencio.
  const { error } = await sb.from("strategies").upsert({
    id: run.id,
    user_id: userId,
    title: `${c.symbol} · ${c.timeframe}`,
    code: c.code ?? "",
    asset_type: c.asset_type,
    symbol: c.symbol,
    timeframe: c.timeframe,
    capital: c.capital,
    commission: c.commission,
    slippage: c.slippage,
    folds: c.folds,
    split: c.split,
    metrics: run.metrics as unknown as Record<string, unknown>,
    equity: run.equity_curve ?? [],
    integrity: run.integrity_label,
    status: "tested",
    created_at: run.created_at,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(`No se pudo guardar la estrategia: ${error.message}`);
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

  // Filas del schema viejo (estrategias sin resultado) NO son runs válidos:
  // carecen de métricas numéricas y crashearían cualquier .toFixed(). Se omiten.
  const out: BacktestResult[] = [];
  for (const row of data) {
    if (!row?.id) continue;
    const metrics = row.metrics as BacktestResult["metrics"] | null | undefined;
    if (!metrics || typeof metrics.sharpe_oos !== "number") continue;
    // `strategies` no tiene columna `config`: se reconstruye desde las
    // columnas planas para que results/publish tengan symbol/code/etc.
    const config = {
      asset_type: row.asset_type ?? "crypto",
      symbol: row.symbol ?? "",
      timeframe: row.timeframe ?? "1d",
      code: row.code ?? "",
      capital: row.capital ?? 1000,
      commission: row.commission ?? 0.001,
      slippage: row.slippage ?? 0.0005,
      folds: row.folds ?? 3,
      split: row.split ?? 70,
    } as unknown as BacktestResult["config"];
    out.push({
      id: row.id,
      config,
      created_at: row.created_at ?? new Date().toISOString(),
      metrics,
      integrity_label: row.integrity ?? "High",
      equity_curve: (row.equity ?? []) as BacktestResult["equity_curve"],
    });
  }
  return out;
}

// --- API pública ---
/** Guarda un run: localStorage (inmediato) + Supabase (async con user_id).
 *  Si la nube falla, lanza — el llamador decide si avisar al usuario.
 *  El run YA quedó en localStorage, así que nunca se pierde el trabajo. */
export async function saveRun(run: BacktestResult): Promise<void> {
  if (typeof window === "undefined") return;
  const all = readAll();
  all.unshift(run);
  writeAll(all);

  const { createBrowserSupabaseClient } = await import("@/lib/supabase/client");
  const sb = createBrowserSupabaseClient();
  const { data } = await sb.auth.getSession();
  const userId = data.session?.user?.id;
  if (!userId) return; // sin sesión: solo cache local, sin error
  await supabaseUpsert(run, userId);
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
