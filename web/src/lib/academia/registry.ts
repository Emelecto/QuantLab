// Academia · registry multi-curso (C1 Fundamentos + C2 Python para Trading + C3 Matemáticas Cuantitativas + C4 Risk Management + C5 ML para Mercados + C6 Torneos y Trading Real).
// Fuente de verdad en web/content/cursos/<slug>/meta.json + MDX.
// Los QP son virtuales (progreso pedagógico, no dinero).
// Compat C1: mismas URLs /app/academia/fundamentos/N, mismos ids c1-lN,
// getCourse() sin slug → fundamentos, getLesson(n) numérico → C1 primero.
// C6 incluye examen final (c6-examen, lección 10): otorga 7 QP con ≥70% (14/20).

import fs from 'fs';
import path from 'path';

export interface AcademiaCourseMeta {
  slug: string;
  titulo: string;
  nivel: string;
  orden: number;
  gate_qp: number;
  total_qp: number;
}

export interface AcademiaLessonMeta {
  id: string; // p. ej. "c1-l1" | "c2-l1" | "c3-l1" | "c4-l1" | "c5-l1" | "c6-l1" | "c6-examen"
  curso: string; // slug del curso, p. ej. "fundamentos" | "python" | "mates" | "riesgo" | "ml" | "torneos"
  leccion: number; // 1..7 en C1, 1..9 en C2 y C5, 1..8 en C3 y C4, 1..10 en C6 (10 = examen)
  titulo: string;
  tipo: 'lesson' | 'exam'; // 'exam' solo en c6-examen: aprueba con ≥70% en vez de N/N
  xp: number;
  qp: number; // 1 en C1, 2 en C2, C3, C4, C5 y lecciones C6; 7 en el examen C6
  duracion_video_min: number;
  file: string; // ruta del MDX relativa a web/content/cursos/<slug>
  draft?: boolean;
}

export const COURSES: AcademiaCourseMeta[] = [
  { slug: 'fundamentos', titulo: 'Fundamentos Cuantitativos', nivel: 'Principiante', orden: 1, gate_qp: 0, total_qp: 7 },
  { slug: 'python', titulo: 'Python para Trading', nivel: 'Principiante', orden: 2, gate_qp: 5, total_qp: 18 },
  { slug: 'mates', titulo: 'Matemáticas Cuantitativas', nivel: 'Intermedio', orden: 3, gate_qp: 18, total_qp: 16 },
  { slug: 'riesgo', titulo: 'Risk Management', nivel: 'Intermedio', orden: 4, gate_qp: 30, total_qp: 16 },
  { slug: 'ml', titulo: 'ML para Mercados', nivel: 'Avanzado', orden: 5, gate_qp: 42, total_qp: 18 },
  { slug: 'torneos', titulo: 'Torneos y Trading Real', nivel: 'Avanzado', orden: 6, gate_qp: 55, total_qp: 25 },
];

/** Alias histórico del piloto C1 (compat: getCourse() sin slug lo devuelve). */
export const COURSE: AcademiaCourseMeta = COURSES[0];

