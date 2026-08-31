"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { DatasetRow, StrategyParams } from "@/lib/learn/types";
import { getModule } from "@/lib/learn/modules";
import { getDataset } from "@/lib/learn/datasets";
import { getTemplate } from "@/lib/learn/strategies";
import { defaultParams, runStrategy } from "@/lib/learn/runner";
import { genPriceSeries } from "@/lib/learn/random";
import { progress, useProgress } from "@/lib/learn/progress";
import { RiskSim } from "./RiskSim";
import { StrategyLab } from "./StrategyLab";
import { DatasetReader } from "./DatasetReader";
import { PredictExercise } from "./PredictExercise";
import { Quiz } from "./Quiz";
import { TournamentHandoff } from "./TournamentHandoff";

// Per-module series, deterministic (same seeds as the original SPA).
const MOD_SERIES: Record<number, number[]> = {
  1: genPriceSeries(11, 300),
  2: genPriceSeries(22, 300),
  3: genPriceSeries(33, 300),
  4: genPriceSeries(44, 300),
  5: genPriceSeries(55, 300),
};

export function Lesson({ moduleId }: { moduleId: number }) {
  const mod = getModule(moduleId);
  const p = useProgress();
  if (!mod) return <div className="err">Módulo no encontrado.</div>;
  const [savedParams, setSavedParams] = useState<StrategyParams | null>(
    p.savedStrategy?.params ?? defaultParams(mod.exercise.templateId ?? "ma_cross"),
  );
  const [datasetUsed, setDatasetUsed] = useState(false);

  // M4 backtest compare band from a couple of alternate param sets (shows overfit spread).
  const compare4 = useMemo(
    () => [
      { label: "alt A", series: MOD_SERIES[4], params: { fast: 5, slow: 25 } },
      { label: "alt B", series: MOD_SERIES[4], params: { fast: 15, slow: 75 } },
    ],
    [],
  );

  const isDone = p.completedModules.includes(moduleId);

  return (
    <div className="lesson">
      <Link href="/learn" className="link-back">← Ruta Aprendiz</Link>
      <header className="lesson-head">
        <span className="lesson-kicker">Parte: {mod.def.part} · Módulo {mod.def.id}{mod.def.kind === "tournament" ? " · 🏆 Debut" : ""}</span>
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

        {mod.exercise.kind === "risk" && <RiskSim />}

        {mod.exercise.kind === "dataset" && (
          <DatasetExercise def={mod.exercise.datasetId!} onUsed={() => setDatasetUsed(true)} used={datasetUsed} />
        )}

        {mod.exercise.kind === "read" && (
          <DatasetReader
            datasetId={mod.exercise.datasetId!}
            prompt={mod.exercise.readTask!.prompt}
            answerCol={mod.exercise.readTask!.answerCol as keyof DatasetRow}
            outlierRow={mod.exercise.readTask!.outlierRow}
            hint={mod.exercise.readTask!.hint}
          />
        )}

        {mod.exercise.kind === "predict" && (
          <PredictExercise
            seriesId={mod.exercise.predictTask!.seriesId}
            prompt={mod.exercise.predictTask!.prompt}
            revealNote={mod.exercise.predictTask!.revealNote}
          />
        )}

        {mod.exercise.kind === "quiz" && <Quiz questions={mod.exercise.quiz!} />}

        {mod.exercise.kind === "strategy" && (
          <StrategyLab
            templateId={mod.exercise.templateId!}
            series={MOD_SERIES[moduleId] ?? MOD_SERIES[4]}
            onParamsChange={(pr) => setSavedParams(pr)}
          />
        )}

        {mod.exercise.kind === "backtest" && mod.def.kind !== "tournament" && (
          <StrategyLab
            templateId={mod.exercise.templateId!}
            series={MOD_SERIES[moduleId] ?? MOD_SERIES[4]}
            initialParams={p.savedStrategy?.params ?? defaultParams(mod.exercise.templateId!)}
            onParamsChange={(pr) => setSavedParams(pr)}
            compare={compare4}
          />
        )}

        {mod.def.kind === "tournament" && (
          <TournamentHandoff
            savedParams={savedParams ?? p.savedStrategy?.params ?? defaultParams("ma_cross")}
            series={MOD_SERIES[moduleId] ?? MOD_SERIES[5]}
            onEnter={() => undefined}
          />
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
              // module carries a template (M4 / M12 build it; M14 consumes it).
              if (mod.exercise.templateId && savedParams) {
                progress.saveStrategy({ templateId: mod.exercise.templateId, params: savedParams });
              }
              progress.completeModule(moduleId);
            }}
          >
            Completar módulo (+{mod.def.xp} XP)
          </button>
        )}
      </div>
    </div>
  );
}

function DatasetExercise({ def, onUsed, used }: { def: string; onUsed: () => void; used: boolean }) {
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
          <button className="btn-secondary" onClick={() => { setFav(true); progress.setFavoriteDataset(d.id); onUsed(); }}>{
            fav ? "★ Fijado como favorito" : "☆ Fijar como favorito"
          }</button>
          <Link className="btn-ghost" href="/library">Ir a la Biblioteca →</Link>
        </div>
        {fav && <p className="seam-note">⭐ Costura: este dataset quedó como favorito en tu Biblioteca.</p>}
      </div>
    </div>
  );
}
