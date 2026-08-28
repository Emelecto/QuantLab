import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { App } from './App';
import { progress } from './lib/progress';

// Reset persisted progress between runs so the walk-through is deterministic.
beforeEach(() => {
  localStorage.clear();
  progress.reset();
});

// Accent/case-insensitive match. Acepta string o RegExp.
// Clave: normalizamos TANTO el patrón como el texto del botón a NFD y quitamos
// los combining marks, para que "Módulo" (precompuesto en el patrón) iguale
// "modulo" (descompuesto en el texto del DOM).
function normStr(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}
function clickByText(pattern: string | RegExp) {
  const src = pattern instanceof RegExp ? pattern.source : pattern;
  const re = new RegExp(normStr(src), 'i');
  const btns = Array.from(document.querySelectorAll('button'));
  const el = btns.find((b) => re.test(normStr(b.textContent || '')));
  if (!el) throw new Error(`button matching "${pattern}" not found`);
  fireEvent.click(el);
}

function completeModule(i: number) {
  clickByText(`Módulo ${i}`);
  clickByText(/completar modulo/i);
}

describe('Ruta Aprendiz — 12 módulos, 4 partes (brief expandido)', () => {
  it('un nuevo usuario completa los 12 módulos sin código y entra a un torneo real', () => {
    const { container } = render(<App />);
    expect(container.querySelector('.app')).toBeTruthy();

    clickByText('Comienza la Ruta Aprendiz');
    // Las 4 partes aparecen en el mapa.
    expect(screen.getAllByText(/Ciencia de Datos/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Machine Learning/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Finanzas/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Trading/i).length).toBeGreaterThan(0);

    // M1 riesgo
    completeModule(1);
    // M2 dataset -> fija favorito (seam 2)
    clickByText('Módulo 2');
    const favBtn = screen.getByText(/Fijar como favorito/i);
    fireEvent.click(favBtn);
    expect(progress.get().favoriteDatasetId).toBe('btc-daily');
    clickByText(/completar modulo/i);
    // M3 read (lee datos crudos)
    completeModule(3);
    // M4 strategy (sliders)
    completeModule(4);
    // M5 predict
    completeModule(5);
    // M6 backtest (guarda estrategia para handoff)
    clickByText('Módulo 6');
    clickByText(/completar modulo/i);
    expect(progress.get().savedStrategy).not.toBeNull();
    expect(progress.get().savedStrategy!.templateId).toBe('ma_cross');
    // M7-M11 (quiz / finanzas / trading)
    for (const i of [7, 8, 9, 10, 11]) completeModule(i);

    // M12 = torneo real con handoff sin clic
    clickByText('Módulo 12');
    expect(screen.getByText(/Handoff sin clic/i)).toBeTruthy();
    clickByText('Entrar al torneo');
    expect(progress.get().tournamentsEntered.length).toBeGreaterThan(0);

    expect(progress.get().completedModules.length).toBe(12);
    expect(progress.get().badgeEarned).toBe(true);
    // XP total: 100+100+120+150+150+150+150+150+150+200+200+300 = 1920
    expect(progress.get().xp).toBe(1920);
  });

  it('badge y favorito aparecen en el perfil (seam 1 + 2)', () => {
    for (const i of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]) progress.completeModule(i);
    progress.setFavoriteDataset('btc-daily');

    render(<App />);
    clickByText('🏅');
    expect(screen.getAllByText(/Aprendiz Cuant/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/BTC\/USD Diario/i)).toBeTruthy();
  });

  it('biblioteca accesible y filtra por activo y nivel', () => {
    render(<App />);
    clickByText('📚');
    expect(screen.getByText(/BTC\/USD Diario/i)).toBeTruthy();
    clickByText('Cripto');
    expect(screen.queryByText(/AAPL Diario/i)).toBeNull();
    expect(screen.getByText(/BTC\/USD Diario/i)).toBeTruthy();
  });

  it('el ejercicio read muestra la tabla OHLCV cruda', () => {
    render(<App />);
    clickByText('Comienza la Ruta Aprendiz');
    // M3 está bloqueado hasta completar M1 y M2.
    completeModule(1);
    clickByText('Módulo 2');
    const favBtn = screen.getByText(/Fijar como favorito/i);
    fireEvent.click(favBtn);
    clickByText(/completar modulo/i);
    clickByText('Módulo 3');
    expect(screen.getAllByText(/close/i).length).toBeGreaterThan(0); // columna de la tabla cruda
    expect(screen.getAllByText(/open/i).length).toBeGreaterThan(0);
  });

  afterEach(() => cleanup());
});
