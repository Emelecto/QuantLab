"use client";

import { useState } from "react";
import type { DatasetRow } from "@/lib/learn/types";
import { getDataset } from "@/lib/learn/datasets";

const DIR_LABEL: Record<number, string> = { 1: "▲", "-1": "▼", 0: "–" };

function cellText(c: keyof DatasetRow, r: DatasetRow): string {
  const v = r[c];
  if (c === "volume") return (v as number).toLocaleString();
  if (c === "direction") return DIR_LABEL[(v as number) ?? 0] ?? String(v);
  return String(v);
}

// "Read the raw data": show the dataset table (all its columns, incl. the
// tournament's "direction" label); user identifies a column or flags an outlier.
export function DatasetReader({ datasetId, prompt, answerCol, outlierRow, hint }: {
  datasetId: string;
  prompt: string;
  answerCol?: keyof DatasetRow;
  outlierRow?: number;
  hint: string;
}) {
  const d = getDataset(datasetId);
  const [picked, setPicked] = useState<keyof DatasetRow | null>(null);
  const [flagged, setFlagged] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  if (!d) return <div className="err">Dataset no encontrado.</div>;

  const cols = Object.keys(d.rows[0]) as (keyof DatasetRow)[];
  const correct =
    (answerCol && picked === answerCol) &&
    (outlierRow == null || flagged === outlierRow);

  return (
    <div className="read-ex">
      <p className="read-prompt">{prompt}</p>
      <div className="table-wrap">
        <table className="ohclv">
          <thead>
            <tr>
              {cols.map((c) => (
                <th key={c}>
                  <button
                    className={`col-head ${picked === c ? "picked" : ""}`}
                    onClick={() => setPicked(c)}
                  >
                    {c}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {d.rows.map((r, i) => (
              <tr key={r.date} className={flagged === i ? "flagged" : ""}>
                {cols.map((c) => (
                  <td key={c} onClick={() => outlierRow != null && setFlagged(i)}>
                    {cellText(c, r)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="read-actions">
        <button className="btn-ghost" onClick={() => setRevealed(true)}>Revelar respuesta</button>
        {outlierRow != null && (
          <span className="read-hint">Toca una fila para marcarla como sospechosa.</span>
        )}
      </div>
      {revealed && (
        <div className={`read-result ${correct ? "ok" : "bad"}`}>
          {correct ? "✓ Correcto." : "✗ Revisa."} {hint}
        </div>
      )}
    </div>
  );
}
