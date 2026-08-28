import { modules } from '../data/modules';
import type { ProgressState } from '../types';

interface CourseHomeProps {
  progress: ProgressState;
  onOpen: (moduleId: number) => void;
}

export function CourseHome({ progress, onOpen }: CourseHomeProps) {
  const done = progress.completedModules.length;
  const total = modules.length;
  const allDone = done >= total;
  const nextModule = modules.find((m) => !progress.completedModules.includes(m.def.id)) ?? modules[modules.length - 1];

  return (
    <div className="course-home">
      <header className="course-hero">
        <h1>Ruta Aprendiz</h1>
        <p>De cero a tu primer torneo, sin escribir código.</p>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${(done / total) * 100}%` }} />
          <span className="progress-text">{done}/{total} módulos</span>
        </div>
        {allDone && <div className="course-done">🏅 ¡Ruta completa! Eres Aprendiz Cuant.</div>}
      </header>

      <div className="module-grid">
        {modules.map((m, idx) => {
          const isDone = progress.completedModules.includes(m.def.id);
          const isLocked = idx > 0 && !progress.completedModules.includes(modules[idx - 1].def.id);
          const isStar = m.def.kind === 'tournament';
          return (
            <button
              key={m.def.id}
              className={`module-card ${isDone ? 'done' : ''} ${isLocked ? 'locked' : ''} ${isStar ? 'star' : ''}`}
              disabled={isLocked}
              onClick={() => onOpen(m.def.id)}
            >
              <div className="module-num">{isStar ? '🏆' : m.def.id}</div>
              <div className="module-body">
                <h3>{m.def.title}</h3>
                <p>{m.def.subtitle}</p>
                <span className="module-xp">+{m.def.xp} XP</span>
              </div>
              {isDone && <span className="module-check">✓</span>}
              {isLocked && <span className="module-lock">🔒</span>}
            </button>
          );
        })}
      </div>

      <div className="resume-bar">
        {allDone ? (
          <button className="btn-primary" onClick={() => onOpen(5)}>
            Ver mi debut en el torneo
          </button>
        ) : (
          <button className="btn-primary" onClick={() => onOpen(nextModule.def.id)}>
            {done === 0 ? 'Empieza el Módulo 1' : `Retoma: Módulo ${nextModule.def.id}`}
          </button>
        )}
        <span className="streak">🔥 Racha: {progress.streakDays} {progress.streakDays === 1 ? 'día' : 'días'}</span>
      </div>
    </div>
  );
}
