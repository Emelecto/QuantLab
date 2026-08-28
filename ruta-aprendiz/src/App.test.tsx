import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { App } from './App';
import { progress } from './lib/progress';

beforeEach(() => {
  localStorage.clear();
  progress.reset();
});

function normStr(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}
function clickByText(pattern: string | RegExp) {
  const src = pattern instanceof RegExp ? pattern.source : pattern;
  const re = new RegExp(normStr(src), 'i');
  const btns = Array.from(document.querySelectorAll('button'));
  const el = btns.find((b) => re.test(normStr(b.textContent || '')));
  if (!el) {
    const all = Array.from(document.querySelectorAll('button')).map((b) => b.textContent);
    throw new Error(`button matching "${pattern}" not found. Buttons: ${JSON.stringify(all)}`);
  }
  fireEvent.click(el);
}

function completeModule(i: number) {
  clickByText(`Módulo ${i}`);
  clickByText(/completar modulo/i);
}

describe('Ruta Aprendiz — 14 módulos, 4 partes', () => {
  it('un nuevo usuario completa los 14 módulos sin código y entra a un torneo real', () => {
    const { container } = render(<App />);
    expect(container.querySelector('.app')).toBeTruthy();

    clickByText('Comienza la Introducción a QuantLab');
    expect(screen.getAllByText(/Ciencia de Datos/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Machine Learning/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Finanzas/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Trading/i).length).toBeGreaterThan(0);

    // Completar en orden estricto (los módulos de una parte son secuenciales).
    // M2 fija favorito (seam 2) antes de completarlo.
    completeModule(1);
    clickByText('Módulo 2');
    fireEvent.click(screen.getByText(/Fijar como favorito/i));
    clickByText(/completar modulo/i);
    for (const i of [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]) completeModule(i);

    // M14 = torneo real con handoff sin clic
    clickByText('Módulo 14');
    expect(screen.getByText(/Handoff sin clic/i)).toBeTruthy();
    clickByText('Entrar al torneo');
    expect(progress.get().tournamentsEntered.length).toBeGreaterThan(0);

    expect(progress.get().completedModules.length).toBe(14);
    expect(progress.get().badgeEarned).toBe(true);
    // XP total: 100+100+120+130+150*6+200*3+300 = 2250
    expect(progress.get().xp).toBe(2250);
  });

  it('badge y favorito aparecen en el perfil (seam 1 + 2)', () => {
    for (const i of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]) progress.completeModule(i);
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
    clickByText('Comienza la Introducción a QuantLab');
    completeModule(1);
    clickByText('Módulo 2');
    fireEvent.click(screen.getByText(/Fijar como favorito/i));
    clickByText(/completar modulo/i);
    clickByText('Módulo 3');
    expect(screen.getAllByText(/close/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/open/i).length).toBeGreaterThan(0);
  });

  it('la vista previa de la biblioteca muestra la tabla OHLCV, no un grafico', () => {
    render(<App />);
    clickByText('📚');
    clickByText('Vista previa');
    expect(screen.getAllByText(/open/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/volume/i).length).toBeGreaterThan(0);
  });

  afterEach(() => cleanup());
});