export const LESSONS: AcademiaLessonMeta[] = [
  // ---- C1 · Fundamentos Cuantitativos (7 lecciones, qp 1) ----
  { id: 'c1-l1', curso: 'fundamentos', leccion: 1, titulo: 'Edge y expectativa: el único juego que importa', tipo: 'lesson', xp: 100, qp: 1, duracion_video_min: 4, file: '01-edge-expectativa.mdx' },
  { id: 'c1-l2', curso: 'fundamentos', leccion: 2, titulo: 'Retornos simples y logarítmicos', tipo: 'lesson', xp: 100, qp: 1, duracion_video_min: 4, file: '02-retornos-log.mdx' },
  { id: 'c1-l3', curso: 'fundamentos', leccion: 3, titulo: 'Volatilidad y colas: lo normal no es normal', tipo: 'lesson', xp: 150, qp: 1, duracion_video_min: 4, file: '03-volatilidad-colas.mdx' },
  { id: 'c1-l4', curso: 'fundamentos', leccion: 4, titulo: 'Sharpe, Sortino y drawdown: mide el camino, no solo la meta', tipo: 'lesson', xp: 150, qp: 1, duracion_video_min: 4, file: '04-sharpe-sortino-drawdown.mdx' },
  { id: 'c1-l5', curso: 'fundamentos', leccion: 5, titulo: 'Correlación y beta: con quién se mueve tu moneda', tipo: 'lesson', xp: 150, qp: 1, duracion_video_min: 4, file: '05-correlacion-beta.mdx' },
  { id: 'c1-l6', curso: 'fundamentos', leccion: 6, titulo: 'Sesgos y overfitting: la auditoría de las 20 variantes', tipo: 'lesson', xp: 150, qp: 1, duracion_video_min: 4, file: '06-sesgos-overfitting.mdx' },
  { id: 'c1-l7', curso: 'fundamentos', leccion: 7, titulo: 'Proyecto: tu ficha de BTC en una página', tipo: 'lesson', xp: 200, qp: 1, duracion_video_min: 3, file: '07-proyecto-ficha-btc.mdx' },
  // ---- C2 · Python para Trading (9 lecciones, qp 2) ----
  { id: 'c2-l1', curso: 'python', leccion: 1, titulo: 'Tu laboratorio: venv, Jupyter y pandas', tipo: 'lesson', xp: 100, qp: 2, duracion_video_min: 4, file: '01-venv-jupyter-pandas.mdx' },
  { id: 'c2-l2', curso: 'python', leccion: 2, titulo: 'Datos sucios, decisiones sucias: limpieza, gaps y resample', tipo: 'lesson', xp: 110, qp: 2, duracion_video_min: 5, file: '02-limpieza-gaps-resample.mdx' },
  { id: 'c2-l3', curso: 'python', leccion: 3, titulo: 'Piensa en vectores: NumPy y cálculo sin bucles', tipo: 'lesson', xp: 110, qp: 2, duracion_video_min: 4, file: '03-numpy-vectorizado.mdx' },
  { id: 'c2-l4', curso: 'python', leccion: 4, titulo: 'Gráficos que duelen: matplotlib, plotly y el underwater', tipo: 'lesson', xp: 100, qp: 2, duracion_video_min: 4, file: '04-graficos-underwater.mdx' },
  { id: 'c2-l5', curso: 'python', leccion: 5, titulo: 'Datos reales: tu primer cliente de Binance (klines demo)', tipo: 'lesson', xp: 130, qp: 2, duracion_video_min: 5, file: '05-binance-klines.mdx' },
  { id: 'c2-l6', curso: 'python', leccion: 6, titulo: 'Backtest SMA con costos: el neto manda', tipo: 'lesson', xp: 150, qp: 2, duracion_video_min: 4, file: '06-backtest-sma-costos.mdx' },
  { id: 'c2-l7', curso: 'python', leccion: 7, titulo: 'Walk-forward: seis exámenes, una sola robusta', tipo: 'lesson', xp: 140, qp: 2, duracion_video_min: 4, file: '07-walk-forward.mdx' },
  { id: 'c2-l8', curso: 'python', leccion: 8, titulo: 'Grid search y sizing: Kelly pide locuras', tipo: 'lesson', xp: 140, qp: 2, duracion_video_min: 4, file: '08-grid-sizing.mdx' },
  { id: 'c2-l9', curso: 'python', leccion: 9, titulo: 'Proyecto: pipeline end-to-end que dice que no', tipo: 'lesson', xp: 180, qp: 2, duracion_video_min: 5, file: '09-proyecto-pipeline.mdx' },
  // ---- C3 · Matemáticas Cuantitativas (8 lecciones, qp 2) ----
  { id: 'c3-l1', curso: 'mates', leccion: 1, titulo: 'Probabilidad, Bayes y valor esperado', tipo: 'lesson', xp: 100, qp: 2, duracion_video_min: 4, file: '01-probabilidad-bayes-ev.mdx' },
  { id: 'c3-l2', curso: 'mates', leccion: 2, titulo: 'Media vs mediana: describe sin que te engañen', tipo: 'lesson', xp: 100, qp: 2, duracion_video_min: 4, file: '02-media-mediana-descriptiva.mdx' },
  { id: 'c3-l3', curso: 'mates', leccion: 3, titulo: 'Log-retornos con BNB: el retorno que se suma', tipo: 'lesson', xp: 120, qp: 2, duracion_video_min: 5, file: '03-log-retornos-bnb.mdx' },
  { id: 'c3-l4', curso: 'mates', leccion: 4, titulo: 'Volatilidad y ATR: stops con criterio', tipo: 'lesson', xp: 120, qp: 2, duracion_video_min: 5, file: '04-volatilidad-atr-stops.mdx' },
  { id: 'c3-l5', curso: 'mates', leccion: 5, titulo: 'Correlación y diversificación: que no se caigan juntas', tipo: 'lesson', xp: 100, qp: 2, duracion_video_min: 4, file: '05-correlacion-diversificacion.mdx' },
  { id: 'c3-l6', curso: 'mates', leccion: 6, titulo: 'Sharpe y Sortino: retorno por unidad de susto', tipo: 'lesson', xp: 130, qp: 2, duracion_video_min: 4, file: '06-sharpe-sortino.mdx' },
  { id: 'c3-l7', curso: 'mates', leccion: 7, titulo: 'Overfitting y validación fuera de muestra: el examen real', tipo: 'lesson', xp: 130, qp: 2, duracion_video_min: 5, file: '07-overfitting-oos.mdx' },
  { id: 'c3-l8', curso: 'mates', leccion: 8, titulo: 'Inferencia: ¿tu ganancia es real o suerte? (p-valor)', tipo: 'lesson', xp: 120, qp: 2, duracion_video_min: 4, file: '08-inferencia-p-valor.mdx' },
  // ---- C4 · Risk Management (8 lecciones, qp 2) ----
  { id: 'c4-l1', curso: 'riesgo', leccion: 1, titulo: 'Position sizing: arriesga el 1%, no el corazón', tipo: 'lesson', xp: 120, qp: 2, duracion_video_min: 5, file: '01-sizing-posicion.mdx' },
  { id: 'c4-l2', curso: 'riesgo', leccion: 2, titulo: 'Stop-loss y take-profit OCO: el trade que se gestiona solo', tipo: 'lesson', xp: 120, qp: 2, duracion_video_min: 5, file: '02-sl-tp-oco.mdx' },
  { id: 'c4-l3', curso: 'riesgo', leccion: 3, titulo: 'Drawdown y Monte Carlo: mide tu peor racha antes de vivirla', tipo: 'lesson', xp: 130, qp: 2, duracion_video_min: 5, file: '03-drawdown-montecarlo.mdx' },
  { id: 'c4-l4', curso: 'riesgo', leccion: 4, titulo: 'VaR: cuánto puedes perder mañana (con 95% de confianza)', tipo: 'lesson', xp: 130, qp: 2, duracion_video_min: 5, file: '04-var.mdx' },
  { id: 'c4-l5', curso: 'riesgo', leccion: 5, titulo: 'Futuros 2x en isolated: duplica todo, liquida rápido', tipo: 'lesson', xp: 140, qp: 2, duracion_video_min: 5, file: '05-futuros-2x-isolated.mdx' },
  { id: 'c4-l6', curso: 'riesgo', leccion: 6, titulo: 'Psicología anti-tilt: tu peor enemigo opera contigo', tipo: 'lesson', xp: 100, qp: 2, duracion_video_min: 3, file: '06-psicologia-anti-tilt.mdx' },
  { id: 'c4-l7', curso: 'riesgo', leccion: 7, titulo: 'Plan auditable: si no está escrito, no existe', tipo: 'lesson', xp: 120, qp: 2, duracion_video_min: 4, file: '07-plan-auditable.mdx' },
  { id: 'c4-l8', curso: 'riesgo', leccion: 8, titulo: 'Diario y kill-switch: el freno que te salva del mes rojo', tipo: 'lesson', xp: 130, qp: 2, duracion_video_min: 4, file: '08-diario-kill-switch.mdx' },
  // ---- C5 · ML para Mercados (9 lecciones, qp 2) ----
  { id: 'c5-l1', curso: 'ml', leccion: 1, titulo: 'Features sin leakage', tipo: 'lesson', xp: 100, qp: 2, duracion_video_min: 4, file: '01-features-sin-leakage.mdx' },
  { id: 'c5-l2', curso: 'ml', leccion: 2, titulo: 'Etiquetado y embargo', tipo: 'lesson', xp: 100, qp: 2, duracion_video_min: 4, file: '02-etiquetado-embargo.mdx' },
  { id: 'c5-l3', curso: 'ml', leccion: 3, titulo: 'Validación walk-forward', tipo: 'lesson', xp: 120, qp: 2, duracion_video_min: 5, file: '03-walk-forward.mdx' },
  { id: 'c5-l4', curso: 'ml', leccion: 4, titulo: 'Ridge vs LightGBM', tipo: 'lesson', xp: 120, qp: 2, duracion_video_min: 5, file: '04-ridge-vs-lightgbm.mdx' },
  { id: 'c5-l5', curso: 'ml', leccion: 5, titulo: 'MLP vs LSTM', tipo: 'lesson', xp: 130, qp: 2, duracion_video_min: 5, file: '05-mlp-vs-lstm.mdx' },
  { id: 'c5-l6', curso: 'ml', leccion: 6, titulo: 'Stacking con OOF', tipo: 'lesson', xp: 130, qp: 2, duracion_video_min: 5, file: '06-stacking-oof.mdx' },
  { id: 'c5-l7', curso: 'ml', leccion: 7, titulo: 'Costos: 2 bps + slippage', tipo: 'lesson', xp: 120, qp: 2, duracion_video_min: 4, file: '07-costos-slippage.mdx' },
  { id: 'c5-l8', curso: 'ml', leccion: 8, titulo: 'Deployment: predict_demo.py', tipo: 'lesson', xp: 120, qp: 2, duracion_video_min: 4, file: '08-deployment-predict.mdx' },
  { id: 'c5-l9', curso: 'ml', leccion: 9, titulo: 'Monitoreo: IC y drift', tipo: 'lesson', xp: 120, qp: 2, duracion_video_min: 5, file: '09-monitoreo-ic-drift.mdx' },
  // ---- C6 · Torneos y Trading Real (9 lecciones qp 2 + examen qp 7 con ≥70%) ----
  { id: 'c6-l1', curso: 'torneos', leccion: 1, titulo: 'Reglas, eras y submission', tipo: 'lesson', xp: 100, qp: 2, duracion_video_min: 4, file: '01-reglas-eras-submission.mdx' },
  { id: 'c6-l2', curso: 'torneos', leccion: 2, titulo: 'Spearman y MMC', tipo: 'lesson', xp: 120, qp: 2, duracion_video_min: 4, file: '02-spearman-mmc.mdx' },
  { id: 'c6-l3', curso: 'torneos', leccion: 3, titulo: 'Estrategia neutral a beta', tipo: 'lesson', xp: 120, qp: 2, duracion_video_min: 4, file: '03-neutral-beta.mdx' },
  { id: 'c6-l4', curso: 'torneos', leccion: 4, titulo: 'Kelly y stake', tipo: 'lesson', xp: 120, qp: 2, duracion_video_min: 4, file: '04-kelly-stake.mdx' },
  { id: 'c6-l5', curso: 'torneos', leccion: 5, titulo: 'Testnet demo antes de stake', tipo: 'lesson', xp: 130, qp: 2, duracion_video_min: 5, file: '05-testnet-demo.mdx' },
  { id: 'c6-l6', curso: 'torneos', leccion: 6, titulo: 'Bitácora de trades: el diario que te hace profesional', tipo: 'lesson', xp: 100, qp: 2, duracion_video_min: 4, file: '06-bitacora-trades.mdx' },
  { id: 'c6-l7', curso: 'torneos', leccion: 7, titulo: 'Post-mortem de torneo: pierde bien para ganar después', tipo: 'lesson', xp: 110, qp: 2, duracion_video_min: 5, file: '07-post-mortem-torneo.mdx' },
  { id: 'c6-l8', curso: 'torneos', leccion: 8, titulo: 'Ética y kill-switch: juega limpio y sobrevive', tipo: 'lesson', xp: 100, qp: 2, duracion_video_min: 4, file: '08-etica-kill-switch.mdx' },
  { id: 'c6-l9', curso: 'torneos', leccion: 9, titulo: 'Checklist go-live: 60 trades antes de arriesgar', tipo: 'lesson', xp: 110, qp: 2, duracion_video_min: 5, file: '09-checklist-go-live.mdx' },
  { id: 'c6-examen', curso: 'torneos', leccion: 10, titulo: 'Examen final: Quant de torneos verificado', tipo: 'exam', xp: 300, qp: 7, duracion_video_min: 5, file: 'examen.mdx' },
];

