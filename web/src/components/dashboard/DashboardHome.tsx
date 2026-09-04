"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { useDashboardData } from "./useDashboardData";
import { modules as courseModules } from "@/lib/learn/modules";
import {
  getQPRanking,
  getTournamentRanking,
  type RankingPeriod,
  type QPRankingEntry,
  type TournamentRankingEntry,
} from "@/lib/rankings";
import "./bento.css";
import "./dashboard.css";

type RankingTab = "qp" | "tournaments";
const PERIOD_OPTIONS: { value: RankingPeriod; label: string }[] = [
  { value: "week", label: "Semana" },
  { value: "month", label: "Mes" },
  { value: "3months", label: "3 meses" },
];

const integerFormatter = new Intl.NumberFormat("es-419", {
  maximumFractionDigits: 0,
});

function formatNumber(value: number | null): string | null {
  return value != null && Number.isFinite(value)
    ? integerFormatter.format(value)
    : null;
}

function formatDateTime(value: string | null): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("es-419", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

function StatusBadge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "positive" | "negative" | "pending";
}) {
  return (
    <span className={`ql-dashboard-status ql-dashboard-status--${tone}`}>
      {label}
    </span>
  );
}

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <article className={`ql-bento-card ql-glass ql-elev-1 ${className}`}>{children}</article>;
}

function CardHeaderWithIcon({
  icon,
  title,
  subtitle,
  badge,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  badge?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="ql-bento-card-header">
      <div className="ql-bento-card-header-title">
        <span className="ql-bento-card-icon">{icon}</span>
        <div className="ql-bento-card-title">
          <h3>{title}</h3>
          {subtitle && <p className="ql-bento-card-subtitle">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {badge && <span className="ql-bento-card-badge">{badge}</span>}
        {action}
      </div>
    </div>
  );
}

function SectionLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="ql-section-link">
      {label}
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 12h14M12 5l7 7-7 7" />
      </svg>
    </Link>
  );
}

