"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getPublicProfile } from "@/lib/tokens";
import { getProfileTournamentHistory, type TournamentSummary } from "@/lib/tournaments";
import { QPBadge, QPTierBadge } from "../components/QPBadge";
import { buttonClasses } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

const countryNames: Record<string, string> = {
  AR: "Argentina",
  BO: "Bolivia",
  BR: "Brasil",
  CL: "Chile",
  CO: "Colombia",
  CR: "Costa Rica",
  EC: "Ecuador",
  ES: "España",
  MX: "México",
  PE: "Perú",
  US: "Estados Unidos",
  VE: "Venezuela",
  UY: "Uruguay",
  PY: "Paraguay",
  PA: "Panamá",
};

function FlagEmoji({ country }: { country?: string | null }) {
  if (!country) return null;
  const codePoints = country
    .toUpperCase()
    .split("")
    .map((c) => 0x1f1e6 + c.charCodeAt(0) - 65);
  return <span className="text-[16px]" aria-label={country}>{String.fromCodePoint(...codePoints)}</span>;
}

export default function ProfilePage() {
  const params = useParams<{ id: string }>();
  const [profile, setProfile] = useState<Awaited<ReturnType<typeof getPublicProfile>> | null>(null);
  const [tournaments, setTournaments] = useState<Awaited<ReturnType<typeof getProfileTournamentHistory>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      getPublicProfile(params.id),
      getProfileTournamentHistory(params.id),
    ])
      .then(([p, t]) => {
        if (!active) return;
        setProfile(p);
        setTournaments(t);
        setError(null);
      })
      .catch((e) => {
        if (!active) return;
        setError(e instanceof Error ? e.message : "Error al cargar perfil");
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [params.id]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center text-muted">
        Cargando perfil…
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6">
        <p className="text-muted">Perfil no encontrado.</p>
        <Link href="/app/rankings" className={buttonClasses("secondary", "sm")}>
          Volver al leaderboard
        </Link>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col">
      <section className="border-b border-line">
        <div className="mx-auto w-full max-w-6xl px-6 pt-16 pb-10">
          <Link
            href="/app/rankings"
            className="metric text-[12px] text-muted hover:text-accent transition-colors"
          >
            ← Leaderboard
          </Link>
        </div>
      </section>

      {/* Header del perfil */}
      <section className="border-b border-line bg-surface/40">
        <div className="mx-auto w-full max-w-6xl px-6 py-8">
          <div className="flex flex-wrap items-start gap-6">
            {/* Avatar */}
            <div className="relative">
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt={profile.username}
                  className="h-24 w-24 rounded-full border-2 border-line object-cover"
                />
              ) : (
                <span className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-line bg-[#1a2131] metric text-[28px] text-muted">
                  {(profile.username ?? "??").slice(0, 2).toUpperCase()}
                </span>
              )}
              {profile.tier && (
                <span className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-accent border-2 border-bg flex items-center justify-center">
                  <span className="text-[8px]">◆</span>
                </span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-semibold tracking-tight text-ink">
                  @{profile.username}
                </h1>
                {profile.tier && <QPTierBadge tier={profile.tier as "bronze" | "silver" | "gold" | "platinum" | "diamond"} />}
              </div>

              {profile.display_name && (
                <p className="text-sm text-muted mt-0.5">{profile.display_name}</p>
              )}

              {profile.bio && (
                <p className="mt-3 text-sm leading-relaxed text-muted max-w-2xl">
                  {profile.bio}
                </p>
              )}

              <div className="mt-4 flex items-center gap-4 flex-wrap">
                {profile.country && (
                  <span className="flex items-center gap-1.5 text-sm text-muted">
                    <FlagEmoji country={profile.country} />
                    {countryNames[profile.country] ?? profile.country}
                  </span>
                )}
                <span className="metric text-sm text-muted">
                  {profile.strategies_count} estrategias públicas
                </span>
                <span className="metric text-sm text-muted">
                  {profile.tournaments_won} torneos ganados
                </span>
              </div>

              {/* Badges */}
              {profile.badges.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {profile.badges.map((b: any) => (
                    <Badge key={b} tone="cyan" mono>
                      {b}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* QP Badge */}
            <div className="text-right">
              <QPBadge amount={profile.qp_balance} size="lg" />
            </div>
          </div>
        </div>
      </section>

      {/* Contenido del perfil */}
      <section>
        <div className="mx-auto w-full max-w-6xl px-6 py-10 grid gap-8 lg:grid-cols-2">
          {/* Estrategias publicadas */}
          <div>
            <h2 className="text-lg font-semibold text-ink mb-4">
              Estrategias publicadas
            </h2>
            <div className="ql-glass ql-elev-1 rounded-xl px-6 py-10 text-center">
              <p className="text-sm text-muted">
                {profile.strategies_count > 0
                  ? `${profile.strategies_count} estrategias públicas`
                  : "Sin estrategias públicas todavía."}
              </p>
            </div>
          </div>

          {/* Historial de torneos */}
          <div>
            <h2 className="text-lg font-semibold text-ink mb-4">
              Historial de torneos
            </h2>
            {tournaments && tournaments.length > 0 ? (
              <div className="ql-glass overflow-hidden rounded-xl">
                <ul className="divide-y divide-line max-h-[400px] overflow-y-auto">
                  {tournaments.map((t) => (
                    <li key={t.id} className="ql-row flex items-center gap-3 px-5 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium text-ink truncate">
                          {t.name}
                        </p>
                        <p className="metric text-[11px] text-muted">
                          {new Date(t.joined_at).toLocaleDateString("es-ES")}
                        </p>
                      </div>
                      {t.placed != null && (
                        <Badge
                          tone={t.placed <= 3 ? "long" : "neutral"}
                          mono
                        >
                          #{t.placed}
                        </Badge>
                      )}
                      <span className="metric text-[12px] text-accent">
                        {t.qp_prize.toLocaleString()} QP
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="ql-glass ql-elev-1 rounded-xl px-6 py-10 text-center">
                <p className="text-sm text-muted">
                  Sin participaciones en torneos.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}