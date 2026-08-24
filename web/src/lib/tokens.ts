// Cliente de tokens QP — re-exporta tipos y funciones de tournaments.ts
// para mantener compatibilidad con páginas que importan de @/lib/tokens.

export { call } from "./tournaments";
export type {
  TokenBalance,
  TokenLedgerEntry,
  MarketplaceStrategy,
} from "./tournaments";

import { call } from "./tournaments";
import type { TokenBalance, TokenLedgerEntry, MarketplaceStrategy, Subscription } from "./tournaments";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export async function getBalance(): Promise<TokenBalance> {
  return call<TokenBalance>("/tokens/balance");
}

export async function getLedger(): Promise<TokenLedgerEntry[]> {
  return call<TokenLedgerEntry[]>("/tokens/ledger");
}

export async function purchaseQP(amount: number): Promise<{ balance: number }> {
  return call<{ balance: number }>("/tokens/transaction", {
    method: "POST",
    body: JSON.stringify({ amount, type: "purchase", memo: "Compra de QP" }),
  });
}

export async function spendQP(
  amount: number,
  type: string,
  refId?: string,
  memo?: string,
): Promise<{ balance: number }> {
  return call<{ balance: number }>("/tokens/transaction", {
    method: "POST",
    body: JSON.stringify({ amount: -Math.abs(amount), type, ref_id: refId, memo }),
  });
}

export async function earnQP(
  amount: number,
  type: string,
  refId?: string,
  memo?: string,
): Promise<{ balance: number }> {
  return call<{ balance: number }>("/tokens/transaction", {
    method: "POST",
    body: JSON.stringify({ amount: Math.abs(amount), type, ref_id: refId, memo }),
  });
}

export async function getMarketplaceStrategies(
  filters?: { asset_type?: string; symbol?: string; min_price?: number },
): Promise<MarketplaceStrategy[]> {
  const q = new URLSearchParams();
  if (filters?.asset_type) q.set("asset_type", filters.asset_type);
  if (filters?.symbol) q.set("symbol", filters.symbol);
  return call<MarketplaceStrategy[]>(`/marketplace?${q.toString()}`);
}

export async function getMarketplaceStrategy(id: string): Promise<MarketplaceStrategy> {
  return call<MarketplaceStrategy>(`/marketplace/${id}`);
}

export async function getMySubscriptions(): Promise<Subscription[]> {
  return call<Subscription[]>(`/marketplace/my-subscriptions`);
}

export async function pauseSubscription(id: string): Promise<{ status: string }> {
  return call<{ status: string }>(`/marketplace/${id}/pause`, { method: "POST" });
}

export async function resumeSubscription(id: string): Promise<{ status: string }> {
  return call<{ status: string }>(`/marketplace/${id}/resume`, { method: "POST" });
}

export async function cancelSubscription(id: string): Promise<{ status: string }> {
  return call<{ status: string }>(`/marketplace/${id}/unsubscribe`, { method: "POST" });
}

export async function getPublicProfile(userId: string): Promise<any> {
  const supabase = createBrowserSupabaseClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  return data;
}

export type { Subscription } from "./tournaments";
