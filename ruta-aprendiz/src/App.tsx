import { useState } from 'react';
import { Nav } from './components/Nav';
import { CourseHome } from './components/CourseHome';
import { Lesson } from './components/Lesson';
import { Library } from './components/Library';
import { Profile } from './components/Profile';
import { Tournament } from './components/Tournament';
import { Stub } from './components/Stub';
import { useProgress, progress } from './lib/progress';

type Route = 'home' | 'course' | 'competencias' | 'marketplace' | 'library' | 'profile' | 'tournament';

export function App() {
  const p = useProgress();
  const [route, setRoute] = useState<Route>('home');
  const [activeModule, setActiveModule] = useState<number | null>(null);

  const onNav = (r: string) => {
    setRoute(r as Route);
    setActiveModule(null);
  };
  const openModule = (id: number) => {
    setActiveModule(id);
    setRoute('course');
  };
  const complete = () => {
    if (activeModule != null) {
      progress.completeModule(activeModule);
      setActiveModule(null); // back to the course map to see progress
    }
  };

  return (
    <div className="app">
      <Nav route={route} onNav={onNav} progress={p} />
      <main className="content">
        {route === 'home' && <Home onNav={onNav} progress={p} />}
        {route === 'course' &&
          (activeModule == null ? (
            <CourseHome progress={p} onOpen={openModule} />
          ) : (
            <Lesson
              moduleId={activeModule}
              progress={p}
              onComplete={complete}
              onOpenLibrary={() => onNav('library')}
              onBack={() => setActiveModule(null)}
              onEnterTournament={() => {
                progress.enterTournament('debut-weekly');
                progress.completeModule(5);
                setRoute('tournament');
              }}
            />
          ))}
        {route === 'competencias' && <Stub title="Competencias" icon="🏁" body="Torneos de la comunidad con estrategias pro." />}
        {route === 'marketplace' && <Stub title="Marketplace" icon="🛒" body="Estrategias compartidas por la comunidad." />}
        {route === 'library' && <Library favoriteId={p.favoriteDatasetId} />}
        {route === 'profile' && <Profile progress={p} onNav={onNav} />}
        {route === 'tournament' && <Tournament savedStrategy={p.savedStrategy} />}
      </main>
    </div>
  );
}

function Home({ onNav, progress: pr }: { onNav: (r: string) => void; progress: ReturnType<typeof useProgress> }) {
  const done = pr.completedModules.length;
  return (
    <div className="home">
      <section className="hero">
        <h1>QuantLab</h1>
        <p className="hero-sub">Comunidad de trading cuantitativo, ML y ciencia de datos.</p>
        {done === 0 ? (
          <button className="btn-primary lg" onClick={() => onNav('course')}>Comienza la Ruta Aprendiz →</button>
        ) : (
          <button className="btn-primary lg" onClick={() => onNav('course')}>Retoma tu Ruta Aprendiz ({done}/5)</button>
        )}
      </section>
      <section className="home-cards">
        <HomeCard icon="📚" title="Aprende" body="Curso gamificado de 5 módulos, de cero a tu primer torneo." onClick={() => onNav('course')} />
        <HomeCard icon="🏁" title="Competencias" body="Torneos donde compites con estrategias reales." onClick={() => onNav('competencias')} />
        <HomeCard icon="🛒" title="Marketplace" body="Estrategias compartidas por la comunidad." onClick={() => onNav('marketplace')} />
      </section>
    </div>
  );
}

function HomeCard({ icon, title, body, onClick }: { icon: string; title: string; body: string; onClick: () => void }) {
  return (
    <button className="home-card" onClick={onClick}>
      <span className="home-card-icon">{icon}</span>
      <h3>{title}</h3>
      <p>{body}</p>
    </button>
  );
}
