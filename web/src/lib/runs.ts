// Puente de persistencia: localStorage. Reemplaza a Supabase en el front.
// Clave única 'ql_runs' -> array de BacktestResult (más reciente primero).
import type { BacktestResult } from "@/lib/api";

const KEY = "ql_runs";

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

/** Guarda un run (lo inserta al inicio del array). */
export function saveRun(run: BacktestResult): void {
  if (typeof window === "undefined") return;
  const all = readAll();
  all.unshift(run);
  window.localStorage.setItem(KEY, JSON.stringify(all));
}

/** Busca un run por id. */
export function getRun(id: string): BacktestResult | null {
  return readAll().find((r) => r.id === id) ?? null;
}

/** Lista todos los runs (más recientes primero). */
export function getRuns(): BacktestResult[] {
  return readAll();
}
