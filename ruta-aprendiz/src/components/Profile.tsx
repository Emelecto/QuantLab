import type { ProgressState } from '../types';
import { getDataset } from '../data/datasets';
import { modules } from '../data/modules';

interface ProfileProps {
  progress: ProgressState;
  onNav: (r: string) => void;
}

export function Profile({ progress, onNav }: ProfileProps) {
  const fav = progress.favoriteDatasetId ? getDataset(progress.favoriteDatasetId) : undefined;
  const courseDone = progress.completedModules.length;
  return (
    <div className="profile">
      <header className="profile-head">
        <div className="avatar">{progress.badgeEarned ? '🏅' : '👤'}</div>
        <div>
          <h1>Aprendiz Cuant</h1>
          <p className="profile-sub">@{progress.badgeEarned ? 'aprendiz' : 'nuevo'}</p>
        </div>
      </header>

      <div className="profile-stats">
        <Stat label="XP" value={String(progress.xp)} />
        <Stat label="Racha" value={`${progress.streakDays} 🔥`} />
        <Stat label="Módulos" value={`${courseDone}/5`} />
        <Stat label="Torneos" value={String(progress.tournamentsEntered.length)} />
      </div>

      <section className="profile-badge">
        <h2>Insignia</h2>
        <div className={`badge-card ${progress.badgeEarned ? 'earned' : ''}`}>
          <span className="badge-icon">🎓</span>
          <div>
            <h3>Aprendiz Cuant</h3>
            <p>{progress.badgeEarned ? '¡Desbloqueada! Completaste la Ruta Aprendiz.' : `Faltan ${5 - courseDone} módulos para desbloquearla.`}</p>
          </div>
        </div>
      </section>

      <section className="profile-fav">
        <h2>Dataset favorito</h2>
        {fav ? (
          <div className="fav-line">
            <span className="fav-star">★</span> {fav.name}
            <button className="btn-ghost" onClick={() => onNav('library')}>Ver en Biblioteca →</button>
          </div>
        ) : (
          <p>Aún no has fijado ningún dataset. Hazlo en el Módulo 2.</p>
        )}
      </section>

      <section className="profile-course">
        <h2>Progreso del curso</h2>
        <ul className="course-list">
          {modules.map((m) => (
            <li key={m.def.id} className={progress.completedModules.includes(m.def.id) ? 'done' : ''}>
              <span>{progress.completedModules.includes(m.def.id) ? '✓' : '○'}</span>
              Módulo {m.def.id}: {m.def.title}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}
