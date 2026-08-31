"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { modules } from "@/lib/learn/modules";
import { useAuth } from "@/lib/useAuth";
import {
  useDashboardData,
  type DashboardSourceState,
  type DashboardTournament,
} from "./useDashboardData";
import "./dashboard.css";

type StatusTone = "neutral" | "positive" | "negative" | "pending";

type DashboardStateKind = "loading" | "empty" | "error";

const integerFormatter = new Intl.NumberFormat("es-419", {
  maximumFractionDigits: 0,
});

function formatNumber(value: number | null): string | null {
  return value != null && Number.isFinite(value)
    ? integerFormatter.format(value)
    : null;
}

function formatDecimal(value: number | null, digits = 2): string | null {
  if (value == null || !Number.isFinite(value)) return null;
  return new Intl.NumberFormat("es-419", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

function formatPercent(value: number | null): string | null {
  const formatted = formatDecimal(value == null ? null : value * 100, 1);
  return formatted == null ? null : `${formatted}%`;
}

function parsePersistedDate(value: string | null): Date | null {
  if (!value) return null;
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? `${value}T12:00:00`
    : value;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value: string | null): string | null {
  const date = parsePersistedDate(value);
  return date
    ? new Intl.DateTimeFormat("es-419", { dateStyle: "medium" }).format(date)
    : null;
}

function formatDateTime(value: string | null): string | null {
  const date = parsePersistedDate(value);
  return date
    ? new Intl.DateTimeFormat("es-419", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date)
    : null;
}

function readableStatus(status: string | null): string {
  const normalized = status?.trim().toLowerCase();
  const labels: Record<string, string> = {
    done: "Completada",
    pending: "Pendiente",
    running: "En ejecución",
    error: "Con error",
    scoring: "En evaluación",
    scored: "Evaluada",
    disqualified: "Descalificada",
    tested: "Probada",
    draft: "Borrador",
  };
  return normalized ? (labels[normalized] ?? status!.replaceAll("_", " ")) : "Registrado";
}

function toneForStatus(status: string | null): StatusTone {
  switch (status?.trim().toLowerCase()) {
    case "done":
    case "scored":
    case "tested":
      return "positive";
    case "error":
    case "disqualified":
      return "negative";
    case "pending":
    case "running":
    case "scoring":
      return "pending";
    default:
      return "neutral";
  }
}

function metricLabel(value: string): string {
  const labels: Record<string, string> = {
    deflated_sharpe_oos: "Deflated Sharpe OOS",
    sharpe_oos: "Sharpe OOS",
  };
  return labels[value] ?? value.replaceAll("_", " ");
}

function StatusBadge({ label, tone = "neutral" }: { label: string; tone?: StatusTone }) {
  return (
    <span className={`ql-dashboard-status ql-dashboard-status--${tone}`}>
      {label}
    </span>
  );
}

function DashboardState({
  kind,
  title,
  children,
  action,
}: {
  kind: DashboardStateKind;
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  const role = kind === "error" ? "alert" : kind === "loading" ? "status" : undefined;
  return (
    <div
      className={`ql-dashboard-state ql-dashboard-state--${kind} ql-glass ql-elev-1`}
      role={role}
    >
      <div>
        <p className="ql-dashboard-state-title">{title}</p>
        <p className="ql-dashboard-state-copy">{children}</p>
      </div>
      {action}
    </div>
  );
}

function SummaryCard({
  label,
  source,
  value,
  detail,
  emptyValue = "Sin registro",
}: {
  label: string;
  source: DashboardSourceState;
  value: string | null;
  detail: string;
  emptyValue?: string;
}) {
  const displayValue =
    source === "loading"
      ? "Cargando"
      : source === "error"
        ? "No disponible"
        : (value ?? emptyValue);

  return (
    <article className="ql-dashboard-summary ql-glass ql-elev-1">
      <p className="ql-dashboard-summary-label">{label}</p>
      <p
        className={`ql-dashboard-summary-value metric ${
          source === "loading" ? "ql-dashboard-summary-value--loading" : ""
        }`}
      >
        {displayValue}
      </p>
      <p className="ql-dashboard-summary-detail">{detail}</p>
    </article>
  );
}

function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="ql-dashboard-section-header">
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}

function SubmissionStatus({ tournament }: { tournament: DashboardTournament }) {
  if (tournament.submissionState === "loading") {
    return <StatusBadge label="Estado de envío: cargando" tone="pending" />;
  }
  if (tournament.submissionState === "unavailable") {
    return <StatusBadge label="Estado de envío no disponible" tone="neutral" />;
  }
  if (tournament.submissionState === "round-unavailable") {
    return <StatusBadge label="Ronda live no disponible" tone="neutral" />;
  }
  if (!tournament.submission) {
    return <StatusBadge label="Sin envío registrado" tone="neutral" />;
  }
  return (
    <StatusBadge
      label={`Envío: ${readableStatus(tournament.submission.status)}`}
      tone={toneForStatus(tournament.submission.status)}
    />
  );
}

export function DashboardHome() {
  const { user } = useAuth();
  const {
    qp,
    course,
    ranking,
    strategies,
    tournaments,
    loading,
    error,
    sources,
  } = useDashboardData();

  const fullName = user?.user_metadata?.full_name;
  const name =
    typeof fullName === "string" && fullName.trim()
      ? fullName
      : (user?.email?.split("@")[0] ?? "Usuario");

  const completedModuleIds = new Set(course?.completed_modules ?? []);
  const completedCount = modules.filter((module) =>
    completedModuleIds.has(module.def.id),
  ).length;
  const totalModules = modules.length;
  const hasPersistedModules = Array.isArray(course?.completed_modules);
  const coursePct =
    hasPersistedModules && totalModules > 0
      ? Math.round((completedCount / totalModules) * 100)
      : null;
  const courseComplete = coursePct === 100;
  const nextModule = modules.find(
    (module) => !completedModuleIds.has(module.def.id),
  );
  const courseSummary =
    coursePct == null ? null : `${coursePct}%`;
  const courseDetail =
    course && coursePct != null
      ? `${completedCount}/${totalModules} módulos guardados`
      : "El progreso aparece cuando se guarda en la ruta";
  const rankingValue = ranking ? `#${formatNumber(ranking.rank)}` : null;
  const rankingDetail = ranking
    ? `${formatNumber(ranking.qp_earned)} QP acumulados · ${formatNumber(
        ranking.total,
      )} perfiles consultados`
    : "La posición aparece cuando el perfil tiene datos publicados";

  return (
    <main className="ql-dash-content ql-dashboard" aria-busy={loading}>
      <header className="ql-dashboard-header">
        <h1>Hola, {name}</h1>
      </header>

      {loading && (
        <div className="ql-dashboard-notice ql-dashboard-notice--loading" role="status">
          Cargando datos persistidos del dashboard…
        </div>
      )}
      {error && (
        <div className="ql-dashboard-notice ql-dashboard-notice--error" role="alert">
          <span>{error}</span>
          <button
            type="button"
            className="ql-dashboard-retry"
            onClick={() => window.location.reload()}
          >
            Reintentar
          </button>
        </div>
      )}

      <section aria-labelledby="dashboard-resumen">
        <SectionHeader
          title="Resumen"
          description="Solo valores que existen en tus fuentes conectadas."
        />
        <div className="ql-dashboard-summary-grid">
          <SummaryCard
            label="Saldo disponible"
            source={sources.qp}
            value={formatNumber(qp) == null ? null : `${formatNumber(qp)} QP`}
            detail="Puntos virtuales disponibles en tu wallet."
            emptyValue="Sin saldo"
          />
          <SummaryCard
            label="Estrategias"
            source={sources.strategies}
            value={formatNumber(strategies.length)}
            detail="Estrategias registradas en tu cuenta."
            emptyValue="Sin estrategias"
          />
          <SummaryCard
            label="Aprendizaje"
            source={sources.course}
            value={courseSummary}
            detail={courseDetail}
            emptyValue="Sin registro"
          />
          <SummaryCard
            label="Posición por QP"
            source={sources.ranking}
            value={rankingValue}
            detail={rankingDetail}
            emptyValue="Sin posición"
          />
        </div>
      </section>

      <section aria-labelledby="dashboard-aprendizaje">
        <SectionHeader
          title="Aprendizaje"
          description="Progreso persistido de la Ruta Aprendiz."
          action={
            <Link href="/app/learn" className="ql-dashboard-action ql-btn-secondary">
              Abrir ruta
            </Link>
          }
        />
        {sources.course === "loading" ? (
          <DashboardState kind="loading" title="Cargando progreso guardado">
            Consultando los módulos completados y la actividad más reciente.
          </DashboardState>
        ) : sources.course === "error" ? (
          <DashboardState kind="error" title="No se pudo cargar el aprendizaje">
            El progreso guardado no está disponible en este momento.
          </DashboardState>
        ) : !course || coursePct == null ? (
          <DashboardState
            kind="empty"
            title="Aún no hay progreso guardado"
            action={
              <Link href="/app/learn" className="ql-dashboard-action ql-btn-primary">
                Empezar la ruta
              </Link>
            }
          >
            Completa un módulo en la Ruta Aprendiz para ver aquí tu avance persistido.
          </DashboardState>
        ) : (
          <article className="ql-dashboard-course ql-glass ql-elev-1">
            <div className="ql-dashboard-course-main">
              <div>
                <p className="ql-dashboard-card-kicker">
                  {courseComplete ? "Ruta completada" : "Siguiente módulo"}
                </p>
                <h3>
                  {courseComplete
                    ? "Completaste la Ruta Aprendiz"
                    : (nextModule?.def.title ?? "Progreso actualizado")}
                </h3>
                <p>
                  {courseComplete
                    ? "Tu avance está guardado y puedes volver a revisar los módulos cuando quieras."
                    : `${completedCount} de ${totalModules} módulos completados.`}
                </p>
              </div>
              <div className="ql-dashboard-course-percent metric">{coursePct}%</div>
            </div>
            <div
              className="ql-dashboard-progress"
              role="progressbar"
              aria-label="Progreso del curso"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={coursePct}
            >
              <span style={{ width: `${coursePct}%` }} />
            </div>
            <dl className="ql-dashboard-facts">
              <div>
                <dt>Módulos</dt>
                <dd className="metric">
                  {completedCount}/{totalModules}
                </dd>
              </div>
              {course.xp != null && (
                <div>
                  <dt>XP guardado</dt>
                  <dd className="metric">{formatNumber(course.xp)} XP</dd>
                </div>
              )}
              {course.streak != null && (
                <div>
                  <dt>Racha</dt>
                  <dd className="metric">{formatNumber(course.streak)} días</dd>
                </div>
              )}
              {formatDate(course.last_active_date) && (
                <div>
                  <dt>Última actividad</dt>
                  <dd>{formatDate(course.last_active_date)}</dd>
                </div>
              )}
            </dl>
            <Link href="/app/learn" className="ql-dashboard-action ql-btn-primary">
              {courseComplete ? "Ver la ruta" : "Continuar aprendizaje"}
            </Link>
          </article>
        )}
      </section>

      <section aria-labelledby="dashboard-torneos">
        <SectionHeader
          title="Torneos disponibles"
          description="Competiciones abiertas y el estado real de tu envío."
          action={
            <Link
              href="/app/tournaments"
              className="ql-dashboard-action ql-btn-secondary"
            >
              Ver todos
            </Link>
          }
        />
        {sources.tournaments === "loading" ? (
          <DashboardState kind="loading" title="Cargando torneos abiertos">
            Consultando las competiciones disponibles en el worker.
          </DashboardState>
        ) : sources.tournaments === "error" ? (
          <DashboardState kind="error" title="No se pudieron cargar los torneos">
            Las competiciones abiertas no están disponibles en este momento.
          </DashboardState>
        ) : tournaments.length === 0 ? (
          <DashboardState
            kind="empty"
            title="No hay torneos abiertos"
            action={
              <Link
                href="/app/tournaments"
                className="ql-dashboard-action ql-btn-secondary"
              >
                Revisar torneos
              </Link>
            }
          >
            Cuando se publique una competencia abierta aparecerá en esta vista.
          </DashboardState>
        ) : (
          <div className="ql-dashboard-card-grid">
            {tournaments.map((tournament) => {
              const deadline = formatDateTime(tournament.deadline);
              const submission = tournament.submission;
              const submittedAt = formatDateTime(submission?.submitted_at ?? null);
              const score = formatDecimal(submission?.score ?? null, 3);
              const prize = formatNumber(tournament.qp_prize);
              const participants = formatNumber(tournament.participants);

              return (
                <article
                  key={tournament.id}
                  className="ql-dashboard-tournament ql-dashboard-card ql-glass ql-elev-1"
                >
                  <div className="ql-dashboard-card-header">
                    <span className="ql-dashboard-kind">
                      {tournament.type === "ml" ? "Predicciones ML" : "Estrategias"}
                    </span>
                    <SubmissionStatus tournament={tournament} />
                  </div>
                  <h3>{tournament.name}</h3>
                  <dl className="ql-dashboard-facts">
                    {tournament.symbol && (
                      <div>
                        <dt>Activo</dt>
                        <dd className="metric">{tournament.symbol}</dd>
                      </div>
                    )}
                    {deadline && (
                      <div>
                        <dt>Cierre</dt>
                        <dd>{deadline}</dd>
                      </div>
                    )}
                    {prize && (
                      <div>
                        <dt>Bolsa</dt>
                        <dd className="metric">{prize} QP</dd>
                      </div>
                    )}
                    {participants && (
                      <div>
                        <dt>Participantes</dt>
                        <dd className="metric">{participants}</dd>
                      </div>
                    )}
                    {tournament.metric_label && (
                      <div>
                        <dt>Métrica</dt>
                        <dd>{metricLabel(tournament.metric_label)}</dd>
                      </div>
                    )}
                  </dl>
                  {submission && tournament.submissionState === "ready" && (
                    <dl className="ql-dashboard-submission-facts">
                      {submission.rank != null && (
                        <div>
                          <dt>Posición</dt>
                          <dd className="metric">#{formatNumber(submission.rank)}</dd>
                        </div>
                      )}
                      {score && (
                        <div>
                          <dt>Puntaje</dt>
                          <dd className="metric">{score}</dd>
                        </div>
                      )}
                      {submission.qp_earned != null && (
                        <div>
                          <dt>QP obtenidos</dt>
                          <dd className="metric">{formatNumber(submission.qp_earned)}</dd>
                        </div>
                      )}
                      {submittedAt && (
                        <div>
                          <dt>Enviado</dt>
                          <dd>{submittedAt}</dd>
                        </div>
                      )}
                    </dl>
                  )}
                  <Link
                    href={`/app/tournaments/${tournament.id}`}
                    className="ql-dashboard-action ql-btn-secondary"
                  >
                    Abrir torneo
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section aria-labelledby="dashboard-estrategias">
        <SectionHeader
          title="Mis estrategias"
          description="Cada tarjeta muestra la última ejecución persistida, si existe."
          action={
            <Link
              href="/app/strategies/new"
              className="ql-dashboard-action ql-btn-primary"
            >
              Crear estrategia
            </Link>
          }
        />
        {sources.strategies === "loading" ? (
          <DashboardState kind="loading" title="Cargando estrategias">
            Consultando tus estrategias y sus últimas corridas.
          </DashboardState>
        ) : sources.strategies === "error" ? (
          <DashboardState kind="error" title="No se pudieron cargar las estrategias">
            Tus estrategias no están disponibles en este momento.
          </DashboardState>
        ) : strategies.length === 0 ? (
          <DashboardState
            kind="empty"
            title="Aún no tienes estrategias"
            action={
              <Link
                href="/app/strategies/new"
                className="ql-dashboard-action ql-btn-primary"
              >
                Crear estrategia
              </Link>
            }
          >
            Crea una estrategia y ejecuta un backtest para verla resumida aquí.
          </DashboardState>
        ) : (
          <div className="ql-dashboard-card-grid ql-dashboard-card-grid--strategies">
            {strategies.map((strategy) => {
              const lastRunAt = formatDateTime(strategy.last_run_at);
              const sharpe = formatDecimal(strategy.last_sharpe_oos, 2);
              const maxDd = formatPercent(strategy.last_maxdd);

              return (
                <article
                  key={strategy.id}
                  className="ql-dashboard-strategy ql-dashboard-card ql-glass ql-elev-1"
                >
                  <div className="ql-dashboard-card-header">
                    <span className="ql-dashboard-kind metric">{strategy.symbol}</span>
                    {strategy.status && (
                      <StatusBadge
                        label={`Estrategia: ${readableStatus(strategy.status)}`}
                        tone={toneForStatus(strategy.status)}
                      />
                    )}
                  </div>
                  <h3>{strategy.title}</h3>
                  <p className="ql-dashboard-card-meta">
                    {strategy.asset_type} · {strategy.timeframe}
                  </p>
                  <div className="ql-dashboard-run">
                    <span>Última ejecución</span>
                    {strategy.last_run_at ? (
                      <strong>{lastRunAt ?? "Fecha no disponible"}</strong>
                    ) : (
                      <strong>Sin ejecuciones registradas</strong>
                    )}
                    {strategy.last_run_status && (
                      <StatusBadge
                        label={readableStatus(strategy.last_run_status)}
                        tone={toneForStatus(strategy.last_run_status)}
                      />
                    )}
                  </div>
                  {(sharpe || maxDd) && (
                    <dl className="ql-dashboard-facts">
                      {sharpe && (
                        <div>
                          <dt>Sharpe OOS</dt>
                          <dd className="metric">{sharpe}</dd>
                        </div>
                      )}
                      {maxDd && (
                        <div>
                          <dt>Max DD</dt>
                          <dd className="metric">{maxDd}</dd>
                        </div>
                      )}
                    </dl>
                  )}
                  <Link
                    href={`/app/strategies/${strategy.id}`}
                    className="ql-dashboard-action ql-btn-secondary"
                  >
                    Ver estrategia
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section aria-labelledby="dashboard-ranking">
        <SectionHeader
          title="Ranking"
          description="Posición calculada desde los QP acumulados persistidos en tu perfil."
          action={
            <Link href="/app/rankings" className="ql-dashboard-action ql-btn-secondary">
              Ver ranking
            </Link>
          }
        />
        {sources.ranking === "loading" ? (
          <DashboardState kind="loading" title="Calculando tu posición">
            Consultando los QP acumulados en los perfiles publicados.
          </DashboardState>
        ) : sources.ranking === "error" ? (
          <DashboardState kind="error" title="No se pudo cargar el ranking">
            La posición por QP no está disponible en este momento.
          </DashboardState>
        ) : !ranking ? (
          <DashboardState
            kind="empty"
            title="Tu perfil aún no tiene una posición disponible"
            action={
              <Link href="/app/rankings" className="ql-dashboard-action ql-btn-secondary">
                Abrir ranking
              </Link>
            }
          >
            La posición aparecerá cuando haya datos de perfil y QP acumulados publicados.
          </DashboardState>
        ) : (
          <article className="ql-dashboard-ranking ql-glass ql-elev-1">
            <div>
              <p className="ql-dashboard-card-kicker">Posición actual</p>
              <p className="ql-dashboard-ranking-value metric">
                #{formatNumber(ranking.rank)}
              </p>
              <p className="ql-dashboard-card-meta">
                Empates con los mismos QP acumulados comparten posición.
              </p>
            </div>
            <dl className="ql-dashboard-facts">
              <div>
                <dt>QP acumulados</dt>
                <dd className="metric">{formatNumber(ranking.qp_earned)} QP</dd>
              </div>
              <div>
                <dt>Perfiles consultados</dt>
                <dd className="metric">{formatNumber(ranking.total)}</dd>
              </div>
            </dl>
            <Link href="/app/rankings" className="ql-dashboard-action ql-btn-secondary">
              Ver ranking completo
            </Link>
          </article>
        )}
      </section>
    </main>
  );
}