/** Cursos ordenados por `orden` (hub). */
export function getCourses(): AcademiaCourseMeta[] {
  return [...COURSES].sort((a, b) => a.orden - b.orden);
}

export function getCourse(slug?: string): AcademiaCourseMeta {
  if (!slug) return COURSES[0]; // compat piloto C1
  return COURSES.find((c) => c.slug === slug) ?? COURSES[0];
}

/** Lecciones publicadas de un curso. */
export function getCourseLessons(slug: string): AcademiaLessonMeta[] {
  return LESSONS.filter((l) => l.curso === slug && !l.draft);
}

export function getLesson(id: string | number): AcademiaLessonMeta | undefined;
export function getLesson(curso: string, leccion: number): AcademiaLessonMeta | undefined;
export function getLesson(a: string | number, b?: number): AcademiaLessonMeta | undefined {
  if (typeof b === 'number') return LESSONS.find((l) => l.curso === a && l.leccion === b);
  if (typeof a === 'number') return LESSONS.find((l) => l.leccion === a); // C1 primero (compat)
  return LESSONS.find((l) => l.id === a);
}

/**
 * QP totales (virtuales). Sin `curso` suma todos los cursos;
 * con slug, solo ese. C1 = 7, C2 = 18, C3 = 16, C4 = 16, C5 = 18, C6 = 25 (total 100).
 */
