import { useMemo, useState } from 'react';
import { datasets } from '../data/datasets';
import type { AssetClass, Level } from '../types';
import { progress } from '../lib/progress';
import { StrategyLab } from './StrategyLab';
import { genPriceSeries } from '../lib/random';

interface LibraryProps {
  favoriteId: string | null;
}

const ASSET_LABEL: Record<AssetClass, string> = { crypto: 'Cripto', equities: 'Acciones', macro: 'Macro' };

export function Library({ favoriteId }: LibraryProps) {
  const [asset, setAsset] = useState<'all' | AssetClass>('all');
  const [level, setLevel] = useState<'all' | Level>('all');
  const [previewId, setPreviewId] = useState<string | null>(null);

  const filtered = useMemo(
    () => datasets.filter((d) => (asset === 'all' || d.assetClass === asset) && (level === 'all' || d.level === level)),
    [asset, level],
  );

  const preview = previewId ? datasets.find((d) => d.id === previewId) : undefined;
  const series = useMemo(() => (previewId ? genPriceSeries(hashId(previewId), 200) : []), [previewId]);

  return (
    <div className="library">
      <header className="library-head">
        <h1>Biblioteca de Datasets</h1>
        <p>Filtra por activo y nivel. Los que usa el curso están marcados.</p>
      </header>

      <div className="filters">
        <div className="filter-group">
          <span>Activo:</span>
          {(['all', 'crypto', 'equities', 'macro'] as const).map((a) => (
            <button key={a} className={asset === a ? 'active' : ''} onClick={() => setAsset(a)}>
              {a === 'all' ? 'Todos' : ASSET_LABEL[a]}
            </button>
          ))}
        </div>
        <div className="filter-group">
          <span>Nivel:</span>
          {(['all', 'beginner', 'advanced'] as const).map((l) => (
            <button key={l} className={level === l ? 'active' : ''} onClick={() => setLevel(l)}>
              {l === 'all' ? 'Todos' : l === 'beginner' ? 'Principiante' : 'Avanzado'}
            </button>
          ))}
        </div>
      </div>

      <div className="dataset-grid">
        {filtered.map((d) => (
          <div key={d.id} className={`lib-card ${favoriteId === d.id ? 'fav' : ''}`}>
            <div className="lib-card-top">
              <h3>{d.name}</h3>
              {favoriteId === d.id && <span className="fav-star">★</span>}
            </div>
            <div className="lib-tags">
              <span className={`tag tag-${d.assetClass}`}>{ASSET_LABEL[d.assetClass]}</span>
              <span className={`tag tag-${d.level}`}>{d.level === 'beginner' ? 'Principiante' : 'Avanzado'}</span>
              {d.usedInCourse && <span className="tag tag-course">Curso</span>}
            </div>
            <p className="lib-blurb">{d.blurb}</p>
            <div className="lib-meta">{d.dateRange} · {d.frequency}</div>
            <div className="lib-card-actions">
              <button className="btn-secondary" onClick={() => setPreviewId(d.id)}>Vista previa</button>
              <button
                className="btn-ghost"
                onClick={() => progress.setFavoriteDataset(d.id)}
              >
                {favoriteId === d.id ? 'Fijado' : 'Fijar'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {preview && (
        <div className="preview-panel">
          <h2>Vista previa · {preview.name}</h2>
          <StrategyLab templateId="ma_cross" series={series} compact />
        </div>
      )}
    </div>
  );
}

function hashId(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % 100000;
}
