import { useSyncExternalStore } from 'react';
import type { ProgressState, StrategyConfig } from '../types';
import { modules } from '../data/modules';

const STORAGE_KEY = 'quantlab.progress.v1';

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function load(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultState(), ...JSON.parse(raw) };
  } catch {
    /* ignore corrupt storage */
  }
  return defaultState();
}

function defaultState(): ProgressState {
  return {
    completedModules: [],
    xp: 0,
    streakDays: 0,
    lastActiveDate: '',
    badgeEarned: false,
    favoriteDatasetId: null,
    savedStrategy: null,
    tournamentsEntered: [],
  };
}

let state: ProgressState = load();
const listeners = new Set<() => void>();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota */
  }
}

function emit() {
  persist();
  listeners.forEach((l) => l());
}

function setState(patch: Partial<ProgressState>) {
  state = { ...state, ...patch };
  emit();
}

// Bump streak if today differs from last active (and is consecutive or first).
function touchStreak() {
  const today = todayISO();
  if (state.lastActiveDate === today) return;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const nextStreak = state.lastActiveDate === yesterday ? state.streakDays + 1 : 1;
  setState({ streakDays: nextStreak, lastActiveDate: today });
}

export const progress = {
  get: () => state,
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  completeModule(id: number) {
    if (state.completedModules.includes(id)) return;
    const def = modules.find((m) => m.def.id === id);
    const xp = def ? def.def.xp : 0;
    const completed = [...state.completedModules, id];
    const badgeEarned = completed.length >= modules.length;
    setState({
      completedModules: completed,
      xp: state.xp + xp,
      badgeEarned,
    });
    touchStreak();
  },
  setFavoriteDataset(id: string) {
    if (state.favoriteDatasetId === id) return;
    setState({ favoriteDatasetId: id });
  },
  saveStrategy(config: StrategyConfig) {
    setState({ savedStrategy: config });
  },
  enterTournament(tournamentId: string) {
    if (state.tournamentsEntered.includes(tournamentId)) return;
    setState({ tournamentsEntered: [...state.tournamentsEntered, tournamentId] });
    touchStreak();
  },
  reset() {
    state = defaultState();
    emit();
  },
};

export function useProgress(): ProgressState {
  return useSyncExternalStore(progress.subscribe, progress.get);
}
