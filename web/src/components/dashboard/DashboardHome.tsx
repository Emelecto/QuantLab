"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/useAuth";
import { useProgress } from "@/lib/learn/progress";
import { getLeaderboard } from "@/lib/db";
import type { LeaderboardRow } from "@/lib/db";
import { useDashboardData } from "./useDashboardData";
import "./dashboard.css";

export function DashboardHome() {
  const { user } = useAuth();
  const progress = useProgress();
  const { qp, strategies, tournaments, loading } = useDashboardData();
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);

  useEffect(() => {
    getLeaderboard()
      .then(setLeaderboard)
      .catch(() => setLeaderboard([]));
  }, []);

  const name =
    user?.user_metadata?.full_name ??
    user?.email?.split("@")[0] ??
    "Usuario";

  const completedModules = progress.completedModules.length;
  const totalModules = 14;
  const coursePct = Math.round((completedModules / totalModules) * 100);
  const courseComplete = completedModules >= totalModules;

  const myRank = leaderboard.findIndex(
    (r) => r.author === user?.user_metadata?.username,
  ) + 1;

  return (
    <div className="ql-dash-content">
      {/* Bienvenida */}
      <div className="ql-dash-topbar" style={{ padding: 0, borderBottom: "none" }}>
        <div>
          <h1>Hola, {name}</h1>
          <div className="sub">Tu dashboard de QuantLab</div>
        </div>
      </div>

      {/* Resumen de cuenta */}
      <div className="ql-dash-grid">
        <div className="ql-panel ql-glass ql-elev-1">
          <div className="ph">
            <span>QP disponibles</span>
          </div>
          <div className="big metric">
            {loading ? "—" : qp != null ? qp.toLocaleString() : "—"}
          </div>
          <div className="hint">QuantPoints en tu wallet</div>
        </div>

        <div className="ql-panel ql-glass ql-elev-1">
          <div className="ph">
            <span>Racha activa</span>
          </div>
          <div className="big metric">{progress.streakDays}</div>
          <div className="hint">
            {progress.streakDays === 1 ? "día" : "días"} consecutivos
          </div>
        </div>

        <div className="ql-panel ql-glass ql-elev-1">
          <div className="ph">
            <span>Progreso del curso</span>
          </div>
          <div className="big metric">{coursePct}%</div>
          <div className="hint">
            {completedModules}/{totalModules} módulos
          </div>
          <div className="ql-bar">
            <i style={{ width: `${coursePct}%` }} />
          </div>
        </div>

        <div className="ql-panel ql-glass ql-elev-1">
          <div className="ph">
            <span>Mis estrategias</span>
          </div>
          <div className="big metric">{strategies.length}</div>
          <div className="hint">
            {strategies.length === 0 ? "Crea tu primera" : "estrategias creadas"}
          </div>
        </div>
      </div>

      {/* Continuar aprendiendo (se oculta si curso completo) */}
      {!courseComplete && (
        <>
          <div className="ql-section-label">Continuar aprendiendo</div>
          <div className="ql-panel ql-glass ql-elev-1">
            <div className="ph">
              <span>Próximo módulo</span>
            </div>
            <div className="big">
              Módulo {Math.min(completedModules + 1, totalModules)}
            </div>
            <div className="hint">
              {completedModules === 0
                ? "Comienza con Bienvenido al trading cuant"
                : `Continúa con el módulo ${completedModules + 1}`}
            </div>
            <Link href="/app/learn" className="btn-primary" style={{ alignSelf: "flex-start" }}>
              Ir al curso
            </Link>
          </div>
        </>
      )}

      {/* Torneos activos */}
      <div className="ql-section-label">Torneos activos</div>
      {tournaments.length === 0 ? (
        <div className="ql-panel ql-glass ql-elev-1">
          <div className="hint">No hay torneos activos en este momento.</div>
        </div>
      ) : (
        <div className="ql-dash-grid">
          {tournaments.slice(0, 3).map((t) => (
            <div key={t.id} className="ql-panel ql-glass ql-elev-1">
              <div className="ph">
                <span>{t.name}</span>
              </div>
              <div className="big metric">{t.qp_prize} QP</div>
              <div className="hint">
                {t.participants} participantes · {t.metric_label}
              </div>
              <Link
                href={`/app/tournaments/${t.id}`}
                className="btn-secondary"
                style={{ alignSelf: "flex-start" }}
              >
                Ver torneo
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Mis estrategias */}
      <div className="ql-section-label">Mis estrategias</div>
      {strategies.length === 0 ? (
        <div className="ql-panel ql-glass ql-elev-1">
          <div className="hint">Aún no has creado estrategias.</div>
          <Link
            href="/app/strategies/new"
            className="btn-primary"
            style={{ alignSelf: "flex-start" }}
          >
            Crear estrategia
          </Link>
        </div>
      ) : (
        <div className="ql-dash-grid">
          {strategies.slice(0, 3).map((s) => (
            <div key={s.id} className="ql-panel ql-glass ql-elev-1">
              <div className="ph">
                <span>{s.symbol}</span>
              </div>
              <div className="big">{s.title}</div>
              <div className="hint">
                {s.asset_type} · {s.timeframe}
              </div>
              <Link
                href={`/app/strategies/${s.id}`}
                className="btn-secondary"
                style={{ alignSelf: "flex-start" }}
              >
                Ver estrategia
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Ranking */}
      <div className="ql-section-label">Tu posición en ranking</div>
      <div className="ql-panel ql-glass ql-elev-1">
        <div className="ph">
          <span>Ranking global</span>
        </div>
        <div className="big metric">
          {myRank > 0 ? `#${myRank}` : "—"}
        </div>
        <div className="hint">
          {myRank > 0
            ? `Top ${myRank} de ${leaderboard.length}`
            : "Sin datos de ranking aún"}
        </div>
        <Link
          href="/app/rankings"
          className="btn-secondary"
          style={{ alignSelf: "flex-start" }}
        >
          Ver ranking completo
        </Link>
      </div>
    </div>
  );
}