export function totalQP(curso?: string): number {
  const list = curso ? LESSONS.filter((l) => l.curso === curso) : LESSONS;
  return list.reduce((acc, l) => acc + l.qp, 0);
}

/** Gate check: ¿puede el usuario entrar al curso con sus QP acumulados? */
export function gateCheck(userQP: number, curso?: string): { unlocked: boolean; missing: number } {
  const course = getCourse(curso);
  const missing = Math.max(0, course.gate_qp - userQP);
  return { unlocked: missing === 0, missing };
}

/** QP otorgados por completar una lección (0 si no existe o es draft sin contenido). */
export function lessonQP(id: string): number {
  const lesson = getLesson(id);
  if (!lesson || lesson.draft) return 0;
  return lesson.qp;
}

/** Bonus +1 QP si el curso se completa todo-perfecto (cada quiz en N/N; el examen C6 cuenta como perfecto con ≥70%). */
export const PERFECT_BONUS_QP = 1;

/** Umbral de aprobado del examen final (fracción: 0.7 = 14/20). Las lecciones exigen N/N (1.0). */
export const EXAM_PASS_RATE = 0.7;

/** Aciertos mínimos para llevarse los QP: N/N en lecciones, ≥70% en exámenes. */
export function requiredScore(total: number, tipo: 'lesson' | 'exam'): number {
  return tipo === 'exam' ? Math.ceil(total * EXAM_PASS_RATE) : total;
}

