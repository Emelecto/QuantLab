import { useMemo, useState } from 'react';
import type { ProgressState } from '../types';
import { getModule } from '../data/modules';
import { getDataset } from '../data/datasets';
import { getTemplate } from '../data/strategies';
import { defaultParams, runStrategy } from '../lib/runner';
import { genPriceSeries } from '../lib/random';
import { progress as progressStore } from '../lib/progress';
import { RiskSim } from './RiskSim';
import { StrategyLab } from './StrategyLab';
import { DatasetReader } from './DatasetReader';
import { PredictExercise } from './PredictExercise';
import { Quiz } from './Quiz';

interface LessonProps {
  moduleId: number;
  progress: ProgressState;
  onComplete: () => void;
  onOpenLibrary: () => void;
  onBack: () => void;
  onEnterTournament: () => void;
}

// Per-module series, deterministic.
const MOD_SERIES: Record<number, number[]> = {
  1: genPriceSeries(11, 300),
  2: genPriceSeries(22, 300),
  3: genPriceSeries(33, 300),
  4: genPriceSeries(44, 300),
  5: genPriceSeries(55, 300),
};

export function Lesson({ moduleId, progress, onComplete, onOpenLibrary, onBack, onEnterTournament }: LessonProps) {
  const mod = getModule(moduleId);
  if (!mod) return <div className="err">Módulo no encontrado.</div>;
  const [savedParams, setSavedParams] = useState<Record<string, number> | null>(
    progress.savedStrategy?.params ?? defaultParams(mod.exercise.templateId ?? 'ma_cross'),
  );
  const [datasetUsed, setDatasetUsed] = useState(false);

  // M4 backtest compare band from a couple of alternate param sets (shows overfit spread).
  const compare4 = useMemo(
    () => [
      { label: 'alt A', series: MOD_SERIES[4], params: { fast: 5, slow: 25 } },
      { label: 'alt B', series: MOD_SERIES[4], params: { fast: 15, slow: 75 } },
    ],
    [],
  );

  const isDone = progress.completedModules.includes(moduleId);

  return (
    <div className="lesson">
      <button className="link-back" onClick={onBack}>← Ruta Aprendiz</button>
      <header className="lesson-head">
        <span className="lesson-kicker">Parte: {mod.def.part} · Módulo {mod.def.id}{mod.def.kind === 'tournament' ? ' · 🏆 Debut' : ''}</span>
        <h1>{mod.def.title}</h1>
        <p className="lesson-sub">{mod.def.subtitle}</p>
      </header>

      <p className="lesson-intro">{mod.intro}</p>

      {mod.sections.map((s, i) => (
        <section className="lesson-section" key={i}>
          <h3>{s.heading}</h3>
          <p>{s.body}</p>
        </section>
      ))}

      {/* ---- Interactive exercise by kind ---- */}
      <div className="exercise">
        <h2 className="exercise-title">🧪 Ejercicio interactivo</h2>

        {mod.exercise.kind === 'risk' && <RiskSim />}

        {mod.exercise.kind === 'dataset' && (
          <DatasetExercise def={mod.exercise.datasetId!} onOpenLibrary={onOpenLibrary} onUsed={() => setDatasetUsed(true)} used={datasetUsed} />
        )}

        {mod.exercise.kind === 'read' && (
          <DatasetReader
            datasetId={mod.exercise.datasetId!}
            prompt={mod.exercise.readTask!.prompt}
            answerCol={mod.exercise.readTask!.answerCol}
            outlierRow={mod.exercise.readTask!.outlierRow}
            hint={mod.exercise.readTask!.hint}
          />
        )}

        {mod.exercise.kind === 'predict' && (
          <PredictExercise
            seriesId={mod.exercise.predictTask!.seriesId}
            prompt={mod.exercise.predictTask!.prompt}
            revealNote={mod.exercise.predictTask!.revealNote}
          />
        )}

        {mod.exercise.kind === 'quiz' && <Quiz questions={mod.exercise.quiz!} />}

        {mod.exercise.kind === 'strategy' && (
          <StrategyLab
            templateId={mod.exercise.templateId!}
            series={MOD_SERIES[moduleId] ?? MOD_SERIES[4]}
            onParamsChange={(p) => setSavedParams(p)}
          />
        )}

        {mod.exercise.kind === 'backtest' && mod.def.kind !== 'tournament' && (
          <StrategyLab
            templateId={mod.exercise.templateId!}
            series={MOD_SERIES[moduleId] ?? MOD_SERIES[4]}
            initialParams={progress.savedStrategy?.params ?? defaultParams(mod.exercise.templateId!)}
            onParamsChange={(p) => setSavedParams(p)}
            compare={compare4}
          />
        )}

        {mod.def.kind === 'tournament' && (
          <TournamentHandoff savedParams={savedParams ?? progress.savedStrategy?.params ?? defaultParams('ma_cross')} series={MOD_SERIES[moduleId] ?? MOD_SERIES[5]} onEnter={onEnterTournament} />
        )}
      </div>

      <div className="lesson-takeaway">💡 {mod.takeaway}</div>

      <div className="lesson-actions">
        {isDone ? (
          <span className="done-pill">✓ Completado · +{mod.def.xp} XP</span>
        ) : (
          <button
            className="btn-primary"
            onClick={() => {
              // Seam 3: persist the strategy for the tournament handoff whenever this
              // module carries a template (M4 / M6 build it; M12 consumes it).
              if (mod.exercise.templateId && savedParams) {
                progressStore.saveStrategy({ templateId: mod.exercise.templateId, params: savedParams });
              }
              onComplete();
            }}
          >
            Completar módulo (+{mod.def.xp} XP)
          </button>
        )}
      </div>
    </div>
  );
}

