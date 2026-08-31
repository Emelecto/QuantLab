"use client";

import { useState } from "react";
import { getDataset } from "@/lib/learn/datasets";

// Beginner prediction: look at the recent closes, declare direction, then reveal the real next close.
export function PredictExercise({ seriesId, prompt, revealNote }: {
  seriesId: string;
  prompt: string;
  revealNote: string;
}) {
  const d = getDataset(seriesId);
  const closes = (d?.rows ?? []).map((r) => r.close);
  const [guess, setGuess] = useState<1 | -1 | null>(null);
  const [revealed, setRevealed] = useState(false);

  if (closes.length < 2) return <div className="err">Serie corta.</div>;

  // The "next" close is simulated as a small deterministic move from the last value.
  const last = closes[closes.length - 1];
  const prev = closes[closes.length - 2];
  const actualDir: 1 | -1 = last >= prev ? 1 : -1;
  // For reveal we show a plausible next value (last * 1.0X) so it reads like real data.
  const nextVal = +(last * (1 + (actualDir === 1 ? 0.012 : -0.011))).toFixed(2);

  const hit = guess !== null && guess === actualDir;

  return (
    <div className="predict-ex">
      <p className="read-prompt">{prompt}</p>
      <div className="spark">
        {closes.map((c, i) => {
          const h = 20 + (c / Math.max(...closes)) * 60;
          return <span key={i} className="bar" style={{ height: `${h}px` }} title={`${c}`} />;
        })}
      </div>
      <p className="predict-last">Último cierre: <b>{last}</b></p>
      <div className="predict-actions">
        <button className={`btn-secondary ${guess === 1 ? "sel" : ""}`} onClick={() => setGuess(1)}>↑ Sube</button>
        <button className={`btn-secondary ${guess === -1 ? "sel" : ""}`} onClick={() => setGuess(-1)}>↓ Baje</button>
        <button className="btn-ghost" onClick={() => setRevealed(true)} disabled={guess === null}>Revelar</button>
      </div>
      {revealed && (
        <div className={`read-result ${hit ? "ok" : "bad"}`}>
          {hit ? "✓ Acertaste la dirección." : "✗ Esta vez no, pero entrenaste el ojo."} Próximo cierre (simulado): <b>{nextVal}</b>. {revealNote}
        </div>
      )}
    </div>
  );
}
