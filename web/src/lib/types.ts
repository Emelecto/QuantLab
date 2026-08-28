// Estado de progreso de la Ruta Aprendiz. Compartido entre el iframe
// (ruta-aprendiz) y el puente de /learn vía postMessage. Debe coincidir con
// el tipo ProgressState de ruta-aprendiz/src/types.ts.

export interface StrategyConfig {
  templateId: string;
  params: Record<string, number>;
}

export interface ProgressState {
  completedModules: number[];
  xp: number;
  streakDays: number;
  lastActiveDate: string;
  badgeEarned: boolean;
  favoriteDatasetId: string | null;
  savedStrategy: StrategyConfig | null;
  tournamentsEntered: string[];
}