function DatasetExercise({ def, onOpenLibrary, onUsed, used }: { def: string; onOpenLibrary: () => void; onUsed: () => void; used: boolean }) {
  const d = getDataset(def);
  const [fav, setFav] = useState(used);
  if (!d) return <div className="err">Dataset no encontrado.</div>;
  return (
    <div className="dataset-ex">
      <div className="dataset-card">
        <h3>{d.name}</h3>
        <p>{d.blurb}</p>
        <ul className="dataset-meta">
          <li>Activo: <b>{d.assetClass}</b></li>
          <li>Rango: {d.dateRange}</li>
          <li>Frecuencia: {d.frequency}</li>
          <li>Nivel: {d.level}</li>
        </ul>
        <div className="dataset-actions">
          <button className="btn-secondary" onClick={() => { setFav(true); progressStore.setFavoriteDataset(d.id); onUsed(); }}>
            {fav ? '★ Fijado como favorito' : '☆ Fijar como favorito'}
          </button>
          <button className="btn-ghost" onClick={onOpenLibrary}>Ir a la Biblioteca →</button>
        </div>
        {fav && <p className="seam-note">⭐ Costura: este dataset quedó como favorito en tu Biblioteca.</p>}
      </div>
    </div>
  );
}

// M5 handoff: shows the saved strategy preloaded (Seam 3 — zero copy-paste).
function TournamentHandoff({ savedParams, series, onEnter }: { savedParams: Record<string, number>; series: number[]; onEnter: () => void }) {
  const tpl = getTemplate('ma_cross')!;
  const [params, setParams] = useState<Record<string, number>>(savedParams);
  const result = useMemo(() => runStrategy({ templateId: 'ma_cross', params }, series), [params, series]);

  return (
    <div className="handoff">
      <div className="handoff-banner">
        🤝 <b>Handoff sin clic:</b> tu estrategia de los módulos anteriores está precargada. Confirma y entra al torneo.
      </div>
      <StrategyLab
        templateId="ma_cross"
        series={series}
        initialParams={params}
        onParamsChange={setParams}
      />
      <p className="handoff-note">
        Plantilla: <b>{tpl.name}</b> · Parámetros:{' '}
        {tpl.params.map((p) => `${p.label.split(' ')[0]}=${params[p.key]}`).join(', ')}
      </p>
      <p className="handoff-metrics">Retorno total: <b>{(result.totalReturn * 100).toFixed(1)}%</b> · Sharpe: <b>{result.sharpe.toFixed(2)}</b></p>
      <button className="btn-primary" onClick={onEnter}>🏆 Entrar al torneo</button>
    </div>
  );
}
