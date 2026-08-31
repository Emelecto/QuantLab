import type { Part } from './types';

export const modules = [
  // ===== PARTE 1 — CIENCIA DE DATOS =====
  {
    def: { id: 1, part: 'Ciencia de Datos', title: 'Bienvenido al trading cuant', subtitle: 'De cero: intuición y riesgo', kind: 'lesson', xp: 100 },
    intro: 'El trading cuantitativo usa datos y reglas, no corazón. Antes de código, entiende la única regla que importa: sobrevivir al riesgo.',
    sections: [
      { heading: '¿Qué es trading cuantitativo?', body: 'Es tomar decisiones de compra/venta con un método reproducible basado en datos históricos, no en intuición. Tú (pronto) competirás con estrategias, no con suerte.' },
      { heading: 'El riesgo es el jefe', body: 'Una sola mala apuesta puede borrar semanas de ganancias. Por eso todo módulo repite lo mismo: controla el riesgo antes de buscar retorno.' },
      { heading: 'Lo que vas a hacer', body: 'En 14 módulos pasarás de no saber qué es un "close" a entrar a un torneo real con una estrategia tuya, sin escribir una línea de código.' },
    ],
    exercise: { kind: 'risk' },
    takeaway: 'Cuant = método + datos + control de riesgo. Si dominas eso, ya eres peligroso (para el mercado, no para tu cuenta).',
  },
  {
    def: { id: 2, part: 'Ciencia de Datos', title: 'Tus primeros datos: lee el crudo', subtitle: 'Abre un dataset y entiende cada columna', kind: 'lesson', xp: 100 },
    intro: 'Todo empieza con una tabla. Aprende a leer un dataset de precios como quien lee un parte meteorológico: cada columna cuenta algo.',
    sections: [
      { heading: 'OHLCV: el alfabeto', body: 'Open, High, Low, Close, Volume. Son los 5 datos de cada día (o velas). El "Close" es el precio de cierre: tu referencia.' },
      { heading: 'Por qué importa el formato', body: 'Los torneos te dan exactamente esta tabla. Si la lees mal, predices mal. Hoy la abres de verdad.' },
      { heading: 'Frecuencia', body: 'Diario, horario, minuto. Más frecuencia = más ruido. El curso usa diario para que veas la señal, no el pixeleo.' },
    ],
    exercise: { kind: 'dataset', datasetId: 'btc-daily' },
    takeaway: 'Close es tu ancla. Si solo recuerdas una columna, que sea esa.',
  },
  {
    def: { id: 3, part: 'Ciencia de Datos', title: 'Detecta mentiras en los datos', subtitle: 'Huecos, outliers y frecuencias', kind: 'lesson', xp: 120 },
    intro: 'Los datos mentirosos arruinan modelos. Aprende a oler un outlier y un hueco antes de confiar en la tabla.',
    sections: [
      { heading: 'Huecos (missing)', body: 'Un fin de semana en cripto no para, pero en acciones sí. Un hueco en los datos puede duplicar una vela y romper tu señal.' },
      { heading: 'Outliers', body: 'Un "low" raro puede ser un flash de liquidez, no la realidad. Detectarlo evita que tu modelo aprenda basura.' },
      { heading: 'Frecuencia coherente', body: 'Mezclar diario con horario es el error de novato #1. Mantén una sola granularidad.' },
    ],
    exercise: { kind: 'read', datasetId: 'btc-daily', readTask: { prompt: 'En la tabla cruda de BTC, señala qué columna representa el precio de CIERRE de cada día.', answerCol: 'close', outlierRow: 4, hint: 'El cierre es el último precio negociado ese día; suele estar cerca del high y el low.' } },
    takeaway: 'Datos sucios => señales sucias. Revisa siempre antes de entrenar.',
  },
  {
    def: { id: 4, part: 'Ciencia de Datos', title: 'Anatomía de un dataset de torneo', subtitle: 'Cómo se ve el archivo real que recibirás', kind: 'lesson', xp: 130 },
    intro: 'En un torneo recibes un CSV con columnas OHLCV y, lo más importante, las columnas de PREDICCIÓN que debes llenar. Las ves hoy.',
    sections: [
      { heading: 'El formato del torneo', body: 'Recibes fecha, open, high, low, close, volume… y un espacio para tu predicción: "target" (precio futuro) o "direction" (1=sube, -1=baja, 0=plano).' },
      { heading: 'Direction vs Target', body: 'Predecir dirección (sube/baja) es más fácil y estable que predecir el precio exacto. Por eso los torneos suelen pedir direction.' },
      { heading: 'Tu entrega', body: 'Llenas la columna de predicción fila por fila (o con tu estrategia). Quien acierte más dirección, gana QP.' },
    ],
    exercise: { kind: 'read', datasetId: 'tournament-sample', readTask: { prompt: 'En el dataset de ejemplo del torneo, identifica la columna que tú debes completar con tu predicción (direction).', answerCol: 'direction', outlierRow: undefined, hint: 'Busca la columna que el torneo espera que llenes: suele llamarse "direction" o "target".' } },
    takeaway: 'El torneo no es adivinar: es llenar una columna de predicción con un método. Hoy viste cómo.',
  },

  // ===== PARTE 2 — MACHINE LEARNING =====
  {
    def: { id: 5, part: 'Machine Learning', title: 'Patrones vs ruido', subtitle: 'Medias móviles: tu primer modelo', kind: 'lesson', xp: 150 },
    intro: 'El mercado tiene señal y ruido. Una media móvil suaviza el ruido y deja ver la tendencia. Tu primer "modelo".',
    sections: [
      { heading: 'Media móvil', body: 'Promedio de los últimos N cierres. Suaviza el día a día y revela la dirección dominante.' },
      { heading: 'Cruce', body: 'Cuando la media rápida pasa por encima de la lenta ⇒ tendencia al alza. Debajo ⇒ a la baja. Eso es tu señal.' },
      { heading: 'No es magia', body: 'La media solo resume el pasado. Si el pasado deja de parecerse al futuro, la señal falla. Por eso medimos.' },
    ],
    exercise: { kind: 'strategy', templateId: 'ma_cross' },
    takeaway: 'Toda estrategia es una regla sobre el pasado. La media móvil es la más vieja y aún útil.',
  },
  {
    def: { id: 6, part: 'Machine Learning', title: 'Tu primera predicción', subtitle: 'Adivina mañana antes de verlo', kind: 'lesson', xp: 150 },
    intro: 'Cierra los ojos (no, cierra el futuro): mira las últimas velas y declara si mañana sube o baja. Luego lo compruebas.',
    sections: [
      { heading: 'Predecir dirección', body: 'El ejercicio: ves N cierres, declaras dirección del siguiente. Es exactamente lo que harás en el torneo.' },
      { heading: 'Sé honesto contigo', body: 'Anota tu predicción ANTES de revelar. Si adivinas después, no estás aprendiendo, estás haciendo trampa a tu ego.' },
      { heading: 'La base del torneo', body: 'El torneo premia aciertos de dirección. Lo que practicas aquí es el deporte olímpico de QuantLab.' },
    ],
    exercise: { kind: 'predict', predictTask: { seriesId: 'btc-daily', prompt: 'Mirando las últimas 8 velas de BTC, ¿crees que la próxima cierra MÁS ALTA o MÁS BAJA que la última?', revealNote: 'La dirección real se compara con tu predicción. Acertar dirección consistentemente es lo que premia el leaderboard del torneo.' } },
    takeaway: 'Predecir dirección es el núcleo del torneo. Si lo haces bien aquí, ya tienes oficio.',
  },
  {
    def: { id: 7, part: 'Machine Learning', title: 'Overfit: la trampa', subtitle: 'Por qué tu estrategia "perfecta" engaña', kind: 'lesson', xp: 150 },
    intro: 'Memorizar el pasado parece ganar siempre. Hasta que usas datos nuevos. Bienvenido al overfit.',
    sections: [
      { heading: 'Memorizar ≠ aprender', body: 'Si ajustas parámetros hasta que el backtest es perfecto, probablemente memorizaste ruido. No generalizas.' },
      { heading: 'Muestra dentro vs fuera', body: 'Entrenas en una parte (in-sample) y pruebas en otra que nunca viste (out-of-sample). Si ahí falla, está sobreajustado.' },
      { heading: 'Señal de alerta', body: 'Retorno gigante y curvita perfecta en el backtest = casi siempre overfit. Desconfía.' },
    ],
    exercise: { kind: 'backtest', templateId: 'ma_cross' },
    takeaway: 'Lo que importa no es el backtest bonito, sino cómo se porta en datos que no viste.',
  },
  {
    def: { id: 8, part: 'Machine Learning', title: 'Métricas que no mienten', subtitle: 'Lee los resultados como un pro', kind: 'lesson', xp: 150 },
    intro: 'Sharpe, drawdown, winrate. Tres números que separan a quien entiende de quien se engaña.',
    sections: [
      { heading: 'Sharpe', body: 'Retorno por unidad de riesgo. >1 está bien, >2 muy bien. Premia consistencia, no un solo golpe de suerte.' },
      { heading: 'Drawdown', body: 'La caída máxima desde un pico. Tu peor racha. Si no podrías soportarla, la estrategia es muy grande para ti.' },
      { heading: 'Winrate', body: '% de operaciones ganadoras. Alto no implica rentable: si pierdes mucho en pocas, igual sangras.' },
    ],
    exercise: { kind: 'quiz', quiz: [
      { q: '¿Qué significa un Sharpe alto?', options: ['Retorno alto sin importar riesgo', 'Buen retorno por unidad de riesgo', 'Cero pérdidas', 'Muchas operaciones'], answer: 1, explain: 'Sharpe = retorno / volatilidad. Premia hacerlo sin volatilidad loca.' },
      { q: 'El drawdown es…', options: ['El retorno total', 'La caída máxima desde un pico', 'La comisión', 'El winrate'], answer: 1, explain: 'Es tu peor racha; dice cuánto dolor tolera la estrategia.' },
      { q: 'Winrate alto garantiza ganar dinero?', options: ['Sí siempre', 'No, si las pérdidas son grandes', 'Solo en cripto'], answer: 1, explain: 'Unas pocas pérdidas grandes pueden comerse muchas ganancias pequeñas.' },
    ] },
    takeaway: 'Lee Sharpe, drawdown y winrate juntos. Ninguno solo cuenta la historia.',
  },

  // ===== PARTE 3 — FINANZAS =====
  {
    def: { id: 9, part: 'Finanzas', title: 'Retornos, capital y riesgo', subtitle: 'El lenguaje de las finanzas', kind: 'lesson', xp: 150 },
    intro: 'No hablamos de "subió 5 dólares". Hablamos de % y de cuánto de tu capital estabas arriesgando. Ese es el salto a finanzas.',
    sections: [
      { heading: 'Retorno %', body: 'Importa el porcentaje, no el absoluto. Subir $5 en un activo de $10 es +50%; en uno de $5000 es nada.' },
      { heading: 'Riesgo por operación', body: 'Profesionales arriesgan 1–2% de su capital por trade. Así, 10 pérdidas seguidas no te borran.' },
      { heading: 'Capital', body: 'Tu capital define el tamaño. Mismo porcentaje de riesgo, distinto tamaño absoluto.' },
    ],
    exercise: { kind: 'quiz', quiz: [
      { q: '¿Por qué importa el retorno en % y no en $?', options: ['Porque suena pro', 'Porque compara activos de distinto precio', 'Porque el dólar sube'], answer: 1, explain: 'El % normaliza: te dice la magnitud relativa, no el número absoluto.' },
      { q: 'Arriesgar 1% por trade significa…', options: ['Perder 1% de tu capital si falla', 'Ganar 1% siempre', 'Operar 1 vez al mes'], answer: 0, explain: 'Limitas el daño de una operación mala al 1% de tu cuenta.' },
    ] },
    takeaway: 'Finanzas = hablar en %, no en $. El tamaño lo dicta tu capital y tu tolerancia.',
  },
  {
    def: { id: 10, part: 'Finanzas', title: 'Costos que se comen tu ganancia', subtitle: 'Comisiones, slippage y benchmark', kind: 'lesson', xp: 150 },
    intro: 'Una estrategia "ganadora" en papel puede perder en la vida real por los costos. Los ves hoy.',
    sections: [
      { heading: 'Comisiones', body: 'Cada entrada y salida paga. Con muchas operaciones, se acumulan y devoran el margen.' },
      { heading: 'Slippage', body: 'El precio real de ejecución rara vez es el que viste. Ese pequeño desliz es costo real.' },
      { heading: 'Benchmark', body: '¿Ganaste 2%? El mercado subió 5%. Entonces perdiste oportunidad. Compara siempre.' },
    ],
    exercise: { kind: 'quiz', quiz: [
      { q: 'El slippage es…', options: ['La comisión del exchange', 'La diferencia entre precio visto y ejecutado', 'El impuesto'], answer: 1, explain: 'Es el desliz entre lo que creíste y lo que pagaste.' },
      { q: 'Un benchmark sirve para…', options: ['Pagar menos', 'Comparar tu retorno contra el mercado', 'Subir el Sharpe'], answer: 1, explain: 'Si el mercado gana más, tu estrategia no aportó valor.' },
    ] },
    takeaway: 'Gana en papel no cuenta. Resta comisiones, slippage y compara con el benchmark.',
  },

  // ===== PARTE 4 — TRADING =====
  {
    def: { id: 11, part: 'Trading', title: 'Tu primera señal de trading', subtitle: 'Cruce de medias en vivo', kind: 'lesson', xp: 200 },
    intro: 'Junta todo: una señal real (cruce de medias), tú mueves los parámetros y ves la operación nacer.',
    sections: [
      { heading: 'La señal', body: 'Media rápida cruza a la lenta ⇒ entras largo; al revés ⇒ corto. Simples, claras, ejecutables.' },
      { heading: 'Tus parámetros', body: 'Los sliders son tus decisiones de diseño. Cada valor cambia cuánto opera y cuánto ruido filtra.' },
      { heading: 'De regla a estrategia', body: 'Una señal + gestión de riesgo = estrategia. Lo que llevarás al torneo.' },
    ],
    exercise: { kind: 'strategy', templateId: 'ma_cross' },
    takeaway: 'Una señal no es una estrategia hasta que le pones gestión de riesgo.',
  },
  {
    def: { id: 12, part: 'Trading', title: 'Backtest real de tu señal', subtitle: 'Muestra-in vs muestra-out', kind: 'lesson', xp: 200 },
    intro: 'Pon a prueba tu señal contra datos que no viste. Si aguanta fuera de muestra, tiene algo.',
    sections: [
      { heading: 'Dos mitades', body: 'Ajustas en la primera mitad (in-sample) y validas en la segunda (out-of-sample). La segunda es la prueba de fuego.' },
      { heading: 'Compara curvas', body: 'Si la curva fuera es plana o negativa mientras la de dentro brilla, hay overfit.' },
      { heading: 'Decide con humildad', body: 'Una señal mediocre honesta vence a una "perfecta" mentirosa.' },
    ],
    exercise: { kind: 'backtest', templateId: 'ma_cross' },
    takeaway: 'El backtest fuera de muestra es tu único amigo honesto.',
  },
  {
    def: { id: 13, part: 'Trading', title: 'Cómo se evalúan tus predicciones', subtitle: 'La métrica del leaderboard del torneo', kind: 'lesson', xp: 200 },
    intro: 'Entender cómo te puntúan es medio camino para ganar. Hoy predices y ves la métrica exacta que usa el torneo.',
    sections: [
      { heading: 'Acierto de dirección', body: 'El torneo cuenta cuántas veces acertaste la dirección (sube/baja). No el precio exacto, solo el sentido.' },
      { heading: 'Leaderboard', body: 'Tu puntaje se rankea contra la comunidad. Arriba = más QP. Por eso practicar dirección importa.' },
      { heading: 'Consistencia > suerte', body: 'Una predicción afortunada no te sube. 60% de acierto sostenido, sí.' },
    ],
    exercise: { kind: 'predict', predictTask: { seriesId: 'eth-daily', prompt: 'Con las últimas 8 velas de ETH, declara la dirección de la próxima (▲ sube / ▼ baja). Luego verás tu acierto.', revealNote: 'Esta es la misma métrica del leaderboard: aciertos de dirección sobre el total. Consistente > suerte.' } },
    takeaway: 'Te evalúan por acierto de dirección. Lo que entrenaste en el Módulo 6 y 13 es el deporte del torneo.',
  },
  {
    def: { id: 14, part: 'Trading', title: '🏆 Tu debut', subtitle: 'El torneo real de la comunidad', kind: 'tournament', xp: 300 },
    intro: 'Llegaste. Tu estrategia del Módulo 11/12 está precargada. Entra al torneo real y compite por QP con la comunidad.',
    sections: [
      { heading: 'Sin clic, sin copiar', body: 'La estrategia que construiste ya viajó hasta aquí. Solo confirma y entras.' },
      { heading: 'Qué ganas', body: 'Por completar el curso: +10 QP. Por competir bien en el torneo: más QP del leaderboard.' },
      { heading: 'No es el final', body: 'Es el comienzo: ahora puedes crear estrategias propias en el Dashboard y entrar a más torneos.' },
    ],
    exercise: { kind: 'backtest', templateId: 'ma_cross' },
    takeaway: 'Curso completo = Aprendiz Cuant. Ahora el mundo real: torneos, Dashboard, comunidad.',
  },
];

const PART_ORDER: Part[] = ['Ciencia de Datos', 'Machine Learning', 'Finanzas', 'Trading'];

export function modulesByPart() {
  return PART_ORDER.map((part) => ({
    part,
    mods: modules.filter((m) => m.def.part === part),
  })).filter((g) => g.mods.length > 0);
}

export function getModule(id: number) {
  return modules.find((m) => m.def.id === id);
}

export function totalXp() {
  return modules.reduce((sum, m) => sum + m.def.xp, 0);
}