function DashboardHome() {
  const { user } = useAuth();
  const { qp, course, ranking, strategies, tournaments, loading, error, sources } =
    useDashboardData();

  const [rankingTab, setRankingTab] = useState<RankingTab>("qp");
  const [period, setPeriod] = useState<RankingPeriod>("month");
  const [qpRanking, setQpRanking] = useState<QPRankingEntry[]>([]);
  const [tournamentRanking, setTournamentRanking] = useState<TournamentRankingEntry[]>([]);
  const [rankingLoading, setRankingLoading] = useState(false);

  const fullName = user?.user_metadata?.full_name;
  const name =
    typeof fullName === "string" && fullName.trim()
      ? fullName
      : user?.email?.split("@")[0] ?? "Usuario";

  const completedModuleIds = new Set<string>(
      ((course as { completed_modules?: number[] | null })?.completed_modules ?? []).map(String),
    );
    const totalModules = courseModules.length;
    const completedCount = completedModuleIds.size;
    const coursePct =
      totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0;

  const loadRanking = async (tab: RankingTab, p: RankingPeriod) => {
    setRankingLoading(true);
    try {
      if (tab === "qp") {
        const { entries } = await getQPRanking(p);
        setQpRanking(entries);
      } else {
        const { entries } = await getTournamentRanking(p);
        setTournamentRanking(entries);
      }
    } catch {
      /* ignore */
    } finally {
      setRankingLoading(false);
    }
  };

  const handleTabChange = (tab: RankingTab) => {
    setRankingTab(tab);
    loadRanking(tab, period);
  };

  const handlePeriodChange = (p: RankingPeriod) => {
    setPeriod(p);
    loadRanking(rankingTab, p);
  };

  const rankingEntries = rankingTab === "qp" ? qpRanking : tournamentRanking;
  const myTournaments = tournaments.slice(0, 6);
  const hasMoreTournaments = tournaments.length > 6;
  const myStrategies = strategies.slice(0, 6);

  // Cargar el ranking al montar para que aparezca instantáneamente sin requerir click.
  useEffect(() => {
    loadRanking(rankingTab, period);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="ql-dash-content" aria-busy={loading}>
      {error && (
        <div className="ql-dashboard-notice ql-dashboard-notice--error" role="alert">
          <span>{error}</span>
        </div>
      )}

      <div className="ql-bento-grid">
        {/* Competencias — fila 1 izquierda */}
        <Card className="ql-bento-competencias">
          <CardHeaderWithIcon
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 01-10 0V4z" />
                <path d="M17 4h3v2a3 3 0 01-3 3M7 4H4v2a3 3 0 003 3" />
              </svg>
            }
            title="Competencias"
            subtitle="Torneos activos y próximos"
            badge={myTournaments.length > 0 ? `${myTournaments.length} activas` : undefined}
            action={<SectionLink href="/app/tournaments" label="Ver todas" />}
          />
          <div className="ql-bento-competencias-body">
            {sources.tournaments === "loading" ? (
              <div className="ql-bento-empty">Cargando competencias...</div>
            ) : myTournaments.length === 0 ? (
              <div className="ql-bento-empty">
                <p>No estás inscrito en ninguna competencia.</p>
                <Link href="/app/tournaments" className="ql-btn-primary">
                  Explorar competencias
                </Link>
              </div>
            ) : (
              <div className="ql-competencias-grid">
                {myTournaments.map((t) => {
                  const deadline = formatDateTime(t.deadline);
                  const isEnding = t.deadline && new Date(t.deadline) > new Date();
                  return (
                    <Link
                      key={t.id}
                      href={`/app/tournaments/${t.id}`}
                      className="ql-competencia-mini"
                    >
                      <div className="ql-competencia-mini-header">
                        <div className="ql-competencia-mini-top">
                          <span className="ql-competencia-mini-type">
                            {t.type === "ml" ? "ML" : "Estrategias"}
                          </span>
                          {t.submission && (
                            <span className={`ql-competencia-mini-status${t.submission.status === "pending" || t.submission.status === "running" ? " pending" : ""}`}>
                              {t.submission.status === "done" || t.submission.status === "scored" ? "Evaluada" : "Pendiente"}
                            </span>
                          )}
                        </div>
                        <h4 className="ql-competencia-mini-name">{t.name}</h4>
                      </div>
                      <div className="ql-competencia-mini-body">
                        {t.symbol && <span className="ql-competencia-mini-badge">{t.symbol}</span>}
                        <span className="ql-competencia-mini-badge">{t.asset_type}</span>
                      </div>
                      <div className="ql-competencia-mini-footer">
                        <div className="ql-competencia-mini-prize">
                          <span className="ql-competencia-mini-prize-label">Premio</span>
                          <span className="ql-competencia-mini-prize-value">{formatNumber(t.qp_prize)} QP</span>
                        </div>
                        <span className="ql-competencia-mini-countdown">
                          {isEnding ? "Termina: " : "Inicia: "}{deadline}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
          {hasMoreTournaments && (
            <div className="ql-bento-competencias-footer">
              <Link href="/app/tournaments" className="ql-btn-secondary">
                Ir a competencias
              </Link>
            </div>
          )}
        </Card>

        {/* Ranking — columna derecha, ambas filas */}
        <Card className="ql-bento-ranking">
          <div className="ql-ranking-header">
            <CardHeaderWithIcon
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 20V10M12 20V4M6 20v-6" />
                </svg>
              }
              title="Ranking en la comunidad"
              subtitle="Top traders esta semana"
            />
            <div className="ql-ranking-filters">
              <div className="ql-ranking-tabs">
                <button
                  type="button"
                  className={`ql-ranking-tab${rankingTab === "qp" ? " active" : ""}`}
                  onClick={() => handleTabChange("qp")}
                >
                  QP
                </button>
                <button
                  type="button"
                  className={`ql-ranking-tab${rankingTab === "tournaments" ? " active" : ""}`}
                  onClick={() => handleTabChange("tournaments")}
                >
                  Torneos
                </button>
              </div>
              <div className="ql-ranking-period">
                <select
                  value={period}
                  onChange={(e) => handlePeriodChange(e.target.value as RankingPeriod)}
                  aria-label="Período"
                >
                  {PERIOD_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="ql-ranking-body">
            {rankingLoading ? (
              <div className="ql-bento-empty">Cargando ranking...</div>
            ) : rankingEntries.length === 0 ? (
              <div className="ql-bento-empty">
                No hay datos para este período.
              </div>
            ) : (
              <ol className="ql-ranking-list">
                {rankingEntries.map((entry) => (
                  <li
                    key={entry.user_id}
                    className={`ql-ranking-item${entry.is_me ? " is-me" : ""}`}
                  >
                    <span className={`ql-ranking-pos${entry.rank <= 3 ? " top" : ""}`}>
                      #{entry.rank}
                    </span>
                    <div className="ql-ranking-avatar">
                      {(entry as QPRankingEntry).avatar_url ? (
                        <img
                          src={(entry as QPRankingEntry).avatar_url!}
                          alt=""
                          width={20}
                          height={20}
                        />
                      ) : (
                        <span className="ql-ranking-avatar-fallback">
                          {entry.username.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="ql-ranking-info">
                      <span className="ql-ranking-name">
                        {entry.username}
                        {entry.is_me && <span className="ql-ranking-me">Tú</span>}
                      </span>
                      <span className="ql-ranking-stat">
                        {rankingTab === "qp" ? (
                          <>
                            {formatNumber((entry as QPRankingEntry).qp)}{" "}
                            <span className="ql-ranking-qp">QP</span>
                          </>
                        ) : (
                          <>
                            {formatNumber(
                              (entry as TournamentRankingEntry).tournaments_won,
                            )}{" "}
                            ganados
                          </>
                        )}
                      </span>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </Card>

        {/* Estrategias + Aprendizaje — fila 2 */}
        <div className="ql-bento-bottom-left">
          <Card className="ql-bento-estrategias">
            <CardHeaderWithIcon
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              }
              title="Estrategias"
              subtitle="Tus estrategias en backtesting"
              badge={`${strategies.length} activas`}
            />
            <div className="ql-estrategias-body">
              {sources.strategies === "loading" ? (
                <div className="ql-bento-empty">Cargando estrategias...</div>
              ) : myStrategies.length === 0 ? (
                <div className="ql-bento-empty">
                  <p>No tienes estrategias aún.</p>
                  <Link href="/app/strategies/new" className="ql-btn-primary">
                    Crear estrategia
                  </Link>
                </div>
              ) : (
                <div className="ql-estrategias-grid">
                  {myStrategies.map((s) => (
                    <Link
                      key={s.id}
                      href={`/app/strategies/${s.id}/results`}
                      className="ql-estrategia-item"
                    >
                      <span className="ql-estrategia-symbol">{s.symbol}</span>
                      <div className="ql-estrategia-info">
                        <h4>{s.title}</h4>
                        <span className="ql-estrategia-meta">
                          {s.asset_type} · {s.timeframe}
                        </span>
                      </div>
                      {s.last_sharpe_oos != null && (
                        <span className="ql-estrategia-metric">
                          {s.last_sharpe_oos.toFixed(2)}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </Card>

          <Card className="ql-bento-aprendizaje">
            <CardHeaderWithIcon
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c3 3 9 3 12 0v-5" />
                </svg>
              }
              title="Cursos de aprendizaje"
              subtitle="Continúa donde lo dejaste"
            />
            <div className="ql-aprendizaje-body">
              <div className="ql-aprendizaje-progress">
                <div className="ql-aprendizaje-ring">
                  <svg viewBox="0 0 100 100" width="60" height="60">
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="var(--ql-line)"
                      strokeWidth="8"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="var(--ql-accent)"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${(coursePct / 100) * 264} 264`}
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  <span className="ql-aprendizaje-percent">{coursePct}%</span>
                </div>
                <div className="ql-aprendizaje-text">
                  <p className="ql-aprendizaje-label">Progreso del curso</p>
                  <p className="ql-aprendizaje-detail">
                    {completedCount} de {totalModules} módulos
                  </p>
                </div>
              </div>
              <Link href="/app/learn" className="ql-btn-secondary ql-aprendizaje-cta">
                Continuar aprendizaje
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}

export { DashboardHome };
