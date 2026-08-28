import { useState } from 'react';
import type { DatasetRow } from '../types';
import { getDataset } from '../data/datasets';

const COLS: (keyof DatasetRow)[] = ['date', 'open', 'high', 'low', 'close', 'volume'];

// "Read the raw data": show the OHLCV table; user identifies a column or flags an outlier.
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
              {COLS.map((c) => (
                <th key={c}>
                  <button
                    className={`col-head ${picked === c ? 'picked' : ''}`}
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
              <tr key={r.date} className={flagged === i ? 'flagged' : ''}>
                {COLS.map((c) => (
                  <td key={c} onClick={() => outlierRow != null && setFlagged(i)}>
                    {c === 'volume' ? r[c].toLocaleString() : r[c]}
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
        <div className={`read-result ${correct ? 'ok' : 'bad'}`}>
          {correct ? '✓ Correcto.' : '✗ Revisa.'} {hint}
        </div>
      )}
      <p className="seam-note">⭐ Este dataset quedó como favorito en tu Biblioteca.</p>
    </div>
  );
}
