"use client";

import { useEffect, useState } from "react";
import {
  getGlobalLeaderboard,
  type LeaderboardTab,
  type PublicLeaderboardEntry,
} from "@/lib/tournaments";
import { LeaderboardRow } from "../components/LeaderboardRow";
import { useAuth } from "@/lib/useAuth";

const tabs: { id: LeaderboardTab; label: string }[] = [
  { id: "qp", label: "QP Ganados" },
  { id: "tournaments", label: "Torneos" },
  { id: "country", label: "País" },
];

const countryNames: Record<string, string> = {
  AR: "Argentina",
  BO: "Bolivia",
  BR: "Brasil",
  CL: "Chile",
  CO: "Colombia",
  CR: "Costa Rica",
  CU: "Cuba",
  EC: "Ecuador",
  SV: "El Salvador",
  ES: "España",
  GT: "Guatemala",
  HN: "Honduras",
  MX: "México",
  NI: "Nicaragua",
  PA: "Panamá",
  PY: "Paraguay",
  PE: "Perú",
  DO: "Rep. Dominicana",
  UY: "Uruguay",
  VE: "Venezuela",
  US: "Estados Unidos",
  PT: "Portugal",
  FR: "Francia",
  DE: "Alemania",
  IT: "Italia",
};

export default function RankingsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<LeaderboardTab>("qp");
  const [rows, setRows] = useState<PublicLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getGlobalLeaderboard(tab, 100)
      .then((data) => {
        if (!active) return;
        setRows(data as any);
        setError(null);
      })
      .catch((e) => {
        if (!active) return;
        setError(
          e instanceof Error ? e.message : "No se pudo cargar el ranking.",
        );
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [tab]);

  // Top 3 podio
  const top3 = rows.slice(0, 3);
  const rest = rows.slice(3);

  return (
    <main className="flex min-h-screen flex-col">
      <section className="border-b border-line">
        <div className="mx-auto w-full max-w-6xl px-6 pt-16 pb-10">
          <h1 className="text-3xl font-semibold tracking-tight text-ink md:text-4xl">
            Leaderboard Global
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted md:text-base">
            Los mejores traders de QuantLab, rankeados por QP ganados y torneos.
          </p>
        </div>
      </section>

      {/* Tabs */}
      <div className="border-b border-line bg-surface/40">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-1 px-6 py-3">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`h-8 rounded-md px-3 text-[13px] font-medium transition-colors ${
                tab === t.id
                  ? "bg-accent/15 text-accent border border-accent/30"
                  : "text-muted hover:text-ink border border-transparent"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <section>
        <div className="mx-auto w-full max-w-6xl px-6 py-10">
          {loading ? (
            <p className="metric text-sm text-muted">Cargando ranking…</p>
          ) : error ? (
            <div className="rounded-lg border border-short/40 bg-short/[0.08] px-4 py-3 text-sm text-short">
              {error}
            </div>
          ) : rows.length === 0 ? (
            <div className="ql-glass ql-elev-1 flex flex-col items-center gap-3 rounded-xl px-6 py-16 text-center">
              <p className="text-lg font-semibold text-ink">
                Sin datos todavía
              </p>
              <p className="max-w-md text-sm text-muted">
                El ranking se llena automáticamente cuando los usuarios
                participan en torneos y ganan QP.
              </p>
            </div>
          ) : (
            <>
              {/* Podio top 3 */}
              {top3.length >= 3 && (
                <div className="mb-10 grid gap-4 sm:grid-cols-3">
                  {[top3[1], top3[0], top3[2]].map((entry, i) => {
                    const isFirst = i === 1;
                    return (
                      <div
                        key={entry.user_id}
                        className={`ql-glass ql-elev-${isFirst ? "2" : "1"} ${
                          isFirst ? "ql-tier-featured -mt-4" : ""
                        } flex flex-col items-center rounded-xl p-6 text-center`}
                      >
                        {/* Rank badge */}
                        <span
                          className={`flex h-10 w-10 items-center justify-center rounded-full text-[16px] font-bold ${
                            i === 0
                              ? "bg-gradient-to-br from-slate-300 to-slate-400 text-[#04110d]"
                              : i === 1
                                ? "bg-gradient-to-br from-yellow-400 to-amber-500 text-[#04110d]"
                                : "bg-gradient-to-br from-amber-600 to-amber-700 text-[#04110d]"
                          }`}
                        >
                          {entry.rank}
                        </span>

                        {/* Avatar */}
                        {entry.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={entry.avatar_url}
                            alt={entry.username}
                            className="h-14 w-14 rounded-full border border-line object-cover mt-3"
                          />
                        ) : (
                          <span className="flex h-14 w-14 items-center justify-center rounded-full border border-line bg-[#1a2131] metric text-[18px] text-muted mt-3">
                            {(entry.username ?? "??").slice(0, 2).toUpperCase()}
                          </span>
                        )}

                        <p className="text-[15px] font-semibold text-ink mt-3 truncate">
                          @{entry.username}
                        </p>

                        {tab === "country" && entry.country && (
                          <p className="metric text-[12px] text-muted mt-0.5">
                            {countryNames[entry.country] ?? entry.country}
                          </p>
                        )}

                        {entry.tier && (
                          <span className="metric mt-1 text-[10px] uppercase tracking-wider text-accent">
                            {entry.tier}
                          </span>
                        )}

                        <p className="metric text-accent ql-glow-text text-xl font-bold mt-2">
                          {entry.qp_earned.toLocaleString()}
                          <span className="text-xs font-normal text-muted">
                            {" "}
                            QP
                          </span>
                        </p>
                        <p className="metric text-[11px] text-muted mt-0.5">
                          {entry.tournaments_won} torneos
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Tabla top 4-100 */}
              {rest.length > 0 && (
                <div className="ql-glass overflow-hidden rounded-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px] border-collapse text-left">
                      <thead>
                        <tr className="border-b border-line bg-surface/40">
                          <th className="px-4 py-3 text-[11px] font-medium tracking-wider text-muted uppercase w-12">
                            #
                          </th>
                          <th className="px-4 py-3 text-[11px] font-medium tracking-wider text-muted uppercase">
                            {tab === "country" ? "País" : "Trader"}
                          </th>
                          <th className="px-4 py-3 text-right text-[11px] font-medium tracking-wider text-muted uppercase">
                            QP Ganados
                          </th>
                          <th className="px-4 py-3 text-right text-[11px] font-medium tracking-wider text-muted uppercase">
                            Torneos
                          </th>
                          <th className="px-4 py-3 text-right text-[11px] font-medium tracking-wider text-muted uppercase">
                            Sharpe
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {rest.map((entry) => (
                          <LeaderboardRow
                            key={`${tab}-${entry.user_id}`}
                            entry={entry}
                            highlight={user?.id === entry.user_id}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}