-- Comentarios públicos en estrategias del marketplace.
-- Lectura pública; insertar/borrar solo el autor autenticado (auth.uid()).

create table if not exists public.marketplace_comments (
  id          uuid primary key default gen_random_uuid(),
  strategy_id uuid not null references public.marketplace_strategies(id) on delete cascade,
  author_id   uuid not null references public.profiles(id) on delete cascade,
  body        text not null check (char_length(body) between 1 and 2000),
  created_at  timestamptz not null default now()
);

create index if not exists idx_market_comments_strategy
  on public.marketplace_comments(strategy_id, created_at);

alter table public.marketplace_comments enable row level security;

create policy "comments read"   on public.marketplace_comments for select using (true);
create policy "comments insert" on public.marketplace_comments for insert with check (auth.uid() = author_id);
create policy "comments delete" on public.marketplace_comments for delete using (auth.uid() = author_id);
