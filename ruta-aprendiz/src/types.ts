export type AssetClass = 'crypto' | 'equities' | 'macro';

export type Level = 'beginner' | 'advanced';

export interface Dataset {
  id: string;
  name: string;
  assetClass: AssetClass;
  level: Level;
  dateRange: string;
  frequency: string;
  usedInCourse: boolean;
  blurb: string;
}

// ---- Strategy templates (the bottleneck: the mini-runner) ----
export interface ParamSpec {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  default: number;
  help: string;
}

export interface StrategyTemplate {
  id: string;
  name: string;
  tagline: string;
  description: string;
  params: ParamSpec[];
}

export type StrategyParams = Record<string, number>;

export interface StrategyConfig {
  templateId: string;
  params: StrategyParams;
}

// ---- Backtest result ----
export interface Trade {
  entry: number; // index in series
  exit: number;
  side: 1 | -1;
  ret: number; // return from entry to exit
}

export interface BacktestResult {
  equityCurve: number[]; // normalized to 100 at start
  trades: Trade[];
  nTrades: number;
  totalReturn: number; // fraction
  sharpe: number;
  maxDrawdown: number; // fraction (positive number)
  winRate: number;
  // Out-of-sample vs in-sample honesty (M4 lesson)
  inSampleReturn: number;
  outSampleReturn: number;
  overfitGap: number; // inSample - outSample (positive => overfit warning)
  series: number[]; // the underlying price series plotted
  signal: (1 | 0 | -1)[]; // position per bar (for the chart)
}

// ---- Course / progress ----
export interface ModuleDef {
  id: number;
  title: string;
  subtitle: string;
  kind: 'lesson' | 'tournament';
  xp: number;
}

export interface ProgressState {
  completedModules: number[]; // module ids done
  xp: number;
  streakDays: number;
  lastActiveDate: string; // ISO date (yyyy-mm-dd)
  badgeEarned: boolean;
  favoriteDatasetId: string | null;
  savedStrategy: StrategyConfig | null; // handoff M4 -> M5
  tournamentsEntered: string[]; // tournament ids
}
