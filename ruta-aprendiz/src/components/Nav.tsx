import type { ProgressState } from '../types';

interface NavProps {
  route: string;
  onNav: (r: string) => void;
  progress: ProgressState;
}

export function Nav({ route, onNav, progress }: NavProps) {
  const courseDone = progress.completedModules.length;
  return (
    <nav className="nav">
      <div className="brand" onClick={() => onNav('home')}>
        <span className="brand-mark">Q</span>
        <span className="brand-name">QuantLab</span>
      </div>
      <div className="nav-links">
        <button className={route === 'course' ? 'active' : ''} onClick={() => onNav('course')}>
          Aprende
          {courseDone > 0 && <span className="nav-badge">{courseDone}/5</span>}
        </button>
        <button className={route === 'competencias' ? 'active' : ''} onClick={() => onNav('competencias')}>
          Competencias
        </button>
        <button className={route === 'marketplace' ? 'active' : ''} onClick={() => onNav('marketplace')}>
          Marketplace
        </button>
      </div>
      <div className="nav-right">
        <button className={route === 'library' ? 'active' : ''} onClick={() => onNav('library')} title="Biblioteca de datasets">
          📚
        </button>
        <button className={route === 'profile' ? 'active' : ''} onClick={() => onNav('profile')} title="Perfil">
          {progress.badgeEarned ? '🏅' : '👤'}
        </button>
      </div>
    </nav>
  );
}
