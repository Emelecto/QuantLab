export type AssetClass = 'crypto' | 'equities' | 'macro';

export type Level = 'beginner' | 'advanced';

export interface DatasetRow {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  direction?: 1 | -1 | 0; // etiqueta de predicción del torneo (solo en tournament-sample)
}

export interface Dataset {
  id: string;
  name: string;
  assetClass: AssetClass;
  level: Level;
  dateRange: string;
  frequency: string;
  usedInCourse: boolean;
  blurb: string;
  rows: DatasetRow[]; // raw sample, shown in "read the data" exercises
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
export type Part = 'Ciencia de Datos' | 'Machine Learning' | 'Finanzas' | 'Trading';

export interface ModuleDef {
  def: {
    id: number;
    part: Part;
    title: string;
    subtitle: string;
    kind: 'lesson' | 'tournament';
    xp: number;
  };
  intro: string;
  sections: { heading: string; body: string }[];
  exercise: LessonExercise;
  takeaway: string;
}

export interface QuizQuestion {
  q: string;
  options: string[];
  answer: number; // index of correct option
  explain: string;
}

export interface ReadTask {
  // "read the raw data" exercise: spot a column / an outlier / a gap.
  prompt: string;
  answerCol?: keyof DatasetRow; // column the user must identify
  outlierRow?: number; // 0-based row index the user must flag (if any)
  hint: string;
}

export interface PredictTask {
  // beginner prediction: state direction / rough next close before revealing.
  prompt: string;
  // deterministic check: did the actual next close go up or down?
  seriesId: string; // dataset id to read 'close'
  revealNote: string;
}

export interface LessonExercise {
  kind: 'risk' | 'dataset' | 'strategy' | 'backtest' | 'read' | 'predict' | 'quiz';
  templateId?: string; // for strategy/backtest
  datasetId?: string; // for dataset/read
  readTask?: ReadTask; // for read
  predictTask?: PredictTask; // for predict
  quiz?: QuizQuestion[]; // for quiz
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
