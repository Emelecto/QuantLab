"use client";

import { useEffect, useState } from "react";
import { getBalance } from "@/lib/tokens";
import { getMyStrategies } from "@/lib/db";
import { listTournaments } from "@/lib/tournaments";
import type { MyStrategy } from "@/lib/db";
import type { TournamentSummary } from "@/app/app/tournaments/components/TournamentCard";

export type DashboardData = {
  qp: number | null;
  strategies: MyStrategy[];
  tournaments: TournamentSummary[];
  loading: boolean;
  error: string | null;
};

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

        const qp =
          balance.status === "fulfilled" ? (balance.value?.balance ?? 0) : null;
        const myStrategies =
          strategies.status === "fulfilled" ? (strategies.value ?? []) : [];

        const rawTournaments =
          tournaments.status === "fulfilled" ? (tournaments.value ?? []) : [];
        const activeTournaments: TournamentSummary[] = rawTournaments
          .filter((t: any) => t.status === "open" || t.status === "active")
          .map((t: any) => ({
            id: t.id,
            name: t.name,
            type: t.type === "ml" ? "ml" : "custom",
            status: "active" as const,
            asset_type: (t.asset_type ?? "any") as "crypto" | "stock" | "any",
            symbol: t.symbols?.[0],
            qp_prize: t.prize_pool_qp ?? 0,
            deadline: t.submission_deadline,
            participants: t.submission_count ?? 0,
            max_participants: t.max_participants,
            metric_label: t.primary_metric ?? "deflated_sharpe_oos",
          }));

        setData({
          qp,
          strategies: myStrategies,
          tournaments: activeTournaments,
          loading: false,
          error: null,
        });
      } catch (e: any) {
        if (!active) return;
        setData((d) => ({ ...d, loading: false, error: e?.message ?? "Error" }));
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return data;
}