export function coursePerfectBonus(allPerfect: boolean): number {
  return allPerfect ? PERFECT_BONUS_QP : 0;
}

// ---- Capa de lectura en disco (solo servidor) ----
// Lee meta.json + frontmatter de los MDX vía fs. Las rutas los consumen;
// los componentes cliente reciben datos ya resueltos por props.

const CONTENT_ROOT = path.join(process.cwd(), 'content', 'cursos');

function contentDirFor(curso: string): string {
  return path.join(CONTENT_ROOT, curso);
}

export interface AcademiaQuizQuestion {
  q: string;
  options: string[];
  answer: number;
  explain: string;
}

export interface AcademiaQuiz {
  id: string;
  questions: AcademiaQuizQuestion[];
}

/** MDX crudo de una lección (con frontmatter) o null si no existe. */
export function getLessonSource(id: string): string | null {
  const lesson = getLesson(id);
  if (!lesson) return null;
  const filePath = path.join(contentDirFor(lesson.curso), lesson.file);
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf-8');
}

/** Cuerpo del MDX sin frontmatter, convertido a HTML (SVG inline intacto). */
export async function getLessonHtml(id: string): Promise<string | null> {
  const source = getLessonSource(id);
  if (source == null) return null;
  const body = stripFrontmatter(source);
  const { remark } = await import('remark');
  const { default: html } = await import('remark-html');
  // sanitize:false preserva el <svg> inline de los bloques "## Visual:…".
  const result = await remark().use(html, { sanitize: false }).process(body);
  return enhanceLessonHtml(result.toString());
}

// ---- Post-procesado del HTML del lector (servidor, string replace) ----
// Añade ids slug a los h2, envuelve callouts y figuras con las clases
// .academia-* y deja el TOC listo para extraer. No toca el MDX.

function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/ñ/g, 'n')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

function stripTags(s: string): string {
  return s.replace(/<[^>]*>/g, '').trim();
}

const CALLOUT_CLASS: Record<string, string> = {
  'objetivo': 'academia-callout--objetivo',
  'tl;dr': 'academia-callout--tldr',
  'error común': 'academia-callout--error',
  'checklist': 'academia-callout--checklist',
  'practica': 'academia-callout--practica',
  'práctica': 'academia-callout--practica',
};

function calloutKey(title: string): string | null {
  const k = stripTags(title).toLowerCase();
  return CALLOUT_CLASS[k] ?? null;
}

