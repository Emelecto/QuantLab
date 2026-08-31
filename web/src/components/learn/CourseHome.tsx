"use client";

import Link from "next/link";
import { modules, modulesByPart } from "@/lib/learn/modules";
import { useProgress } from "@/lib/learn/progress";

export function CourseHome() {
  const p = useProgress();
  const done = p.completedModules.length;
  const total = modules.length;
  const allDone = done >= total;
  const nextModule = modules.find((m) => !p.completedModules.includes(m.def.id)) ?? modules[modules.length - 1];

  return (
    <div className="course-home">
      <header className="course-hero">
        <h1>Introducción a QuantLab</h1>
        <p>De cero a tu primer torneo, sin escribir código.</p>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${Math.max((done / total) * 100, done > 0 ? 4 : 0)}%` }} />
        </div>
        <span className="progress-text">{done}/{total} módulos completados · {p.xp} XP</span>
        {allDone && <div className="course-done">🏅 ¡Ruta completa! Eres Aprendiz Cuant. +10 QP ganados.</div>}
      </header>

      {modulesByPart().map(({ part, mods }) => (
        <section className="part-block" key={part}>
          <h2 className="part-title">{part}</h2>
          <div className="module-grid">
            {mods.map((m, idx) => {
              const isDone = p.completedModules.includes(m.def.id);
              const prev = mods[idx - 1];
              const isLocked = prev ? !p.completedModules.includes(prev.def.id) : false;
              const isStar = m.def.kind === "tournament";
              return (
                <Link
                  key={m.def.id}
                  href={`/learn/${m.def.id}`}
                  className={`module-card ${isDone ? "done" : ""} ${isLocked ? "locked" : ""} ${isStar ? "star" : ""}`}
                >
                  <div className="module-num">{isStar ? "🏆" : m.def.id}</div>
                  <div className="module-body">
                    <span className="module-kicker">Módulo {m.def.id}</span>
                    <h3>{m.def.title}</h3>
                    <p>{m.def.subtitle}</p>
                    <span className="module-xp">+{m.def.xp} XP</span>
                  </div>
                  {isDone && <span className="module-check">✓</span>}
                  {isLocked && <span className="module-lock">🔒</span>}
                </Link>
              );
            })}
          </div>
        </section>
      ))}

      <div className="resume-bar">
        {allDone ? (
          <Link className="btn-primary" href="/learn/14">Ver mi debut en el torneo</Link>
        ) : (
          <Link className="btn-primary" href={`/learn/${nextModule.def.id}`}>
            {done === 0 ? "Empieza el Módulo 1" : `Retoma: Módulo ${nextModule.def.id}`}
          </Link>
        )}
        <span className="streak">🔥 Racha: {p.streakDays} {p.streakDays === 1 ? "día" : "días"}</span>
      </div>
    </div>
  );
}
