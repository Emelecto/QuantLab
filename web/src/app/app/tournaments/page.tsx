import { listTournaments } from "@/lib/tournaments";
import { TournamentCard } from "./components/TournamentCard";

// No prerender: requiere el worker corriendo
export const dynamic = "force-dynamic";

export default async function TournamentsPage() {
  const tournaments = await listTournaments();

  return (
    <main className="flex min-h-screen flex-col">
      <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-ink">
              Torneos activos
            </h1>
            <p className="mt-2 text-sm text-muted">
              Compite contra la comunidad y gana QuantPoints apostando por tus estrategias.
            </p>
          </div>
        </div>

        {tournaments.length === 0 ? (
          <div className="mt-12 ql-glass ql-elev-1 rounded-xl px-6 py-14 text-center">
            <h3 className="text-lg font-semibold text-ink">
              No hay torneos activos
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted">
              Los torneos se crean automáticamente. Vuelve pronto para competir.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
