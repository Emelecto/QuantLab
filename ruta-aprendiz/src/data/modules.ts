import type { Level, ModuleDef } from '../types';

export interface LessonExercise {
  kind: 'risk' | 'dataset' | 'strategy' | 'backtest';
  templateId?: string; // for strategy/backtest
  datasetId?: string; // for dataset
}

export interface ModuleContent {
  def: ModuleDef;
  intro: string;
  sections: { heading: string; body: string }[];
  exercise: LessonExercise;
  takeaway: string;
}

export const modules: ModuleContent[] = [
  {
    def: { id: 1, title: '¿Qué es trading cuant?', subtitle: 'Intuición sin fórmulas', kind: 'lesson', xp: 100 },
    intro:
      'El trading cuantitativo es usar datos y reglas para decidir cuándo comprar y vender, en lugar de intuición. ' +
      'Antes de tocar una fórmula: entendamos el riesgo.',
    sections: [
      { heading: 'Señal vs ruido', body: 'Los precios se mueven por información real y por ruido. Una buena estrategia captura lo primero y ignora lo segundo.' },
      { heading: 'El riesgo es real', body: 'Poner mucho capital en una sola operación puede borrarte en días. El drawdown (caída desde el máximo) es tu enemigo.' },
    ],
    exercise: { kind: 'risk' },
    takeaway: 'Menos capital en riesgo = drawdowns pequeños y sobrevives para iterar.',
  },
  {
    def: { id: 2, title: 'Datos, el combustible', subtitle: 'De dónde salen los precios', kind: 'lesson', xp: 100 },
    intro:
      'Toda estrategia come datos. Hoy abres un dataset real de la Biblioteca y aprendes a filtrarlo por activo. ' +
      'El dataset que uses queda guardado como favorito automáticamente.',
    sections: [
      { heading: 'Series de precios', body: 'Una serie de precios es una lista de valores en el tiempo: apertura, cierre, volumen. Aquí usamos cierre diario.' },
      { heading: 'Calidad importa', body: 'Datos con huecos o errores generan señales falsas. Siempre revisa rango y frecuencia.' },
    ],
    exercise: { kind: 'dataset', datasetId: 'btc-daily' },
    takeaway: 'Los buenos datos son la mitad de una buena estrategia.',
  },
  {
    def: { id: 3, title: 'Tu primera señal', subtitle: 'Media móvil y cruces', kind: 'lesson', xp: 150 },
    intro:
      'Construyes tu primera señal moviendo un slider. Elige plantilla y periodo; el gráfico y los trades cambian en vivo. ' +
      'Esta estrategia es la que llevarás al torneo.',
    sections: [
      { heading: 'Media móvil', body: 'Promedio del precio de los últimos N días. Suaviza el ruido y muestra la tendencia.' },
      { heading: 'Cruce', body: 'Si la media rápida cruza por encima de la lenta, tendencia al alza (largo). Si cae, al alza opuesta (corto).' },
    ],
    exercise: { kind: 'strategy', templateId: 'ma_cross' },
    takeaway: 'Una señal simple ya es una estrategia completa. La afinas después.',
  },
  {
    def: { id: 4, title: 'Backtest sin miedo', subtitle: 'Por qué tu estrategia "perfecta" engaña', kind: 'lesson', xp: 150 },
    intro:
      'Corres el backtest de tu señal del Módulo 3 y ves la trampa del overfit: lo bien que funciona en el pasado no garantiza el futuro. ' +
      'Compara muestra-in vs muestra-out con los mismos parámetros.',
    sections: [
      { heading: 'Overfit', body: 'Ajustar parámetros hasta que el historial quede perfecto. El modelo "memoriza" en vez de "aprender".' },
      { heading: 'Muestra fuera de muestra', body: 'La prueba real: ¿funciona en datos que NO usaste para calibrar? Si la brecha es grande, desconfía.' },
    ],
    exercise: { kind: 'backtest', templateId: 'ma_cross' },
    takeaway: 'Desconfía de estrategias que solo funcionan en el pasado.',
  },
  {
    def: { id: 5, title: '🏆 Tu debut', subtitle: 'El torneo real de la comunidad', kind: 'tournament', xp: 300 },
    intro:
      'Este módulo no es una lección: es un torneo real. Tu estrategia del Módulo 4 entra precargada. ' +
      'Completas y ya estás compitiendo — sin escribir código, sin salir del flujo.',
    sections: [
      { heading: 'De aprendiz a competidor', body: 'La entrega final del curso es tu estrategia corriendo contra la comunidad.' },
      { heading: 'Sin clic de pegado', body: 'Los parámetros del M4 ya están cargados. Solo confírmalos y entra.' },
    ],
    exercise: { kind: 'backtest', templateId: 'ma_cross' },
    takeaway: 'Completaste la Ruta Aprendiz. Ahora compites.',
  },
];

export function getModule(id: number): ModuleContent | undefined {
  return modules.find((m) => m.def.id === id);
}

export const beginnerLevel: Level = 'beginner';