/** Aplica ids slug, callouts, figuras y checkboxes sobre el HTML de remark. */
export function enhanceLessonHtml(raw: string): string {
  // 1) ids en cada h2.
  let html = raw.replace(/<h2>([\s\S]*?)<\/h2>/g, (_m, title: string) => {
    return `<h2 id="${slugifyHeading(stripTags(title))}">${title}</h2>`;
  });

  // 2) "## Visual: título" + párrafo + <svg> → <figure class="academia-figure">.
  html = html.replace(
    /<h2 id="([^"]+)">Visual:\s*([\s\S]*?)<\/h2>\s*(?:<p>([\s\S]*?)<\/p>)?\s*(<svg[\s\S]*?<\/svg>)/g,
    (_m, id: string, title: string, desc: string | undefined, svg: string) => {
      const caption = desc
        ? `<figcaption><strong>${stripTags(title)}.</strong> ${stripTags(desc)}</figcaption>`
        : `<figcaption>${stripTags(title)}</figcaption>`;
      const dataTitle = stripTags(title).replace(/"/g, '&quot;');
      return `<figure class="academia-figure" id="${id}" data-title="${dataTitle}">${svg}${caption}</figure>`;
    },
  );

  // 3) h2 especiales + su contenido hasta el próximo h2/figure → callout.
  html = html.replace(
    /<h2 id="([^"]+)">([\s\S]*?)<\/h2>([\s\S]*?)(?=<h2|<figure|$)/g,
    (m, id: string, title: string, body: string) => {
      const cls = calloutKey(title);
      if (!cls) return m;
      let inner = body;
      if (cls === 'academia-callout--checklist') {
        inner = inner.replace(
          /<li>\[\s*\]\s*([\s\S]*?)<\/li>/g,
          '<li class="academia-check-item"><input type="checkbox" /> <span>$1</span></li>',
        );
      }
      return `<div class="academia-callout ${cls}"><h2 id="${id}">${title}</h2>${inner}</div>`;
    },
  );

  return html;
}

export interface AcademiaTocEntry {
  id: string;
  title: string;
}

/** TOC a partir del HTML ya mejorado: h2 normales + figuras, en orden. */
export function getLessonToc(html: string): AcademiaTocEntry[] {
  const entries: { index: number; id: string; title: string }[] = [];
  const h2 = /<h2 id="([^"]+)">([\s\S]*?)<\/h2>/g;
  let m: RegExpExecArray | null;
  while ((m = h2.exec(html)) !== null) {
    if (m.index == null) continue;
    const title = stripTags(m[2]);
    if (calloutKey(title)) continue; // callouts fuera del TOC
    entries.push({ index: m.index, id: m[1], title });
  }
  const fig = /<figure class="academia-figure" id="([^"]+)" data-title="([^"]*)">/g;
  while ((m = fig.exec(html)) !== null) {
    if (m.index == null) continue;
    entries.push({ index: m.index, id: m[1], title: `Visual: ${m[2]}` });
  }
  return entries.sort((a, b) => a.index - b.index).map(({ id, title }) => ({ id, title }));
}

/** Quiz de la lección (N preguntas; C1: c1_lN.json … C6: c6_lN.json; examen C6: c6_examen.json, 20 preguntas). */
export function getLessonQuiz(id: string): AcademiaQuiz | null {
  const lesson = getLesson(id);
  if (!lesson) return null;
  const prefix =
    lesson.curso === 'python' ? 'c2'
    : lesson.curso === 'mates' ? 'c3'
    : lesson.curso === 'riesgo' ? 'c4'
    : lesson.curso === 'ml' ? 'c5'
    : lesson.curso === 'torneos' ? 'c6'
    : 'c1';
  const quizFile = lesson.tipo === 'exam' ? `${prefix}_examen.json` : `${prefix}_l${lesson.leccion}.json`;
  const filePath = path.join(contentDirFor(lesson.curso), 'quizzes', quizFile);
  if (!fs.existsSync(filePath)) return null;
  try {
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as {
      id?: string;
      questions?: AcademiaQuizQuestion[];
    };
    if (!Array.isArray(raw.questions)) return null;
    return { id: raw.id ?? id, questions: raw.questions };
  } catch {
    return null;
  }
}

function stripFrontmatter(source: string): string {
  if (!source.startsWith('---')) return source;
  const lines = source.split('\n');
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') return lines.slice(i + 1).join('\n');
  }
  return source;
}
