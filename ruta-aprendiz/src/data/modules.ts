import type { Level, ModuleDef, Part } from '../types';

export interface LessonExercise {
  kind: 'risk' | 'dataset' | 'strategy' | 'backtest' | 'read' | 'predict' | 'quiz';
  templateId?: string;
  datasetId?: string;
  readTask?: { prompt: string; answerCol?: keyof import('../types').DatasetRow; outlierRow?: number; hint: string };
  predictTask?: { prompt: string; seriesId: string; revealNote: string };
  quiz?: { q: string; options: string[]; answer: number; explain: string }[];
}

export interface ModuleContent {
  def: ModuleDef;
  intro: string;
  sections: { heading: string; body: string }[];
  exercise: LessonExercise;
  takeaway: string;
}

const DATA: Part = 'Ciencia de Datos';
const ML: Part = 'Machine Learning';
const FIN: Part = 'Finanzas';
const TR: Part = 'Trading';

export const modules: ModuleContent[] = [
  // ===================== PARTE 1 — CIENCIA DE DATOS (módulos 1-3) =====================
  {
    def: { id: 1, title: 'Bienvenido al trading cuant', subtitle: 'De cero: intuición y riesgo', kind: 'lesson', part: DATA, xp: 100 },
    intro:
      'El trading cuantitativo usa datos y reglas para decidir cuándo comprar y vender, en lugar de intuición o rumores. ' +
      'Antes de cualquier fórmula: entendamos el riesgo, porque es lo que de verdad te borra del juego.',
    sections: [
      { heading: 'Señal vs ruido', body: 'Los precios se mueven por información real y por ruido (movimientos al azar). Una buena estrategia captura lo primero e ignora lo segundo. Adivinar la dirección de un solo día es casi ruido puro.' },
      { heading: 'El riesgo es real', body: 'Poner mucho capital en una sola operación puede borrarte en días. El drawdown (caída desde el máximo) es tu enemigo silencioso: si pierdes 50%, necesitas +100% solo para volver al punto de partida.' },
      { heading: 'Por qué un curso', body: 'Vas a leer datos crudos, hacer tus primeras predicciones, entrenar un modelo simple y, al final, competir en un torneo real. Sin escribir una línea de código.' },
    ],
    exercise: { kind: 'risk' },
    takeaway: 'Menos capital en riesgo = drawdowns pequeños y sobrevives para iterar mañana.',
  },
  {
    def: { id: 2, title: 'Tus primeros datos: lee el crudo', subtitle: 'Abre un dataset y entiende cada columna', kind: 'lesson', part: DATA, xp: 100 },
    intro:
      'Toda estrategia come datos. Hoy abres un dataset real de la Biblioteca y aprendes a leerlo fila por fila. ' +
      'El dataset que uses queda guardado como favorito automáticamente para el resto del curso.',
    sections: [
      { heading: 'Qué es una serie de precios', body: 'Es una tabla con una fila por día (o hora) y columnas: apertura (open), máximo (high), mínimo (low), cierre (close) y volumen (volume). El cierre es el precio al final del periodo: es la columna que casi siempre usamos.' },
      { heading: 'OHLCV', body: 'Open = precio al inicio del día. High/Low = el máximo y mínimo que tocó. Close = dónde cerró. Volume = cuántas unidades se negociaron. Juntas cuentan la historia del día.' },
      { heading: 'Calidad importa', body: 'Datos con huecos (fines de semana, festivos), errores tipográficos o precios imposibles generan señales falsas. Siempre revisa rango y frecuencia antes de confiar.' },
    ],
    exercise: { kind: 'dataset', datasetId: 'btc-daily' },
    takeaway: 'Si no entiendes las columnas, no entiendes la estrategia. Lee el crudo siempre.',
  },
  {
    def: { id: 3, title: 'Detecta mentiras en los datos', subtitle: 'Huecos, outliers y frecuencias', kind: 'lesson', part: DATA, xp: 120 },
    intro:
      'Los datasets del mundo real tienen errores. Aprende a detectarlos antes de que arruinen tu backtest. ' +
      'En este ejercicio abres la tabla cruda y señalas dónde algo no cuadra.',
    sections: [
      { heading: 'Huecos de tiempo', body: 'Si ves fechas que saltan (ej. del lunes al jueves sin martes/miércoles), hay datos faltantes. Los findes en cripto no cuentan, pero en acciones sí: ahí el hueco es real.' },
      { heading: 'Outliers', body: 'Un precio 10x el anterior suele ser un error de tipeo, no un evento real. Detectarlo a ojo es la habilidad más barata y más útil que tienes.' },
      { heading: 'Frecuencia', body: 'Diario, horario o mensual cambia todo. Un modelo de velas diarias no sirve para datos mensuales. Confirma la frecuencia antes de entrenar.' },
    ],
    exercise: {
      kind: 'read',
      datasetId: 'btc-daily',
      readTask: {
        prompt: 'En la tabla cruda de BTC, ¿qué columna te dice el precio al FINAL de cada día? Señala la columna correcta.',
        answerCol: 'close',
        hint: 'Es la columna que usamos para calcular retornos y señales. No es el máximo ni el mínimo.',
      },
    },
    takeaway: 'Un outlier o hueco ignorado puede hacer que tu "gran estrategia" sea pura suerte.',
  },

  // ===================== PARTE 2 — MACHINE LEARNING (módulos 4-7) =====================
  {
    def: { id: 4, title: 'Patrones vs ruido', subtitle: 'Medias móviles: tu primer modelo', kind: 'lesson', part: ML, xp: 150 },
    intro:
      'El modelo más simple de todos: la media móvil. Suaviza el ruido y te muestra la tendencia. ' +
      'Mueve el slider y observa cómo cambia la línea.',
    sections: [
      { heading: 'Media móvil', body: 'Promedio del precio de los últimos N días. Con N pequeño reacciona rápido (ruido); con N grande es suave (tendencia lenta). Es "aprendizaje" en el sentido más básico: resume el pasado.' },
      { heading: 'Por qué funciona', body: 'Cuando la media corta cruza por encima de la larga, la tendencia reciente es más fuerte que la histórica: sesgo al alza. Al revés: sesgo a la baja.' },
      { heading: 'No es magia', body: 'Una media móvil siempre va ATRASADA del precio. Gana en tendencias, pierde en mercados planos. Conocer cuándo falla es más importante que creer que siempre acierta.' },
    ],
    exercise: { kind: 'strategy', templateId: 'ma_cross' },
    takeaway: 'Tu primer "modelo" ya es una estrategia completa. La afinas después.',
  },
  {
    def: { id: 5, title: 'Tu primera predicción', subtitle: 'Adivina mañana antes de verlo', kind: 'lesson', part: ML, xp: 150 },
    intro:
      'Haz tu primera predicción como principiante: mira la serie y declara si el próximo cierre sube o baja. ' +
      'Luego revelamos el resultado real. El objetivo no es acertar, es entrenar el ojo.',
    sections: [
      { heading: 'Predecir dirección', body: 'En vez de un número exacto, predice la DIRECCIÓN (↑ o ↓). Es más fácil y es lo que importa para una señal de compra/venta.' },
      { heading: 'Usa el contexto', body: 'Si vienen 3 días al alza con volumen creciente, ¿continúa o se agota? No hay respuesta correcta única; lo que entrenas es mirar el cuadro completo, no un solo número.' },
      { heading: 'La base del ML', body: 'Todo modelo de machine learning hace esto mismo: recibe datos pasados y produce una predicción. Tú acabas de hacer inferencia manual.' },
    ],
    exercise: { kind: 'predict', predictTask: { prompt: 'Con los últimos días de BTC que ves abajo, ¿crees que el próximo cierre sube o baja? Decláralo y luego pulsa Revelar.', seriesId: 'btc-daily', revealNote: 'La predicción manual entrena tu intuición; un modelo la hace a escala y con miles de ejemplos.' } },
    takeaway: 'Predecir dirección es inferencia. Eso es exactamente lo que entrena un modelo después.',
  },
  {
    def: { id: 6, title: 'Overfit: la trampa', subtitle: 'Por qué tu estrategia "perfecta" engaña', kind: 'lesson', part: ML, xp: 150 },
    intro:
      'Corres el backtest de tu señal del Módulo 4 y ves la trampa del overfit: lo bien que funciona en el pasado no garantiza el futuro. ' +
      'Compara muestra-in vs muestra-out con los mismos parámetros.',
    sections: [
      { heading: 'Overfit', body: 'Ajustar parámetros hasta que el historial quede perfecto. El modelo "memoriza" en vez de "aprender". En datos nuevos se desploma.' },
      { heading: 'Muestra fuera de muestra (OOS)', body: 'La prueba real: ¿funciona en datos que NO usaste para calibrar? Si la brecha entre muestra-in y muestra-out es grande, desconfía.' },
      { heading: 'Train / test siempre', body: 'Regla de oro del ML: nunca evalúes en los mismos datos con los que entrenaste. Por eso el backtest serio separa las dos mitades.' },
    ],
    exercise: { kind: 'backtest', templateId: 'ma_cross' },
    takeaway: 'Desconfía de estrategias que solo funcionan en el pasado.',
  },
  {
    def: { id: 7, title: 'Métricas que no mienten', subtitle: 'Lee los resultados como un pro', kind: 'lesson', part: ML, xp: 150 },
    intro:
      'Un backtest arroja muchos números. Aprende cuáles importan de verdad para no dejarte engañar por el retorno total.',
    sections: [
      { heading: 'Sharpe', body: 'Retorno por unidad de riesgo. Un Sharpe de 1 ya es bueno; 2 es excelente. Premia ganar SIN volatilidad loca. Es la métrica que más usa la industia.' },
      { heading: 'Max Drawdown', body: 'La caída máxima desde un pico. Un 40% de drawdown duele aunque el retorno total sea positivo: duerme mal y puede liquidarte si usaste apalancamiento.' },
      { heading: 'Win rate', body: '% de operaciones ganadoras. Sorprendentemente menos importante: puedes ganar poco seguido y perder mucho rara vez, y seguir perdiendo dinero. Mira siempre el contexto.' },
    ],
    exercise: {
      kind: 'quiz',
      quiz: [
        { q: '¿Qué significa un Sharpe alto?', options: ['Mucho retorno sin importar riesgo', 'Buen retorno por unidad de riesgo', 'Cero operaciones perdidas', 'Drawdown pequeño siempre'], answer: 1, explain: 'Sharpe = retorno / volatilidad. Alto = ganas bien sin volatilidad extrema.' },
        { q: 'El overfit ocurre cuando…', options: ['Usas datos recientes', 'Ajustas tanto que memorizas el pasado', 'El drawdown es bajo', 'Ganas en muestra-out'], answer: 1, explain: 'Overfit = el modelo memoriza el entrenamiento y falla fuera de muestra.' },
      ],
    },
    takeaway: 'Sharpe y drawdown OOS cuentan la historia; el retorno total a veces miente.',
  },

  // ===================== PARTE 3 — FINANZAS (módulos 8-9) =====================
  {
    def: { id: 8, title: 'Retornos, capital y riesgo', subtitle: 'El lenguaje de las finanzas', kind: 'lesson', part: FIN, xp: 150 },
    intro:
      'Trading es finanzas. Aprende a hablar en retornos (porcentajes) en vez de precios, y por qué el riesgo se mide en drawdown.',
    sections: [
      { heading: 'Retorno', body: 'En vez de "subió $100", di "subió 2.3%". El retorno es comparable entre activos; el precio absoluto no. Si BTC sube $100 (0.2%) y AAPL sube $2 (1.1%), AAPL ganó más proporcionalmente.' },
      { heading: 'Capital', body: 'Tu capital total es lo que puedes arriesgar. Una posición es qué fracción de ese capital pones en una operación. Posiciones pequeñas = supervivencia.' },
      { heading: 'Riesgo', body: 'Se mide en pérdida potencial, no en emoción. Un stop-loss (precio donde sales) convierte el riesgo infinito en finito. Sin stop, una sola mala noche puede ser la última.' },
    ],
    exercise: { kind: 'quiz', quiz: [
      { q: '¿Por qué usamos retornos y no precios?', options: ['Los precios son más fáciles', 'Son comparables entre activos', 'Los precios no existen', 'El retorno siempre es positivo'], answer: 1, explain: 'El retorno % se compara entre BTC y AAPL; el precio absoluto no.' },
      { q: 'Un stop-loss sirve para…', options: ['Subir el retorno', 'Limitar la pérdida máxima', 'Evitar impuestos', 'Comprar más barato'], answer: 1, explain: 'Convierte un riesgo abierto en una pérdida conocida y acotada.' },
    ] },
    takeaway: 'Finanzas = hablar en % y acotar el riesgo antes de operar.',
  },
  {
    def: { id: 9, title: 'Costos que se comen tu ganancia', subtitle: 'Comisiones, slippage y benchmark', kind: 'lesson', part: FIN, xp: 150 },
    intro:
      'Una estrategia puede verse perfecta y perder dinero real por los costos. Aprende a contarlos.',
    sections: [
      { heading: 'Comisiones', body: 'Cada compra y venta paga una comisión (ej. 0.1% por lado). Operar mucho las acumula. Una señal que gana 0.15% por trade puede perder tras comisiones.' },
      { heading: 'Slippage', body: 'El precio real de ejecución rara vez es el que viste: al operar tamaño grande se mueve el mercado. El slippage es esa diferencia escondida.' },
      { heading: 'Benchmark', body: '¿Superaste al S&P 500 (buy & hold)? Si tu estrategia compleja gana menos que solo comprar y aguantar, ¿valió la pena el riesgo? Ese es el benchmark.' },
    ],
    exercise: { kind: 'quiz', quiz: [
      { q: '¿Por qué importa el slippage?', options: ['Es un impuesto', 'El precio real difiere del visto', 'Sube el drawdown', 'Baja la comisión'], answer: 1, explain: 'Al ejecutar tamaño real, el precio se mueve: pagas más o vendes menos de lo planeado.' },
      { q: 'El benchmark sirve para…', options: ['Comparar contra no hacer nada', 'Subir comisiones', 'Medir el slippage', 'Definir el stop'], answer: 0, explain: 'Si no superas al buy & hold simple, la estrategia no aportó valor.' },
    ] },
    takeaway: 'Cuenta costos siempre. La mitad de las estrategias "ganadoras" mueren ahí.',
  },

  // ===================== PARTE 4 — TRADING (módulos 10-12) =====================
  {
    def: { id: 10, title: 'Tu primera señal de trading', subtitle: 'Cruce de medias en vivo', kind: 'lesson', part: TR, xp: 200 },
    intro:
      'Construyes tu primera señal de trading moviendo un slider. Elige plantilla y periodo; el gráfico y los trades cambian en vivo. ' +
      'Esta estrategia es la que llevarás al torneo.',
    sections: [
      { heading: 'Señal = regla', body: 'Una señal es solo una regla: "si la media rápida > lenta, compra". Al convertirla en código (o en este slider) deja de ser opinión y pasa a ser reproducible.' },
      { heading: 'Parámetros', body: 'Rápido (ej. 20) y lento (ej. 50). Más cerca = más operaciones y más ruido; más lejos = menos operaciones y más tardías. Tu trabajo es encontrar el equilibrio.' },
      { heading: 'Reproducible', body: 'Lo bueno de una señal explícita: cualquiera (o un bot) la puede repetir mañana con los mismos datos. Eso es trading sistemático.' },
    ],
    exercise: { kind: 'strategy', templateId: 'ma_cross' },
    takeaway: 'Una señal simple ya es una estrategia completa y reproducible.',
  },
  {
    def: { id: 11, title: 'Backtest real de tu señal', subtitle: 'Muestra-in vs muestra-out', kind: 'lesson', part: TR, xp: 200 },
    intro:
      'Corres el backtest de tu señal del Módulo 10 con parámetros que NO tocaste en el entrenamiento. ' +
      'Compara contra dos configuraciones alternativas para ver la brecha de overfit.',
    sections: [
      { heading: 'Diseña el test', body: 'Usa la misma señal pero mírala en la mitad de datos que no calib raste. Si ahí también gana, tienes algo. Si solo gana en la mitad conocida, es suerte.' },
      { heading: 'Lee el equity', body: 'La curva de capital (inicia en 100) debe subir suavemente. Si parece una montaña rusa, el riesgo es alto aunque el retorno final sea bueno.' },
      { heading: 'Decide con humildad', body: 'Una sola prueba no prueba nada. La ventaja real se ve tras muchos mercados y meses. Aquí solo entrenas el ojo del escepticismo.' },
    ],
    exercise: { kind: 'backtest', templateId: 'ma_cross' },
    takeaway: 'La señal que sobrevive fuera de muestra es la que llevas al torneo.',
  },
  {
    def: { id: 12, title: '🏆 Tu debut', subtitle: 'El torneo real de la comunidad', kind: 'tournament', part: TR, xp: 300 },
    intro:
      'Este módulo no es una lección: es un torneo real. Tu estrategia del Módulo 11 entra precargada. ' +
      'Completas y ya estás compitiendo — sin escribir código, sin salir del flujo. Al terminar recibes 10 QP de recompensa.',
    sections: [
      { heading: 'De aprendiz a competidor', body: 'La entrega final del curso es tu estrategia corriendo contra la comunidad. Lo que aprendiste en 11 módulos se pone a prueba.' },
      { heading: 'Sin clic de pegado', body: 'Los parámetros del Módulo 11 ya están cargados. Solo confírmalos y entra. El handoff es automático.' },
      { heading: 'Recompensa', body: 'Completar la Ruta Aprendiz te acredita 10 QP en tu wallet, canjeables en el Marketplace. Empezaste de cero; terminas con activo.' },
    ],
    exercise: { kind: 'backtest', templateId: 'ma_cross' },
    takeaway: 'Completaste la Ruta Aprendiz. Ahora compites — y ganaste 10 QP.',
  },
];

export function getModule(id: number): ModuleContent | undefined {
  return modules.find((m) => m.def.id === id);
}

export const partOrder: Part[] = [DATA, ML, FIN, TR];

export function modulesByPart(): { part: Part; mods: ModuleContent[] }[] {
  return partOrder.map((part) => ({
    part,
    mods: modules.filter((m) => m.def.part === part),
  }));
}

export const beginnerLevel: Level = 'beginner';
