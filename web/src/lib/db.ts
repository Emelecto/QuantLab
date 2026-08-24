// Capa de persistencia real: Supabase (browser client).
// Source of truth para estrategias y backtests. Reemplaza el puente
// localStorage (que queda solo como caché local en el editor).
//
// Todas las funciones construyen el cliente bajo demanda (dentro de la
// función) para que `next build` no falle por variables de entorno ausentes.
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { StrategyConfig, BacktestResult } from "@/lib/api";

export type PublicStrategy = {
  id: string;
  title: string;
  symbol: string;
  asset_type: string;
  code: string;
  created_at: string;
  username: string | null;
  display_name: string | null;
  /** Deflated Sharpe OOS del run más reciente (o null si aún no hay run). */
  sharpe: number | null;
  run_id: string | null;
};

export type LeaderboardRow = {
  strategy_id: string;
  name: string;
  author: string | null;
  asset: string;
  deflatedSharpeOos: number;
  /** Max drawdown en % (positivo en magnitud). */
  maxDd: number;
  /** Win rate en %. */
  winRate: number;
};

export type SupabaseRun = {
  id: string;
  metrics_json: Record<string, unknown> | null;
  equity_curve: Array<{ t: string; is: number; oos: number }> | null;
  integrity: string | null;
  created_at: string;
};

export type SupabaseStrategy = {
  id: string;
  title: string;
  symbol: string;
  asset_type: string;
  timeframe: string;
  capital: number;
  commission: number;
  folds: number;
  split: number;
  code: string;
  is_public: boolean;
  profiles: { username: string | null; display_name: string | null } | null;
  backtest_runs: SupabaseRun[] | null;
};

function getSupabase() {
  return createBrowserSupabaseClient();
}

/**
 * Guarda una estrategia en la DB. Requiere sesión (auth.uid() = user_id por
 * RLS). Lanza "AUTH_REQUIRED" si no hay usuario logueado para que el llamador
 * redirija a /login.
 */
