"use client";

import { useMemo, useState } from "react";
import { datasets } from "@/lib/learn/datasets";
import type { AssetClass, Level } from "@/lib/learn/types";
import { progress, useProgress } from "@/lib/learn/progress";

const ASSET_LABEL: Record<AssetClass, string> = { crypto: "Cripto", equities: "Acciones", macro: "Macro" };

export function Library() {
  const p = useProgress();
  const favoriteId = p.favoriteDatasetId;
  const [asset, setAsset] = useState<"all" | AssetClass>("all");
  const [level, setLevel] = useState<"all" | Level>("all");
  const [previewId, setPreviewId] = useState<string | null>(null);

  const filtered = useMemo(
    () => datasets.filter((d) => (asset === "all" || d.assetClass === asset) && (level === "all" || d.level === level)),
    [asset, level],
  );

  const preview = previewId ? datasets.find((d) => d.id === previewId) : undefined;

  return (
    <div className="library">
      <header className="library-head">
        <div>
          <h1>Biblioteca de Datasets</h1>
          <p>Filtra por activo y nivel. Los que usa el curso están marcados.</p>
        </div>
      </header>

      <div className="filters">
        <div className="filter-group">
          <span>Activo:</span>
          {(["all", "crypto", "equities", "macro"] as const).map((a) => (
            <button key={a} className={asset === a ? "active" : ""} onClick={() => setAsset(a)}>
              {a === "all" ? "Todos" : ASSET_LABEL[a]}
            </button>
          ))}
        </div>
        <div className="filter-group">
          <span>Nivel:</span>
          {(["all", "beginner", "advanced"] as const).map((l) => (
            <button key={l} className={level === l ? "active" : ""} onClick={() => setLevel(l)}>
              {l === "all" ? "Todos" : l === "beginner" ? "Principiante" : "Avanzado"}
            </button>
          ))}
        </div>
      </div>

      <div className="dataset-grid">
        {filtered.map((d) => (
          <div key={d.id} className={`lib-card ${favoriteId === d.id ? "fav" : ""}`}>
            <div className="lib-card-top">
              <h3>{d.name}</h3>
              {favoriteId === d.id && <span className="fav-star">★</span>}
            </div>
            <div className="lib-tags">
              <span className={`tag tag-${d.assetClass}`}>{ASSET_LABEL[d.assetClass]}</span>
              <span className={`tag tag-${d.level}`}>{d.level === "beginner" ? "Principiante" : "Avanzado"}</span>
              {d.usedInCourse && <span className="tag tag-course">Curso</span>}
            </div>
            <p className="lib-blurb">{d.blurb}</p>
            <div className="lib-meta">{d.dateRange} · {d.frequency}</div>
            <div className="lib-card-actions">
              <button className="btn-secondary" onClick={() => setPreviewId(d.id)}>Vista previa</button>
              <button
                className="btn-ghost"
                onClick={() => { if (favoriteId !== d.id) { /* toggle */ } progress.setFavoriteDataset(d.id); }}
              >
                {favoriteId === d.id ? "Fijado" : "Fijar"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {preview && (
        <div className="preview-panel">
          <h2>Vista previa · {preview.name}</h2>
          <p className="lib-blurb">{preview.blurb}</p>
          <div className="lib-meta" style={{ marginBottom: 12 }}>{preview.dateRange} · {preview.frequency} · {preview.assetClass}</div>
          <div className="table-wrap">
            <table className="ohclv">
              <thead>
                <tr>
                  <th>fecha</th>
                  <th>open</th>
                  <th>high</th>
                  <th>low</th>
                  <th>close</th>
                  <th>volume</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows?.slice(0, 12).map((r) => (
                  <tr key={r.date}>
                    <td>{r.date}</td>
                    <td>{r.open.toFixed(2)}</td>
                    <td>{r.high.toFixed(2)}</td>
                    <td>{r.low.toFixed(2)}</td>
                    <td>{r.close.toFixed(2)}</td>
                    <td>{r.volume.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="read-hint">Así se ven los datos en crudo. Este es el mismo formato que recibirás en un torneo real (columnas OHLCV).</p>
        </div>
      )}
    </div>
  );
}
