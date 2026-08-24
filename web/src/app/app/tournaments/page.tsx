import Link from "next/link";
import { listTournaments } from "@/lib/tournaments";
import { TournamentCard } from "./components/TournamentCard";
import { useAuth } from "@/lib/useAuth";
import { getBalance } from "@/lib/tokens";
import { useState, useEffect } from "react";

// No prerender: requiere el worker corriendo
export const dynamic = "force-dynamic";

function EmptyTournamentsState({ hasQP }: { hasQP: boolean }) {
  return (
    <div className="mt-12 ql-glass ql-elev-1 rounded-xl px-6 py-14 text-center animate-fadeIn">
      <svg
        className="mx-auto mb-6 opacity-60"
        width="160"
        height="120"
        viewBox="0 0 160 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect x="30" y="40" width="100" height="60" rx="8" stroke="rgba(94,234,212,0.3)" strokeWidth="1.5" fill="none" />
        <path d="M50 70 L70 55 L90 65 L110 45" stroke="#5eead4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <circle cx="50" cy="70" r="3" fill="#5eead4" />
        <circle cx="70" cy="55" r="3" fill="#5eead4" />
        <circle cx="90" cy="65" r="3" fill="#5eead4" />
        <circle cx="110" cy="45" r="3" fill="#5eead4" />
        <path d="M130 30 L135 20 L140 30" stroke="rgba(56,189,248,0.5)" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="20" cy="25" r="2" fill="rgba(56,189,248,0.4)" />
        <circle cx="145" cy="90" r="1.5" fill="rgba(94,234,212,0.3)" />
      </svg>
      <h3 className="text-lg font-semibold text-ink">
        No hay torneos activos
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">
        Los torneos se crean automáticamente. Vuelve pronto para competir.
      </p>
      {hasQP && (
        <Link
          href="/app/tournaments/new"
          className="mt-6 inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-accent to-accent-2 px-5 py-2.5 text-sm font-medium text-bg shadow-lg shadow-accent/20 hover:shadow-accent/30 transition-all active:scale-95"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Crear torneo
        </Link>
      )}
    </div>
  );
}

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userQP, setUserQP] = useState<number>(0);
  const { user } = useAuth();

  useEffect(() => {
    (async () => {
      try {
        const list = await listTournaments();
        setTournaments(list);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const bal = await getBalance();
        setUserQP(bal?.balance ?? 0);
      } catch {}
    })();
  }, [user]);

  return (
    <main className="flex min-h-screen flex-col">
      <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-ink animate-fadeIn">
              Torneos activos
            </h1>
            <p className="mt-2 text-sm text-muted animate-fadeIn">
              Compite contra la comunidad y gana QuantPoints apostando por tus estrategias.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-fadeIn">
            {[1, 2, 3].map((i) => (
              <div key={i} className="ql-skeleton-card h-48 rounded-xl" />
            ))}
          </div>
        ) : tournaments.length === 0 ? (
          <EmptyTournamentsState hasQP={userQP > 0} />
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-fadeIn">
            {tournaments.map((t) => (
              <TournamentCard
                key={t.id}
                tournament={{
                  id: t.id,
                  name: t.name,
                  type: "custom",
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
                }}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
