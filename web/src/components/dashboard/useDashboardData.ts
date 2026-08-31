"use client";

import { useEffect, useState } from "react";
import { getBalance } from "@/lib/tokens";
import { getMyStrategies } from "@/lib/db";
import { listTournaments } from "@/lib/tournaments";
import type { MyStrategy } from "@/lib/db";
import type { Tournament } from "@/lib/tournaments";
import type { TournamentSummary } from "@/app/app/tournaments/components/TournamentCard";

export type DashboardData = {
  qp: number | null;
  strategies: MyStrategy[];
  tournaments: TournamentSummary[];
  loading: boolean;
  error: string | null;
};

function toAssetType(assetType: string): TournamentSummary["asset_type"] {
  if (assetType === "crypto") return "crypto";
  if (assetType === "stock" || assetType === "stocks" || assetType === "equities") return "stock";
  return "any";
}

function toSummary(tournament: Tournament): TournamentSummary {
  return {
    id: tournament.id,
    name: tournament.name,
    type: tournament.type === "ml" ? "ml" : "custom",
    status: "active",
    asset_type: toAssetType(tournament.asset_type),
    symbol: tournament.symbols?.[0],
    qp_prize: tournament.prize_pool_qp ?? 0,
    deadline: tournament.submission_deadline,
    participants: tournament.submission_count ?? 0,
    metric_label: tournament.primary_metric ?? "deflated_sharpe_oos",
  };
}

export function useDashboardData(): DashboardData {
  const [data, setData] = useState<DashboardData>({
    qp: null,
    strategies: [],
    tournaments: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [balance, strategies, tournaments] = await Promise.allSettled([
          getBalance(),
          getMyStrategies(),
          listTournaments(),
        ]);

        if (!active) return;

        const qp = balance.status === "fulfilled" ? (balance.value?.balance ?? 0) : null;
        const myStrategies = strategies.status === "fulfilled" ? (strategies.value ?? []) : [];
        const rawTournaments = tournaments.status === "fulfilled" ? (tournaments.value ?? []) : [];
        const activeTournaments = rawTournaments
          .filter((t) => t.status === "open")
          .map(toSummary);

        setData({
          qp,
          strategies: myStrategies,
          tournaments: activeTournaments,
          loading: false,
          error: null,
        });
      } catch (error) {
        if (!active) return;
        const message = error instanceof Error ? error.message : "Error";
        setData((d) => ({ ...d, loading: false, error: message }));
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return data;
}
