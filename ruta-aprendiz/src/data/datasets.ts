import type { Dataset } from '../types';

export const datasets: Dataset[] = [
  {
    id: 'btc-daily',
    name: 'BTC/USD Diario',
    assetClass: 'crypto',
    level: 'beginner',
    dateRange: '2018-01 – 2025-12',
    frequency: 'Diario',
    usedInCourse: true,
    blurb: 'Bitcoin en velas diarias. El dataset que abres en el Módulo 2 para aprender qué son los datos.',
  },
  {
    id: 'eth-daily',
    name: 'ETH/USD Diario',
    assetClass: 'crypto',
    level: 'beginner',
    dateRange: '2018-01 – 2025-12',
    frequency: 'Diario',
    usedInCourse: false,
    blurb: 'Ethereum diario. Buen segundo activo para probar tu primera señal.',
  },
  {
    id: 'aapl-daily',
    name: 'AAPL Diario',
    assetClass: 'equities',
    level: 'beginner',
    dateRange: '2015-01 – 2025-12',
    frequency: 'Diario',
    usedInCourse: false,
    blurb: 'Apple diario. Activos tradicionales para contrastar con cripto.',
  },
  {
    id: 'sp500-daily',
    name: 'S&P 500 (índice)',
    assetClass: 'equities',
    level: 'advanced',
    dateRange: '2000-01 – 2025-12',
    frequency: 'Diario',
    usedInCourse: false,
    blurb: 'Índice de referencia de EE.UU. Útil para benchmark de tu estrategia.',
  },
  {
    id: 'us-cpi-monthly',
    name: 'IPC de EE.UU. Mensual',
    assetClass: 'macro',
    level: 'advanced',
    dateRange: '1990-01 – 2025-12',
    frequency: 'Mensual',
    usedInCourse: false,
    blurb: 'Inflación mensual. Datos macro para estrategias de cartera.',
  },
  {
    id: 'usd-eur-daily',
    name: 'USD/EUR Diario',
    assetClass: 'macro',
    level: 'beginner',
    dateRange: '2005-01 – 2025-12',
    frequency: 'Diario',
    usedInCourse: false,
    blurb: 'Tipo de cambio principal. Muy líquido, ideal para macro.',
  },
];

export function getDataset(id: string): Dataset | undefined {
  return datasets.find((d) => d.id === id);
}
