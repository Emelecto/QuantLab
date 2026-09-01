"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { datasets } from "@/lib/learn/datasets";
import type { AssetClass, Level } from "@/lib/learn/types";

const ASSET_LABEL: Record<AssetClass, string> = { crypto: "Cripto", equities: "Acciones", macro: "Macro" };

export function Library() {
  const [asset, setAsset] = useState<"all" | AssetClass>("all");
  const [level, setLevel] = useState<"all" | Level>("all");

  const filtered = useMemo(
    () => datasets.filter((d) => (asset === "all" || d.assetClass === asset) && (level === "all" || d.level === level)),
    [asset, level],
  );

  return (
    <div className="library">
      <header className="library-head">
        <div>
          <h1>Biblioteca de Datasets</h1>
          <p>Filtra por activo y nivel. Los que usa el curso estan marcados.</p>
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
          <div key={d.id} className="lib-card">
            <div className="lib-card-top">
              <h3>{d.name}</h3>
            </div>
            <div className="lib-tags">
              <span className={`tag tag-${d.assetClass}`}>{ASSET_LABEL[d.assetClass]}</span>
              <span className={`tag tag-${d.level}`}>{d.level === "beginner" ? "Principiante" : "Avanzado"}</span>
              {d.usedInCourse && <span className="tag tag-course">Curso</span>}
            </div>
            <p className="lib-blurb">{d.blurb}</p>
            <div className="lib-meta">{d.dateRange} · {d.frequency}</div>
            <div className="lib-card-actions">
              <Link href={`/app/library/${d.id}`} className="ql-btn-primary h-9 rounded-md px-3 text-[13px] active:scale-[0.96]">
                Ver dataset
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}