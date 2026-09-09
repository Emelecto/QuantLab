-- Academia: progreso por lecciones (IDs texto) sobre course_progress.
-- NO aplicar en prod todavía: solo scaffold del piloto (contrato multi-agente).
-- Backfill idempotente desde completed_modules (int[]) heredados.

alter table public.course_progress
  add column if not exists completed_lessons text[] not null default '{}';

-- Backfill: módulo N heredado -> 'c1-lN'. Solo filas aún sin completed_lessons.
update public.course_progress
set completed_lessons = coalesce(
  (select array_agg('c1-l' || m::text order by m)
   from unnest(completed_modules) as m),
  '{}'
)
where completed_lessons = '{}' and completed_modules <> '{}';

-- Índice GIN para consultas de pertenencia (p. ej. 'c1-l1' = any(completed_lessons)).
create index if not exists idx_course_progress_completed_lessons
  on public.course_progress using gin (completed_lessons);
