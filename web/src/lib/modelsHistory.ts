/**
 * Historial de modelos (estrategias) enviados a torneos, por usuario.
 * Fuente: tabla public.submissions (lectura pública vía RLS) + join tournaments.
 * Agrupa submissions por identidad de estrategia (símbolo + timeframe) y calcula
 * mejor Sharpe OOS histórico, nº de rounds y racha actual.
 */
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export interface ModelRound {
  id: string;
  tournament_id: string;
  tournament_name: string | null;
  /** Fecha ISO de envío. */
  submitted_at: string;
  status: string;
  /** Sharpe OOS evaluado; null si aún no fue evaluado. */
  sharpe_oos: number | null;
}

export interface ModelHistory {
  /** Identidad de la estrategia: asset:symbol:timeframe. */
  key: string;
  /** Símbolo principal (BTCUSDT, ETHUSDT…). */
  symbol: string;
  timeframe: string;
  asset_type: string;
  /** Máximo Sharpe OOS entre todas sus submissions evaluadas. */
  best_sharpe_oos: number | null;
  /** Nº de torneos/rounds con al menos un envío. */
  rounds: number;
  /**
   * Racha actual: submissions consecutivas (de la más reciente hacia atrás)
   * con sharpe_oos >= 0. Se corta en la última submission con sharpe negativo;
   * si nunca hubo una negativa, la racha es el total de submissions evaluadas.
   */
  streak: number;
  /** Última submission evaluada (null si nunca hubo). */
  has_negative_ever: boolean;
  /** Detalle por round, más reciente primero. */
  history: ModelRound[];
}

interface RawSubmission {
  id: string;
  tournament_id: string;
  config: Record<string, unknown> | null;
  metrics: Record<string, unknown> | null;
  status: string;
  submitted_at: string;
  tournaments?: { name?: string } | { name?: string }[] | null;
}

function readSharpeOOS(metrics: Record<string, unknown> | null): number | null {
  const v = metrics?.sharpe_oos;
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function tournamentName(t: RawSubmission["tournaments"]): string | null {
  if (!t) return null;
  if (Array.isArray(t)) return t[0]?.name ?? null;
  return t.name ?? null;
}

/**
 * Devuelve el historial agrupado por modelo para un usuario,
 * ordenado por mejor Sharpe OOS descendente (los sin evaluar al final).
 */
export async function getUserModelsHistory(
  userId: string,
): Promise<ModelHistory[]> {
  if (!userId) return [];
  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase
    .from("submissions")
    .select(
      "id, tournament_id, config, metrics, status, submitted_at, tournaments(name)",
    )
    .eq("user_id", userId)
    .order("submitted_at", { ascending: false });
  if (error || !data) return [];

  const groups = new Map<string, ModelHistory>();

  for (const raw of data as unknown as RawSubmission[]) {
    const cfg = (raw.config ?? {}) as Record<string, unknown>;
    const symbol =
      typeof cfg.symbol === "string" && cfg.symbol.trim()
        ? cfg.symbol.trim().toUpperCase()
        : "ESTRATEGIA";
    const timeframe = typeof cfg.timeframe === "string" ? cfg.timeframe : "1d";
    const asset_type =
      typeof cfg.asset_type === "string" ? cfg.asset_type : "crypto";
    const key = `${asset_type}:${symbol}:${timeframe}`;

    let g = groups.get(key);
    if (!g) {
      g = {
        key,
        symbol,
        timeframe,
        asset_type,
        best_sharpe_oos: null,
        rounds: 0,
        streak: 0,
        has_negative_ever: false,
        history: [],
      };
      groups.set(key, g);
    }
    g.rounds += 1;
    g.history.push({
      id: raw.id,
      tournament_id: raw.tournament_id,
      tournament_name: tournamentName(raw.tournaments),
      submitted_at: raw.submitted_at,
      status: raw.status,
      sharpe_oos: readSharpeOOS(raw.metrics),
    });
  }

  // Métricas agregadas por modelo.
  for (const g of groups.values()) {
    // history viene más reciente primero (query desc).
    const chronological = [...g.history].reverse();

    // Mejor Sharpe OOS histórico.
    const sharpes = chronological
      .map((r) => r.sharpe_oos)
      .filter((s): s is number => s != null);
    g.best_sharpe_oos = sharpes.length ? Math.max(...sharpes) : null;

    // Racha actual: conteo desde la última submission con sharpe negativo.
    // Solo cuentan las submissions ya evaluadas con sharpe numérico.
    const lastNegativeIdx = chronological.reduce(
      (acc, r, i) => (r.sharpe_oos != null && r.sharpe_oos < 0 ? i : acc),
      -1,
    );
    g.has_negative_ever = lastNegativeIdx >= 0;
    g.streak =
      sharpes.length > 0
        ? chronological.length - 1 - lastNegativeIdx
        : 0;
  }

  return Array.from(groups.values()).sort((a, b) => {
    const sa = a.best_sharpe_oos;
    const sb = b.best_sharpe_oos;
    if (sa == null && sb == null) return b.rounds - a.rounds;
    if (sa == null) return 1;
    if (sb == null) return -1;
    return sb - sa;
  });
}

/** Id del usuario autenticado en esta sesión (null si no hay sesión). */
export async function getViewerId(): Promise<string | null> {
  try {
    const supabase = createBrowserSupabaseClient();
    const { data } = await supabase.auth.getUser();
    return data.user?.id ?? null;
  } catch {
    return null;
  }
}
