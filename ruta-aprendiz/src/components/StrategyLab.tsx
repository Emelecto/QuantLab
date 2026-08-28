import { useMemo, useState } from 'react';
import type { StrategyParams } from '../types';
import { defaultParams, runStrategy } from '../lib/runner';
import { getTemplate } from '../data/strategies';
import { Slider } from './Slider';
import { PriceChart } from './charts/PriceChart';
import { EquityChart } from './charts/EquityChart';
import { Metrics } from './Metrics';

interface StrategyLabProps {
  templateId: string;
  series: number[];
  initialParams?: StrategyParams;
  height?: number;
  onParamsChange?: (params: StrategyParams) => void;
  compact?: boolean;
  compare?: { label: string; series: number[]; params: StrategyParams }[];
}

// Reusable interactive strategy playground: sliders -> live chart + metrics.
// Used by M3 (first signal), M4 (backtest), M5 (tournament) and Library preview.
export function StrategyLab({ templateId, series, initialParams, onParamsChange, compact, compare }: StrategyLabProps) {
  const tpl = getTemplate(templateId);
  const [params, setParams] = useState<StrategyParams>(initialParams ?? defaultParams(templateId));

  const result = useMemo(() => runStrategy({ templateId, params }, series), [templateId, params, series]);

  const compareResults = useMemo(
    () => compare?.map((c) => ({ label: c.label, equity: runStrategy({ templateId, params: c.params }, c.series).equityCurve })),
    [compare, templateId, params],
  );

  if (!tpl) return <div className="err">Plantilla desconocida: {templateId}</div>;

  function update(key: string, v: number) {
    const next = { ...params, [key]: v };
    setParams(next);
    onParamsChange?.(next);
  }

  return (
    <div className={`lab ${compact ? 'lab-compact' : ''}`}>
      <div className="lab-controls">
        {tpl.params.map((p) => (
          <Slider
            key={p.key}
            label={p.label}
            value={params[p.key]}
            min={p.min}
            max={p.max}
            step={p.step}
            help={p.help}
            onChange={(v) => update(p.key, v)}
          />
        ))}
      </div>
      <div className="lab-viz">
        <div className="viz-block">
          <h4 className="viz-title">Precio y señal</h4>
          <PriceChart series={series} signal={result.signal} />
          <div className="legend">
            <span><i className="dot dot-long" /> Largo</span>
            <span><i className="dot dot-short" /> Corto</span>
          </div>
        </div>
        <div className="viz-block">
          <h4 className="viz-title">Capital (inicia en 100)</h4>
          <EquityChart equity={result.equityCurve} compare={compareResults} />
          {compareResults && compareResults.length > 0 && (
            <div className="legend">
              <span><i className="dot dot-you" /> Tu estrategia</span>
              <span><i className="dot dot-vs" /> Rango oponentes</span>
            </div>
          )}
        </div>
        <Metrics result={result} />
      </div>
    </div>
  );
}
