/**
 * Cliente unificado de torneos + marketplace + QP para QuantLab.
 * Fuente: Worker FastAPI (NEXT_PUBLIC_WORKER_URL).
 */
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

/* ------------------------------------------------------------------ */
/* Tipos                                                               */
/* ------------------------------------------------------------------ */

export interface Tournament {
  id: string;
  name: string;
  slug: string;
  type: "weekly" | "monthly" | "kaggle" | "express" | "community";
  status: "draft" | "open" | "closed" | "evaluating" | "completed";
  asset_type: string;
  symbols: string[];
  timeframe: string;
  data_start: string;
  data_end: string;
  eval_end: string;
  submission_deadline: string;
  prize_pool_qp: number;
  sponsor_prize_desc?: string;
  primary_metric: string;
  min_trades: number;
  max_slippage_pct: number;
  rules_text?: string;
  created_at: string;
  submission_count?: number;
}

export interface TournamentSummary {
  id: string;
  name: string;
  type: "sharpe" | "returns" | "sortino" | "custom";
  status: "active" | "upcoming" | "finished";
  asset_type: "crypto" | "stock" | "any";
  symbol?: string;
  qp_prize: number;
  deadline: string;
  participants: number;
  max_participants?: number;
  metric_label: string;
  metric_value?: string;
}

export interface Submission {
  id: string;
  tournament_id: string;
  user_id: string;
  code: string;
  config: Record<string, unknown>;
  metrics?: Record<string, number>;
  integrity_label?: string;
  primary_score?: number;
  rank?: number;
  qp_staked: number;
  qp_earned: number;
  status: string;
  submitted_at: string;
}

export interface LeaderboardEntry {
  tournament_id?: string;
  user_id: string;
  submission_id?: string;
  rank: number;
  score: number;
  qp_earned: number;
  badge_earned?: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
}

export interface PublicLeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  avatar_url?: string | null;
  country?: string | null;
  qp_earned: number;
  tournaments_won: number;
  sharpe_best?: number;
  tier?: string;
}

export interface TokenBalance {
  user_id: string;
  balance: number;
  lifetime_earned: number;
  lifetime_spent: number;
  tier: "free" | "plus" | "pro";
  updated_at: string;
}

export interface TokenLedgerEntry {
  id: string;
  user_id: string;
  amount: number;
  type: string;
  ref_id?: string;
  memo?: string;
  created_at: string;
}

export interface MarketplaceStrategy {
  id: string;
  author_id: string;
  title: string;
  slug: string;
  description?: string;
  tags: string[];
  asset_type: string;
  symbol: string;
  timeframe: string;
  code?: string;
  is_public_code: boolean;
  is_public?: boolean;
  config: Record<string, unknown>;
  backtest_metrics?: Record<string, number>;
  backtest_equity?: Array<{ t: string; is?: number; oos?: number }>;
  price_qp_week: number;
  price_qp: number;
  subscribers: number;
  total_copies: number;
  rating?: number;
  avg_rating?: number;
  sharpe?: number;
  max_dd?: number;
  status: string;
  created_at: string;
  published_at?: string;
  author?: string;
  author_name?: string;
  author_avatar?: string;
}

