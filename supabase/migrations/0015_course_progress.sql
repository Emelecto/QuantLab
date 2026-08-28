-- Ruta Aprendiz: persistir el progreso del curso gamificado por usuario.
-- Reutiliza profiles.id como PK (1 fila por usuario).

create table if not exists public.course_progress (
  user_id              uuid primary key references public.profiles(id) on delete cascade,
  completed_modules    int[] not null default '{}',
  xp                   int not null default 0,
  streak               int not null default 0,
  last_active_date     date,
  favorite_dataset_id  text,
  saved_strategy       jsonb,                       -- {templateId, params} del M4 (handoff a torneo)
  entered_tournament_id text,
  badge_earned         boolean not null default false,
  updated_at           timestamptz not null default now()
);

create index if not exists idx_course_progress_badge
  on public.course_progress (badge_earned) where badge_earned;

alter table public.course_progress enable row level security;

-- Cada usuario gestiona solo su propio progreso.
drop policy if exists "course_progress read own" on public.course_progress;
create policy "course_progress read own"
  on public.course_progress for select
  using (auth.uid() = user_id);

drop policy if exists "course_progress upsert own" on public.course_progress;
create policy "course_progress upsert own"
  on public.course_progress for insert
  with check (auth.uid() = user_id);

drop policy if exists "course_progress update own" on public.course_progress;
create policy "course_progress update own"
  on public.course_progress for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- updated_at automático.
create or replace function public.set_updated_at_course() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists trg_course_progress_updated on public.course_progress;
create trigger trg_course_progress_updated before update on public.course_progress
  for each row execute function public.set_updated_at_course();
