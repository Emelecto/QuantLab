import { useSyncExternalStore } from 'react';
import type { ProgressState, StrategyConfig } from '../types';
import { modules } from '../data/modules';

const STORAGE_KEY = 'quantlab.progress.v1';
const EMBED = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('embed') === '1';

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
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

function loadLocal(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultState(), ...JSON.parse(raw) };
  } catch {
    /* ignore corrupt storage */
  }
  return defaultState();
}

let state: ProgressState = loadLocal();
const listeners = new Set<() => void>();

// When embedded, the host (/learn) owns the Supabase session. We ask it to
// load/save via postMessage; it applies RLS (auth.uid()). Until it replies we
// keep serving the local copy so the UI never blanks out.
function postToHost(type: string, payload?: unknown) {
  if (EMBED && window.parent && window.parent !== window) {
    window.parent.postMessage({ source: 'ruta-aprendiz', type, payload }, '*');
  }
}

function persistLocal() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota */
  }
}

function emit() {
  persistLocal();
  listeners.forEach((l) => l());
}

function setState(patch: Partial<ProgressState>) {
  state = { ...state, ...patch };
  emit();
  // Mirror to Supabase through the host only when the user is logged in there.
  postToHost('save', state);
}

function touchStreak() {
  const today = todayISO();
  if (state.lastActiveDate === today) return;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const nextStreak = state.lastActiveDate === yesterday ? state.streakDays + 1 : 1;
  setState({ streakDays: nextStreak, lastActiveDate: today });
}

// The host posts the server state back to us after load / save.
if (typeof window !== 'undefined') {
  window.addEventListener('message', (e: MessageEvent) => {
    const msg = e.data;
    if (!msg || msg.source !== 'quantlab-host' || msg.type !== 'state') return;
    state = { ...defaultState(), ...(msg.payload as ProgressState) };
    emit();
  });
}

// Ask the host for the saved progress as soon as we mount in embed mode.
if (EMBED && typeof window !== 'undefined') {
  postToHost('load');
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
    setState({ completedModules: completed, xp: state.xp + xp, badgeEarned });
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
