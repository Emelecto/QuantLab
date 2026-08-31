"use client";

import { useEffect, useState } from "react";
import { getBalance } from "@/lib/tokens";
import {
  getMyCourseProgress,
  getMyMlTournamentSubmissions,
  getMyQpRanking,
  getMyStrategies,
  getMyTournamentSubmissions,
} from "@/lib/db";
import type {
  MlTournamentSubmissionLookup,
  MyCourseProgress,
  MyQpRanking,
  MyStrategy,
  TournamentSubmissionSnapshot,
} from "@/lib/db";
import { listTournaments } from "@/lib/tournaments";
import type { Tournament } from "@/lib/tournaments";

export type DashboardSourceState = "loading" | "ready" | "error";
export type SubmissionLoadState =
  | "loading"
  | "ready"
  | "unavailable"
  | "round-unavailable";

export type DashboardTournament = {
  id: string;
  name: string;
  type: "code" | "ml";
  asset_type: "crypto" | "stock" | "any";
  symbol: string | null;
  qp_prize: number | null;
  deadline: string | null;
  participants: number | null;
  metric_label: string | null;
  submission: TournamentSubmissionSnapshot | null;
  submissionState: SubmissionLoadState;
};

export type DashboardData = {
  qp: number | null;
  course: MyCourseProgress | null;
  ranking: MyQpRanking | null;
  strategies: MyStrategy[];
  tournaments: DashboardTournament[];
  loading: boolean;
  error: string | null;
  sources: {
    qp: DashboardSourceState;
    course: DashboardSourceState;
    ranking: DashboardSourceState;
    strategies: DashboardSourceState;
    tournaments: DashboardSourceState;
    submissions: DashboardSourceState;
  };
};

const INITIAL_DATA: DashboardData = {
  qp: null,
  course: null,
  ranking: null,
  strategies: [],
  tournaments: [],
  loading: true,
  error: null,
  sources: {
    qp: "loading",
    course: "loading",
    ranking: "loading",
    strategies: "loading",
    tournaments: "loading",
    submissions: "loading",
  },
};

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function toAssetType(assetType: unknown): DashboardTournament["asset_type"] {
  const value = String(assetType ?? "").toLowerCase();
  if (value === "crypto") return "crypto";
  if (value === "stock" || value === "stocks" || value === "equities") return "stock";
  return "any";
}

function toDashboardTournament(tournament: Tournament): DashboardTournament {
  const symbols = Array.isArray(tournament.symbols)
    ? tournament.symbols.map(stringOrNull).filter((symbol): symbol is string => Boolean(symbol))
    : [];

  return {
    id: tournament.id,
    name: stringOrNull(tournament.name) ?? "Nombre no disponible",
    type: tournament.type === "ml" ? "ml" : "code",
    asset_type: toAssetType(tournament.asset_type),
    symbol: symbols[0] ?? null,
    qp_prize: numberOrNull(tournament.prize_pool_qp),
    deadline: stringOrNull(tournament.submission_deadline),
    participants: numberOrNull(tournament.submission_count),
    metric_label: stringOrNull(tournament.primary_metric),
    submission: null,
    submissionState: "loading",
  };
}

function messageForFailedSources(labels: string[]): string | null {
  if (labels.length === 0) return null;
  return `No se pudo cargar ${labels.join(", ")}. Las demás secciones siguen disponibles.`;
}

function appendSubmissionError(existing: string | null): string {
  const detail = "No se pudo cargar el estado de algunos envíos.";
  return existing ? `${existing} ${detail}` : detail;
}

