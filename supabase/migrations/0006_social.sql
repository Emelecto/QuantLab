-- Social: follows entre usuarios y log global de actividad.
-- Lectura pública de ambas tablas; escribir solo el usuario autenticado
-- dueño de la acción (auth.uid()).

create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  followed_id uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (follower_id, followed_id),
  constraint follows_no_self check (follower_id <> followed_id)
);

create table if not exists public.activity_log (
  id          bigint generated always as identity primary key,
  actor_id    uuid not null references public.profiles(id) on delete cascade,
  action      text not null check (action in ('published_strategy', 'tournament_submission', 'comment_added')),
  target_type text,
  target_id   text,
  meta        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists idx_follows_followed on public.follows(followed_id);
create index if not exists idx_activity_created_at on public.activity_log(created_at desc);

alter table public.follows enable row level security;
alter table public.activity_log enable row level security;

create policy "follows read"   on public.follows for select using (true);
create policy "follows insert" on public.follows for insert with check (auth.uid() = follower_id);
create policy "follows delete" on public.follows for delete using (auth.uid() = follower_id);

create policy "activity read"   on public.activity_log for select using (true);
create policy "activity insert" on public.activity_log for insert with check (auth.uid() = actor_id);
