import type { StrategyTemplate } from './types';

// The 3 strategy templates — the bottleneck deliverable.
// Sliders here ARE the M3/M4 exercise controls and the M5 tournament entry.
// Same param shape reused end-to-end so the M4 -> M5 handoff is one object, zero copy-paste.
export const strategyTemplates: StrategyTemplate[] = [
  {
    id: 'ma_cross',
    name: 'Cruce de Medias Móviles',
    tagline: 'Compra cuando la rápida cruza por encima de la lenta.',
    description:
      'La señal más clásica del trading cuant. Toma dos medias móviles de distinto periodo. ' +
      'Cuando la media rápida pasa por encima de la lenta, vas largo; cuando cae por debajo, vas corto. ' +
      'Es el ejercicio exacto del Módulo 3.',
    params: [
      { key: 'fast', label: 'Media móvil rápida (periodo)', min: 3, max: 50, step: 1, default: 10, help: 'Ventana corta. Más chica = reacciona antes al precio.' },
      { key: 'slow', label: 'Media móvil lenta (periodo)', min: 10, max: 200, step: 1, default: 50, help: 'Ventana larga. Debe ser mayor que la rápida.' },
    ],
  },
  {
    id: 'bollinger',
    name: 'Reversión a la Media (Bollinger)',
    tagline: 'Compras en el mínimo de la banda, vendes en el máximo.',
    description:
      'Calcula una media móvil y una banda de ±k desviaciones estándar. Si el precio toca la banda inferior ' +
      'estás "barato" (vas largo, esperas reversión); si toca la superior estás "caro" (vas corto).',
    params: [
      { key: 'period', label: 'Periodo de la media', min: 5, max: 80, step: 1, default: 20, help: 'Ventana de la media móvil central.' },
      { key: 'devs', label: 'Desviaciones estándar (k)', min: 1, max: 4, step: 0.1, default: 2, help: 'Ancho de la banda. Más ancho = señales más raras.' },
    ],
  },
  {
    id: 'momentum',
    name: 'Momentum (Rate of Change)',
    tagline: 'Cabalga la tendencia mientras el impulso aguante.',
    description:
      'Mide cuánto subió el precio en los últimos N periodos (Rate of Change). Si el impulso supera el umbral ' +
      'vas largo; si cae por debajo del umbral negativo, vas corto. Captura tendencias, no reversión.',
    params: [
      { key: 'period', label: 'Ventana de momentum (periodo)', min: 3, max: 60, step: 1, default: 14, help: 'Periodo del Rate of Change.' },
      { key: 'threshold', label: 'Umbral (%)', min: 1, max: 20, step: 0.5, default: 5, help: 'Impulso mínimo para entrar (en %).' },
    ],
  },
];

export function getTemplate(id: string): StrategyTemplate | undefined {
  return strategyTemplates.find((t) => t.id === id);
}
