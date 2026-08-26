-- Tabla `strategies`: persiste backtests del usuario en Supabase.
-- Clave de supervivencia: sobrevive a cierre de sesión, cambio de dispositivo,
-- y localStorage borrado. Se sincroniza al guardar (upsert por id).

create table if not exists public.strategies (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  title       text,
  asset_type  text not null default 'crypto',
  symbol      text not null,
  timeframe   text not null,
  config      jsonb not null default '{}'::jsonb,
  metrics     jsonb not null default '{}'::jsonb,
  equity      jsonb not null default '[]'::jsonb,
  integrity   text not null default 'High',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Índice: consultar estrategias por usuario (más recientes primero).
create index if not exists strategies_user_created_idx
  on public.strategies (user_id, created_at desc);

-- RLS: cada usuario ve y gestiona solo sus propias estrategias.
alter table public.strategies enable row level security;

drop policy if exists "Users can view their own strategies" on public.strategies;
create policy "Users can view their own strategies"
  on public.strategies for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own strategies" on public.strategies;
create policy "Users can insert their own strategies"
  on public.strategies for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own strategies" on public.strategies;
create policy "Users can update their own strategies"
  on public.strategies for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their own strategies" on public.strategies;
create policy "Users can delete their own strategies"
  on public.strategies for delete using (auth.uid() = user_id);
