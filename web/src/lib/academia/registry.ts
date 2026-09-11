import fs from 'fs';
import path from 'path';

export * from './catalog';
import { getLesson } from './catalog';

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
