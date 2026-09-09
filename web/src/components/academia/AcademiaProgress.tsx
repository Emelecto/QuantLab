"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadAcademiaProgress } from "./progress-store";

// Nodo del journey del hub (datos estáticos desde el servidor; el estado
// hecha/en curso/pendiente se resuelve en cliente desde progress-store).
export interface AcademiaJourneyLesson {
  id: string;
  n: number;
  titulo: string;
  minutos: number;
  qp: number;
  href: string;
}

// Barra de progreso de Academia (lee el store local; multi-curso).
// Si recibe `journey`, además renderiza el journey con estado real.
export function AcademiaProgress({
  totalLessons = 7,
  journey,
}: {
  totalLessons?: number;
  journey?: AcademiaJourneyLesson[];
}) {
  const [done, setDone] = useState(0);
  const [perfect, setPerfect] = useState(0);
  const [completedIds, setCompletedIds] = useState<string[]>([]);

  useEffect(() => {
    const saved = loadAcademiaProgress();
    setDone(saved.completed.length);
    setPerfect(saved.perfect.length);
    setCompletedIds(saved.completed);
  }, []);

  const pct = totalLessons > 0 ? Math.round((done / totalLessons) * 100) : 0;
  const currentId = journey?.find((l) => !completedIds.includes(l.id))?.id;

  return (
    <div className="academia-progress">
      <style>{`
        .academia-progress { color: #f7f8f8; }
        .academia-progress-top { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin-bottom: 8px; }
        .academia-progress-label { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #8a8f98; }
        .academia-progress-text { font-size: 13px; color: #8a8f98; font-variant-numeric: tabular-nums; }
        .academia-progress-track { height: 8px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08); border-radius: 999px; overflow: hidden; }
        .academia-progress-fill { height: 100%; background: #46c08a; border-radius: 999px; transition: width 0.4s ease; }
        .academia-journey { list-style: none; margin: 20px 0 0; padding: 0; display: flex; flex-direction: column; }
        .academia-journey-node { display: grid; grid-template-columns: 30px 1fr; gap: 12px; position: relative; padding-bottom: 12px; }
        .academia-journey-node:last-child { padding-bottom: 0; }
        .academia-journey-node::before { content: ""; position: absolute; left: 14px; top: 32px; bottom: 0; width: 1px; background: rgba(255,255,255,0.08); }
        .academia-journey-node:last-child::before { display: none; }
        .academia-journey-dot { width: 30px; height: 30px; border-radius: 50%; display: grid; place-items: center; font-size: 13px; font-weight: 700; border: 1px solid rgba(255,255,255,0.08); background: #0c0d0f; color: #8a8f98; z-index: 1; font-variant-numeric: tabular-nums; }
        .academia-journey-node[data-state="hecha"] .academia-journey-dot { background: rgba(70,192,138,0.14); border-color: rgba(70,192,138,0.5); color: #46c08a; }
        .academia-journey-node[data-state="encurso"] .academia-journey-dot { border-color: #f7f8f8; color: #f7f8f8; box-shadow: 0 0 0 3px rgba(255,255,255,0.06); }
        .academia-journey-card { display: flex; align-items: center; gap: 12px; background: #0c0d0f; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 12px 14px; text-decoration: none; color: #f7f8f8; transition: border-color 0.15s ease, transform 0.15s ease; }
        a.academia-journey-card:hover { border-color: rgba(255,255,255,0.22); transform: translateY(-1px); }
        .academia-journey-node[data-state="encurso"] .academia-journey-card { border-color: rgba(255,255,255,0.22); }
        .academia-journey-node[data-state="hecha"] .academia-journey-card { opacity: 0.85; }
        .academia-journey-body { flex: 1; min-width: 0; }
        .academia-journey-kicker { display: block; font-size: 11px; color: #8a8f98; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 2px; }
        .academia-journey-title { margin: 0; font-size: 14px; font-weight: 600; line-height: 1.4; }
        .academia-journey-pill { flex: 0 0 auto; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; padding: 4px 10px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.08); color: #8a8f98; }
        .academia-journey-node[data-state="hecha"] .academia-journey-pill { color: #46c08a; border-color: rgba(70,192,138,0.4); background: rgba(70,192,138,0.1); }
        .academia-journey-node[data-state="encurso"] .academia-journey-pill { color: #f7f8f8; border-color: rgba(255,255,255,0.25); background: rgba(255,255,255,0.06); }
      `}</style>
      <div className="academia-progress-top">
        <span className="academia-progress-label">Tu progreso</span>
        <span className="academia-progress-text">
          {done}/{totalLessons} lecciones · {perfect} QP ganados
        </span>
      </div>
      <div
        className="academia-progress-track"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progreso en Academia"
      >
        <div className="academia-progress-fill" style={{ width: `${pct}%` }} />
      </div>
      {journey && (
        <ol className="academia-journey">
          {journey.map((l) => {
            const isDone = completedIds.includes(l.id);
            const isCurrent = !isDone && l.id === currentId;
            const state = isDone ? "hecha" : isCurrent ? "encurso" : "pendiente";
            const pill = isDone ? "Completada" : isCurrent ? "En curso" : "Pendiente";
            return (
              <li key={l.id} className="academia-journey-node" data-state={state}>
                <span className="academia-journey-dot" aria-hidden="true">
                  {isDone ? "✓" : l.n}
                </span>
                <Link className="academia-journey-card" href={l.href}>
                  <span className="academia-journey-body">
                    <span className="academia-journey-kicker">
                      Lección {l.n} · ~{l.minutos} min · +{l.qp} QP
                    </span>
                    <p className="academia-journey-title">{l.titulo}</p>
                  </span>
                  <span className="academia-journey-pill">{pill}</span>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