export async function saveStrategy(
  config: StrategyConfig,
  code: string,
  isPublic = false,
): Promise<string> {
  const supabase = getSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("AUTH_REQUIRED");

  const { data, error } = await supabase
    .from("strategies")
    .insert({
      user_id: user.id,
      title: `${config.symbol} ${config.asset_type}`.trim(),
      code,
      asset_type: config.asset_type,
      symbol: config.symbol,
      timeframe: config.timeframe,
      capital: config.capital,
      commission: config.commission,
      folds: config.folds,
      split: config.split,
      is_public: isPublic,
      status: "tested",
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return data.id as string;
}

/** Guarda el resultado de un backtest ligado a una estrategia. */
export async function saveBacktestRun(
  strategy_id: string,
  result: BacktestResult,
): Promise<string> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("backtest_runs")
    .insert({
      strategy_id,
      status: "done",
      metrics_json: result.metrics,
      equity_curve: result.equity_curve,
      integrity: result.integrity_label,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return data.id as string;
}

/** Estrategias públicas (is_public=true), con autor y último run. */
export async function getPublicStrategies(): Promise<PublicStrategy[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("strategies")
    .select(
      "id, title, symbol, asset_type, code, created_at, profiles(username, display_name), backtest_runs(id, metrics_json, created_at)",
    )
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as unknown as Array<{
    id: string;
    title: string;
    symbol: string;
    asset_type: string;
    code: string;
    created_at: string;
    profiles: { username: string | null; display_name: string | null } | null;
    backtest_runs: Array<{
      id: string;
      metrics_json: Record<string, unknown> | null;
      created_at: string;
    }> | null;
  }>;

  return rows.map((s) => {
    const runs = (s.backtest_runs ?? []).slice().sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
    const latest = runs[0] ?? null;
    const m = (latest?.metrics_json ?? null) as
      | { deflated_sharpe_oos?: number }
      | null;
    return {
      id: s.id,
      title: s.title,
      symbol: s.symbol,
      asset_type: s.asset_type,
      code: s.code,
      created_at: s.created_at,
      username: s.profiles?.username ?? null,
      display_name: s.profiles?.display_name ?? null,
      sharpe: m?.deflated_sharpe_oos ?? null,
      run_id: latest?.id ?? null,
    };
  });
}

/** Ranking OOS: runs de estrategias públicas, ordenado por Deflated Sharpe OOS. */
export async function getLeaderboard(): Promise<LeaderboardRow[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("backtest_runs")
    .select(
      "id, created_at, metrics_json, strategies!inner(id, symbol, asset_type, is_public, profiles(username))",
    )
    .eq("strategies.is_public", true);

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as unknown as Array<{
    id: string;
    created_at: string;
    metrics_json: Record<string, unknown> | null;
    strategies: {
      id: string;
      symbol: string;
      asset_type: string;
      is_public: boolean;
      profiles: { username: string | null } | null;
    };
  }>;

  // Un run por estrategia (el más reciente) para no duplicar en el ranking.
  const byStrategy = new Map<string, (typeof rows)[number]>();
  for (const r of rows) {
    const existing = byStrategy.get(r.strategies.id);
    if (!existing || new Date(r.created_at) > new Date(existing.created_at)) {
      byStrategy.set(r.strategies.id, r);
    }
  }

  const mapped: LeaderboardRow[] = Array.from(byStrategy.values()).map((r) => {
    const m = (r.metrics_json ?? {}) as {
      deflated_sharpe_oos?: number;
      maxdd?: number;
      winrate?: number;
    };
    return {
      strategy_id: r.strategies.id,
      name: r.strategies.symbol,
      author: r.strategies.profiles?.username ?? null,
      asset: r.strategies.asset_type,
      deflatedSharpeOos: m.deflated_sharpe_oos ?? 0,
      maxDd: (m.maxdd ?? 0) * 100,
      winRate: (m.winrate ?? 0) * 100,
    };
  });

  mapped.sort((a, b) => b.deflatedSharpeOos - a.deflatedSharpeOos);
  return mapped;
}

/** Carga una estrategia pública + su run más reciente (vista pública de resultados). */
export async function getPublicStrategy(
  strategyId: string,
): Promise<{ strategy: SupabaseStrategy; run: SupabaseRun | null } | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("strategies")
    .select(
      "id, title, symbol, asset_type, timeframe, capital, commission, folds, split, code, is_public, profiles(username, display_name), backtest_runs(id, metrics_json, equity_curve, integrity, created_at)",
    )
    .eq("id", strategyId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const strategy = data as unknown as SupabaseStrategy;
  const runs = (strategy.backtest_runs ?? []).slice().sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
  return { strategy, run: runs[0] ?? null };
}

/** Convierte una estrategia + run de Supabase a un BacktestResult (para la vista de resultados). */
export function supabaseRunToResult(
  strategy: SupabaseStrategy,
  run: SupabaseRun,
): BacktestResult {
  const m = (run.metrics_json ?? {}) as unknown as BacktestResult["metrics"];
  return {
    id: run.id,
    config: {
      code: strategy.code,
      asset_type: strategy.asset_type as StrategyConfig["asset_type"],
      symbol: strategy.symbol,
      timeframe: strategy.timeframe as StrategyConfig["timeframe"],
      start: "",
      end: "",
      capital: Number(strategy.capital),
      commission: Number(strategy.commission),
      slippage: Number((strategy as { slippage?: number }).slippage ?? 0.0005),
      folds: strategy.folds,
      split: strategy.split,
    },
    created_at: run.created_at,
    metrics: m,
    integrity_label: (run.integrity as BacktestResult["integrity_label"]) ?? "Low",
    equity_curve: (run.equity_curve ?? []) as BacktestResult["equity_curve"],
  };
}
