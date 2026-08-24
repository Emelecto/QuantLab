"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getTournament, getLeaderboard, getMySubmission } from "@/lib/tournaments";
import type { Tournament, LeaderboardEntry, Submission } from "@/lib/tournaments";
import { EquityChart } from "@/components/EquityChart";

export default function TournamentDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [mySub, setMySub] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [t, lb, me] = await Promise.all([
          getTournament(id),
          getLeaderboard(id),
          getMySubmission(id),
        ]);
        setTournament(t);
        setLeaderboard(lb);
        setMySub(me);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <div className="p-14 text-muted">Cargando...</div>;
  if (!tournament) return <div className="p-14 text-muted">Torneo no encontrado</div>;

  return (
    <main className="flex min-h-screen flex-col">
      <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-14">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-ink">
              {tournament.name}
            </h1>
            <p className="mt-2 text-sm text-muted">
              {tournament.asset_type} · {tournament.symbols.join(", ")} · {tournament.timeframe}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded border border-line bg-surface px-3 py-1.5 text-sm text-muted">
              {tournament.status === "open" ? "🟢 Abierto" : tournament.status === "closed" ? "🔴 Cerrado" : tournament.status}
            </span>
            <span className="rounded border border-accent/30 bg-accent/10 px-3 py-1.5 text-sm font-medium text-accent">
              {tournament.prize_pool_qp} QP
            </span>
          </div>
        </div>

        {/* Reglas */}
        {tournament.rules_text && (
          <div className="mt-6 ql-glass ql-elev-1 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-ink">Reglas</h2>
            <p className="mt-2 text-sm text-muted">{tournament.rules_text}</p>
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted">
              <span>Métrica: <strong className="text-ink">{tournament.primary_metric}</strong></span>
              <span>Min trades: <strong className="text-ink">{tournament.min_trades}</strong></span>
              <span>Max slippage: <strong className="text-ink">{(tournament.max_slippage_pct * 100).toFixed(2)}%</strong></span>
            </div>
          </div>
        )}

        {/* Mi submission */}
        {mySub && (
          <div className="mt-6 ql-glass ql-elev-1 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-ink">Mi submission</h2>
            <div className="mt-2 flex flex-wrap gap-3 text-sm">
              <span className="text-muted">Estado: <strong className="text-ink">{mySub.status}</strong></span>
              {mySub.primary_score != null && (
                <span className="text-muted">Score: <strong className="text-accent">{mySub.primary_score.toFixed(3)}</strong></span>
              )}
              {mySub.rank != null && (
                <span className="text-muted">Rank: <strong className="text-ink">#{mySub.rank}</strong></span>
              )}
              {mySub.qp_earned > 0 && (
                <span className="text-muted">QP ganados: <strong className="text-long">+{mySub.qp_earned}</strong></span>
              )}
            </div>
          </div>
        )}

        {/* Leaderboard */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-ink">Leaderboard</h2>
          {leaderboard.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Aún no hay submissions evaluadas.</p>
          ) : (
            <div className="mt-3 ql-glass ql-elev-1 overflow-hidden rounded-xl">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Usuario</th>
                    <th className="px-4 py-3 text-right">Score</th>
                    <th className="px-4 py-3 text-right">QP</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((e) => (
                    <tr key={e.user_id} className="border-b border-line/50">
                      <td className="px-4 py-3 font-mono text-ink">{e.rank}</td>
                      <td className="px-4 py-3 text-ink">
                        {e.display_name || e.username || e.user_id.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-accent">
                        {e.score.toFixed(3)}
                      </td>
                      <td className="px-4 py-3 text-right text-long">+{e.qp_earned}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Botón submit */}
        {tournament.status === "open" && (
          <div className="mt-8">
            <Link
              href={`/app/tournaments/${id}/submit`}
              className="inline-flex items-center gap-2 rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-bg hover:bg-accent/90 transition-colors"
            >
              Enviar estrategia
            </Link>
          </div>
        )}

        {/* Disclaimer */}
        <p className="mt-8 text-[11px] text-muted">
          QuantLab es una herramienta de investigación. No es asesoría financiera ni recomendación de inversión.
        </p>
      </div>
    </main>
  );
}
