"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/useAuth";
import { getBalance } from "@/lib/tokens";
import { useProgress } from "@/lib/learn/progress";
import { modules } from "@/lib/learn/modules";
import { TIER } from "@/lib/constants";
import { TierBadge } from "@/components/ui/TierBadge";
import { Card, CardBody } from "@/components/ui/Card";
import { buttonClasses } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";

type BalanceData = {
  balance: number;
  lifetime_earned: number;
  lifetime_spent: number;
  tier: "free" | "plus" | "pro" | "legend";
  updated_at: string;
};

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function StatTile({
  label,
  value,
  prefix = "",
  suffix = "",
  tone,
}: {
  label: string;
  value: string | number | null;
  prefix?: string;
  suffix?: string;
  tone?: "accent" | "long" | "short";
}) {
  const toneClass =
    tone === "accent"
      ? "text-accent"
      : tone === "long"
        ? "text-long"
        : tone === "short"
          ? "text-short"
          : "text-ink";
  return (
    <div className="ql-glass ql-elev-1 rounded-xl px-4 py-4 text-center">
      <div className="metric text-[11px] uppercase tracking-wide text-muted">
        {label}
      </div>
      <div className={`metric mt-1.5 text-2xl font-semibold ${toneClass}`}>
        {value == null || value === "--" ? (
          "--"
        ) : (
          <>
            {prefix}
            {typeof value === "number" ? value.toLocaleString("es-CO") : value}
            {suffix && <span className="ml-1 text-sm">{suffix}</span>}
          </>
        )}
      </div>
    </div>
  );
}

export function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const progress = useProgress();
  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setBalanceLoading(false);
      return;
    }
    setBalanceLoading(true);
    getBalance()
      .then(setBalance)
      .catch(() => setBalance(null))
      .finally(() => setBalanceLoading(false));
  }, [user]);

  if (authLoading) {
    return (
      <main className="flex min-h-screen flex-col">
        <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-14">
          <div className="ql-skeleton-line w-48 h-8" />
          <div className="ql-skeleton-line w-72 h-4 mt-2" />
          <div className="mt-8 grid gap-4 grid-cols-1 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="ql-skeleton-card rounded-xl p-5 space-y-3">
                <div className="ql-skeleton-line w-20" />
                <div className="ql-skeleton-line w-32 h-8 mt-2" />
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6">
        <p className="text-sm text-muted">No has iniciado sesion.</p>
        <Link href="/login" className={buttonClasses("primary", "md")}>
          Iniciar sesion
        </Link>
      </main>
    );
  }

  const displayName =
    (user.user_metadata?.full_name as string | undefined) ||
    (user.user_metadata?.name as string | undefined) ||
    user.email?.split("@")[0] ||
    "Trader";

  const tier = balance?.tier || "free";
  const tierInfo = TIER[tier as keyof typeof TIER] || TIER.free;

  const completedModules = progress.completedModules.length;
  const totalModules = modules.length;
  const coursePercent =
    totalModules > 0
      ? Math.round((completedModules / totalModules) * 100)
      : 0;

  const tournamentsEntered = progress.tournamentsEntered.length;

  return (
    <main className="flex min-h-screen flex-col">
      <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-14">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-4 animate-fadeIn">
          {/* Avatar */}
          <span
            className="flex h-20 w-20 items-center justify-center rounded-full metric text-[28px] font-semibold text-[#0a0c10]"
            style={{
              background: "linear-gradient(135deg, #5eead4 0%, #38bdf8 100%)",
            }}
          >
            {getInitials(displayName)}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-semibold tracking-tight text-ink">
                {displayName}
              </h1>
              <TierBadge tier={tier} />
            </div>
            <p className="text-sm text-muted mt-0.5">{user.email}</p>
          </div>
          <Link
            href="/app/profile/settings"
            className={buttonClasses("secondary", "md")}
          >
            Configuracion
          </Link>
        </div>

        {/* Stats row */}
        <div className="mt-8 grid gap-4 grid-cols-2 sm:grid-cols-4 animate-fadeIn">
          <StatTile
            label="QP disponibles"
            value={balance?.balance ?? "--"}
            tone="accent"
          />
          <StatTile
            label="Torneos entrados"
            value={tournamentsEntered}
          />
          <StatTile
            label="Win rate"
            value="--"
            suffix="%"
          />
          <StatTile
            label="Mejor ranking"
            value="--"
            prefix="#"
          />
        </div>

        {/* Main content grid */}
        <div className="mt-8 grid gap-6 grid-cols-1 lg:grid-cols-3 animate-fadeIn">
          {/* Suscripcion */}
          <Card className="lg:col-span-1">
            <CardBody className="p-6">
              <h2 className="text-sm font-semibold text-ink mb-4">
                Suscripcion
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted">
                    Plan actual
                  </p>
                  <p className="text-lg font-semibold text-ink mt-0.5">
                    {tierInfo.label}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted">
                    QP disponibles
                  </p>
                  <p className="metric text-accent ql-glow-text text-2xl font-semibold mt-0.5">
                    {balanceLoading ? (
                      <Skeleton variant="line" className="w-24 h-8" />
                    ) : (
                      `${(balance?.balance ?? 0).toLocaleString("es-CO")} QP`
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted">
                    Proxima renovacion
                  </p>
                  <p className="text-sm text-ink mt-0.5">--</p>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Seguridad */}
          <Card className="lg:col-span-1">
            <CardBody className="p-6">
              <h2 className="text-sm font-semibold text-ink mb-4">
                Seguridad
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted">
                    Contrasena
                  </p>
                  <p className="text-sm text-ink mt-0.5">••••••••</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted">
                    Autenticacion en dos pasos
                  </p>
                  <p className="text-sm text-muted mt-0.5">Desactivada</p>
                </div>
                <Link
                  href="/app/profile/settings#security"
                  className={buttonClasses("secondary", "sm")}
                >
                  Cambiar contrasena
                </Link>
              </div>
            </CardBody>
          </Card>

          {/* Progreso del curso */}
          <Card className="lg:col-span-1">
            <CardBody className="p-6">
              <h2 className="text-sm font-semibold text-ink mb-4">
                Progreso del curso
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted">
                    Modulos completados
                  </p>
                  <p className="text-sm text-ink mt-0.5">
                    {completedModules} de {totalModules}
                  </p>
                </div>
                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-surface overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full transition-all duration-500"
                    style={{ width: `${coursePercent}%` }}
                  />
                </div>
                <p className="metric text-xs text-muted">{coursePercent}% completado</p>
                {progress.badgeEarned && (
                  <div className="mt-2">
                    <span className="inline-flex items-center gap-1 rounded border border-accent/30 bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent">
                      Insignia de curso completada
                    </span>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Estadisticas de trading */}
        <div className="mt-8 animate-fadeIn">
          <h2 className="text-lg font-semibold text-ink mb-4">
            Estadisticas de trading
          </h2>
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
            <StatTile label="Torneos entrados" value={tournamentsEntered} />
            <StatTile label="Win rate" value="--" suffix="%" />
            <StatTile label="Mejor ranking" value="--" prefix="#" />
            <StatTile label="Retorno acumulado" value="--" suffix="%" tone="long" />
          </div>
          <p className="mt-3 text-[11px] text-muted">
            Los datos se conectan automaticamente cuando participas en torneos.
          </p>
        </div>
      </div>
    </main>
  );
}