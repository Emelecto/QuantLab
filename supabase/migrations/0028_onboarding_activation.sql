-- Onboarding: checklist de activación persistente en servidor.
-- (Los eventos del funnel —onboarding_started, first_backtest, etc.— van por
-- POST /api/analytics/event con reenvío a Plausible; ver src/lib/analytics.ts.)
-- Tabla pequeña, RLS por usuario. Todo idempotente (if not exists).

-- Progreso crea → corre → publica → compite (un JSON por usuario).
create table if not exists public.activation_progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  steps jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.activation_progress enable row level security;

drop policy if exists "activation_progress_owner" on public.activation_progress;
create policy "activation_progress_owner"
  on public.activation_progress
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