export interface Signal {
  id: string;
  strategy_id: string;
  symbol: string;
  direction: "long" | "short" | "close";
  strength?: number;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface Subscription {
  id: string;
  strategy_id: string;
  subscriber_id: string;
  copy_config?: Record<string, unknown>;
  is_paper: boolean;
  broker_account?: string;
  status: string;
  started_at: string;
  expires_at?: string;
  qp_spent_total: number;
  paper_pnl?: number;
  strategy_title?: string;
  symbol?: string;
  price_qp: number;
}

export type LeaderboardTab = "qp" | "tournaments" | "country";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const WORKER = process.env.NEXT_PUBLIC_WORKER_URL || "http://localhost:8001";

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const supabase = getSupabase();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${WORKER}${path}`, { ...init, headers });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
  return json as T;
}

function getSupabase() {
  return createBrowserSupabaseClient();
}

/* ------------------------------------------------------------------ */
/* Torneos                                                             */
/* ------------------------------------------------------------------ */

export async function listTournaments(filters?: {
  type?: string;
  status?: string;
}): Promise<Tournament[]> {
  const q = new URLSearchParams();
  if (filters?.type) q.set("type", filters.type);
  if (filters?.status) q.set("status", filters.status);
  return call<Tournament[]>(`/tournament/list?${q.toString()}`);
}

export async function getTournament(id: string): Promise<Tournament> {
  return call<Tournament>(`/tournament/${id}`);
}

export async function submitToTournament(
  id: string,
  code: string,
  config: Record<string, unknown>,
  qpStake: number,
): Promise<Submission> {
  return call<Submission>(`/tournament/submit`, {
    method: "POST",
    body: JSON.stringify({ tournament_id: id, code, config, qp_stake: qpStake }),
  });
}

export async function getLeaderboard(
  id: string,
): Promise<LeaderboardEntry[]> {
  return call<LeaderboardEntry[]>(`/tournament/${id}/leaderboard`);
}

export async function getMySubmission(id: string): Promise<Submission | null> {
  try {
    return await call<Submission>(`/tournament/${id}/my-submission`);
  } catch {
    return null;
  }
}

// Compatibilidad con páginas que usan TournamentSummary
export async function getTournaments(
  status?: "active" | "upcoming" | "finished",
): Promise<TournamentSummary[]> {
  const list = await listTournaments({ status });
  return list.map((t) => ({
    id: t.id,
    name: t.name,
    type: "custom" as const,
    status:
      t.status === "open"
        ? "active"
        : t.status === "draft"
          ? "upcoming"
          : "finished",
    asset_type: t.asset_type as "crypto" | "stock" | "any",
    symbol: t.symbols?.[0],
    qp_prize: t.prize_pool_qp,
    deadline: t.submission_deadline,
    participants: t.submission_count ?? 0,
    metric_label: t.primary_metric,
  }));
}

/* ------------------------------------------------------------------ */
/* Leaderboard Global (Supabase directo, no via worker)               */
/* ------------------------------------------------------------------ */

export async function getGlobalLeaderboard(
  tab: LeaderboardTab = "qp",
  limit = 100,
): Promise<PublicLeaderboardEntry[]> {
  const supabase = getSupabase();
  const common = "id, username, avatar_url, country, total_qp_earned, tournaments_won";

  if (tab === "qp") {
    const { data, error } = await supabase
      .from("profiles")
      .select(common)
      .order("total_qp_earned", { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data.map((p: any, i: number) => ({
      rank: i + 1,
      user_id: p.id,
      username: p.username ?? "trader",
      avatar_url: p.avatar_url ?? null,
      country: p.country ?? null,
      qp_earned: Number(p.total_qp_earned ?? 0),
      tournaments_won: Number(p.tournaments_won ?? 0),
      sharpe_best: undefined,
      tier: p.tier ?? "bronze",
    }));
  }

  if (tab === "tournaments") {
    const { data, error } = await supabase
      .from("profiles")
      .select(common)
      .order("tournaments_won", { ascending: false })
      .order("total_qp_earned", { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data.map((p: any, i: number) => ({
      rank: i + 1,
      user_id: p.id,
      username: p.username ?? "trader",
      avatar_url: p.avatar_url ?? null,
      country: p.country ?? null,
      qp_earned: Number(p.total_qp_earned ?? 0),
      tournaments_won: Number(p.tournaments_won ?? 0),
      sharpe_best: undefined,
      tier: p.tier ?? "bronze",
    }));
  }

  // country tab
  const { data, error } = await supabase
    .from("profiles")
    .select(common)
    .order("total_qp_earned", { ascending: false })
    .limit(limit * 2);
  if (error || !data) return [];

  const grouped = new Map<string, PublicLeaderboardEntry>();
  for (const p of data as any[]) {
    const c = p.country ?? "ZZ";
    const existing = grouped.get(c);
    if (existing) {
      existing.qp_earned += Number(p.total_qp_earned ?? 0);
      existing.tournaments_won += Number(p.tournaments_won ?? 0);
    } else {
      grouped.set(c, {
        rank: 0,
        user_id: p.id,
        username: p.country ?? "Desconocido",
        avatar_url: null,
        country: p.country ?? null,
        qp_earned: Number(p.total_qp_earned ?? 0),
        tournaments_won: Number(p.tournaments_won ?? 0),
        sharpe_best: undefined,
        tier: p.tier ?? "bronze",
      });
    }
  }
  return Array.from(grouped.values())
    .sort((a, b) => b.qp_earned - a.qp_earned)
    .slice(0, limit)
    .map((e, i) => ({ ...e, rank: i + 1 }));
}

/* ------------------------------------------------------------------ */
/* Marketplace                                                         */
/* ------------------------------------------------------------------ */

export async function getMarketplaceStrategies(
  filters?: { asset_type?: string; symbol?: string; min_price?: number },
): Promise<MarketplaceStrategy[]> {
  const q = new URLSearchParams();
  if (filters?.asset_type) q.set("asset_type", filters.asset_type);
  if (filters?.symbol) q.set("symbol", filters.symbol);
  return call<MarketplaceStrategy[]>(`/marketplace?${q.toString()}`);
}

export async function publishStrategy(data: {
  title: string;
  description?: string;
  tags?: string[];
  asset_type: string;
  symbol: string;
  timeframe: string;
  code?: string;
  is_public_code?: boolean;
  config: Record<string, unknown>;
  price_qp_week?: number;
}): Promise<{ id: string }> {
  return call<{ id: string }>(`/marketplace/publish`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function subscribeToStrategy(id: string): Promise<Subscription> {
  return call<Subscription>(`/marketplace/${id}/subscribe`, { method: "POST" });
}

export async function unsubscribeFromStrategy(id: string): Promise<void> {
  await call<void>(`/marketplace/${id}/unsubscribe`, { method: "POST" });
}

export async function getSignals(strategyId: string): Promise<Signal[]> {
  return call<Signal[]>(`/signals/${strategyId}`);
}

export async function getMySubscriptions(): Promise<Subscription[]> {
  return call<Subscription[]>(`/marketplace/my-subscriptions`);
}

export async function getProfileTournamentHistory(
  userId: string,
): Promise<any[]> {
  const supabase = createBrowserSupabaseClient();
  const { data } = await supabase
    .from("tournament_participants")
    .select("*, tournaments(*)")
    .eq("user_id", userId)
    .order("joined_at", { ascending: false });
  return data || [];
}

export { call };
