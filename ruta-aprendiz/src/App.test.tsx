import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { App } from './App';
import { progress } from './lib/progress';

// Reset persisted progress between runs so the walk-through is deterministic.
beforeEach(() => {
  localStorage.clear();
  progress.reset();
});

// Accent/case-insensitive substring match (handles Spanish accents in jsdom textContent).
function clickByText(pattern: string) {
  const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const btns = Array.from(document.querySelectorAll('button'));
  const el = btns.find((b) => norm(b.textContent || '').includes(norm(pattern)));
  if (!el) throw new Error(`button containing "${pattern}" not found`);
  fireEvent.click(el);
}

describe('Ruta Aprendiz — end-to-end acceptance (brief §8)', () => {
  it('a new user completes all 5 modules without code and ends in a real tournament', () => {
    const { container } = render(<App />);
    expect(container.querySelector('.app')).toBeTruthy();

    clickByText('Comienza la Ruta Aprendiz');
    expect(screen.getAllByText(/Ruta Aprendiz/i).length).toBeGreaterThan(0);

    clickByText('Módulo 1');
    expect(screen.getByText(/Ejercicio interactivo/i)).toBeTruthy();
    clickByText('+100 XP');

    clickByText('Módulo 2');
    const favBtn = screen.getByText(/Fijar como favorito/i);
    fireEvent.click(favBtn);
    expect(progress.get().favoriteDatasetId).toBe('btc-daily');
    clickByText('+100 XP');

    clickByText('Módulo 3');
    expect(container.querySelector('input[type=range]')).toBeTruthy();
    clickByText('+150 XP');

    clickByText('Módulo 4');
    clickByText('+150 XP');
    expect(progress.get().savedStrategy).not.toBeNull();
    expect(progress.get().savedStrategy!.templateId).toBe('ma_cross');

    // M5 is now unlocked on the map; open it -> it IS the tournament (handoff preloaded)
    clickByText('Módulo 5');
    expect(screen.getByText(/Handoff sin clic/i)).toBeTruthy();
    clickByText('Entrar al torneo');
    expect(progress.get().tournamentsEntered.length).toBeGreaterThan(0);

    expect(progress.get().completedModules.length).toBe(5);
    expect(progress.get().badgeEarned).toBe(true);
    expect(progress.get().xp).toBe(800);
  });

  it('badge and favorite appear on the profile (seam 1 + 2)', () => {
    progress.completeModule(1);
    progress.completeModule(2);
    progress.completeModule(3);
    progress.completeModule(4);
    progress.completeModule(5);
    progress.setFavoriteDataset('btc-daily');

    render(<App />);
    clickByText('🏅');
    expect(screen.getAllByText(/Aprendiz Cuant/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/BTC\/USD Diario/i)).toBeTruthy();
  });

  it('library filters by asset class and level', () => {
    render(<App />);
    clickByText('📚');
    expect(screen.getByText(/BTC\/USD Diario/i)).toBeTruthy();
    clickByText('Cripto');
    expect(screen.queryByText(/AAPL Diario/i)).toBeNull();
    expect(screen.getByText(/BTC\/USD Diario/i)).toBeTruthy();
  });

  it('nav has the four clusters without disturbing pros', () => {
    const { container } = render(<App />);
    const nav = container.querySelector('.nav')!;
    const labels = Array.from(nav.querySelectorAll('button')).map((b) => b.textContent || '');
    expect(labels.some((l) => l.includes('Aprende'))).toBe(true);
    expect(labels.some((l) => l.includes('Competencias'))).toBe(true);
    expect(labels.some((l) => l.includes('Marketplace'))).toBe(true);
  });

  afterEach(() => cleanup());
});