export function useDashboardData(): DashboardData {
  const [data, setData] = useState<DashboardData>(INITIAL_DATA);

  useEffect(() => {
    let active = true;

    async function load() {
      const [balanceResult, strategiesResult, tournamentsResult, courseResult, rankingResult] =
        await Promise.allSettled([
          getBalance(),
          getMyStrategies(),
          listTournaments(),
          getMyCourseProgress(),
          getMyQpRanking(),
        ]);

      if (!active) return;

      const qp =
        balanceResult.status === "fulfilled"
          ? numberOrNull(balanceResult.value.balance)
          : null;
      const strategies =
        strategiesResult.status === "fulfilled" && Array.isArray(strategiesResult.value)
          ? strategiesResult.value
          : [];
      const rawTournaments =
        tournamentsResult.status === "fulfilled" && Array.isArray(tournamentsResult.value)
          ? tournamentsResult.value
          : [];
      const tournaments = rawTournaments
        .filter((tournament) => tournament.status === "open")
        .map(toDashboardTournament);
      const course = courseResult.status === "fulfilled" ? courseResult.value : null;
      const ranking = rankingResult.status === "fulfilled" ? rankingResult.value : null;

      const sourceStates: DashboardData["sources"] = {
        qp: qp != null ? "ready" : "error",
        course: courseResult.status === "fulfilled" ? "ready" : "error",
        ranking: rankingResult.status === "fulfilled" ? "ready" : "error",
        strategies:
          strategiesResult.status === "fulfilled" && Array.isArray(strategiesResult.value)
            ? "ready"
            : "error",
        tournaments:
          tournamentsResult.status === "fulfilled" && Array.isArray(tournamentsResult.value)
            ? "ready"
            : "error",
        submissions: tournaments.length ? "loading" : "ready",
      };
      const failedSources = [
        sourceStates.qp === "error" ? "los QP" : null,
        sourceStates.course === "error" ? "el progreso del curso" : null,
        sourceStates.ranking === "error" ? "el ranking" : null,
        sourceStates.strategies === "error" ? "las estrategias" : null,
        sourceStates.tournaments === "error" ? "los torneos" : null,
      ].filter((label): label is string => label !== null);

      setData({
        qp,
        course,
        ranking,
        strategies,
        tournaments,
        loading: false,
        error: messageForFailedSources(failedSources),
        sources: sourceStates,
      });

      if (tournaments.length === 0) return;

      const codeTournamentIds = tournaments
        .filter((tournament) => tournament.type === "code")
        .map((tournament) => tournament.id);
      const mlTournamentIds = tournaments
        .filter((tournament) => tournament.type === "ml")
        .map((tournament) => tournament.id);
      const [codeSubmissionsResult, mlSubmissionsResult] = await Promise.allSettled([
        codeTournamentIds.length
          ? getMyTournamentSubmissions(codeTournamentIds)
          : Promise.resolve<TournamentSubmissionSnapshot[]>([]),
        mlTournamentIds.length
          ? getMyMlTournamentSubmissions(mlTournamentIds)
          : Promise.resolve<MlTournamentSubmissionLookup[]>([]),
      ]);

      if (!active) return;

      const codeSubmissions =
        codeSubmissionsResult.status === "fulfilled"
          ? new Map(
              codeSubmissionsResult.value.map((submission) => [
                submission.tournament_id,
                submission,
              ]),
            )
          : new Map<string, TournamentSubmissionSnapshot>();
      const mlSubmissions =
        mlSubmissionsResult.status === "fulfilled"
          ? new Map(
              mlSubmissionsResult.value.map((lookup) => [lookup.tournament_id, lookup]),
            )
          : new Map<string, MlTournamentSubmissionLookup>();
      const submissionLoadFailed =
        codeSubmissionsResult.status === "rejected" ||
        mlSubmissionsResult.status === "rejected";

      setData((current) => ({
        ...current,
        tournaments: current.tournaments.map((tournament) => {
          if (tournament.type === "ml") {
            const lookup = mlSubmissions.get(tournament.id);
            if (!lookup) {
              return {
                ...tournament,
                submissionState: "unavailable",
              };
            }
            return {
              ...tournament,
              submission: lookup.submission,
              submissionState: lookup.has_ready_round ? "ready" : "round-unavailable",
            };
          }

          return {
            ...tournament,
            submission: codeSubmissions.get(tournament.id) ?? null,
            submissionState:
              codeSubmissionsResult.status === "fulfilled" ? "ready" : "unavailable",
          };
        }),
        error: submissionLoadFailed
          ? appendSubmissionError(current.error)
          : current.error,
        sources: {
          ...current.sources,
          submissions: submissionLoadFailed ? "error" : "ready",
        },
      }));
    }

    void load().catch(() => {
      if (!active) return;
      setData({
        ...INITIAL_DATA,
        loading: false,
        error: "No se pudo cargar el dashboard. Intenta recargar.",
        sources: {
          qp: "error",
          course: "error",
          ranking: "error",
          strategies: "error",
          tournaments: "error",
          submissions: "error",
        },
      });
    });

    return () => {
      active = false;
    };
  }, []);

  return data;
}
