import type { BacktestResult, StrategyConfig } from './types';
import { runStrategy } from './runner';
import { genPriceSeries } from './random';

// Shared tournament series for this week's debut tournament.
export const TOURNAMENT_SEED = 0xc0ffee;
export const TOURNAMENT_SERIES = genPriceSeries(TOURNAMENT_SEED, 400);

export interface Bot {
  id: string;
  name: string;
  config: StrategyConfig;
  result?: BacktestResult;
}

// Pre-computed opponents (deterministic). The user's strategy is slotted in live.
export const tournamentBots: Bot[] = [
  { id: 'bot-nova', name: 'NovaQuant', config: { templateId: 'ma_cross', params: { fast: 12, slow: 40 } } },
  { id: 'bot-orbit', name: 'OrbitDesk', config: { templateId: 'bollinger', params: { period: 20, devs: 2 } } },
  { id: 'bot-kappa', name: 'Kappa Labs', config: { templateId: 'momentum', params: { period: 14, threshold: 5 } } },
  { id: 'bot-flux', name: 'Flux Signals', config: { templateId: 'ma_cross', params: { fast: 8, slow: 60 } } },
];

export function botResults(): Bot[] {
  return tournamentBots.map((b) => ({ ...b, result: runStrategy(b.config, TOURNAMENT_SERIES) }));
}
