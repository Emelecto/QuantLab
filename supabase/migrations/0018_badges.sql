-- 0018: Badges de logros para usuarios
-- Idempotente: seguro de reaplicar.

create table if not exists public.user_badges (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  badge_type    text not null check (badge_type in (
                  'first_submission',
                  'top_10_tournament',
                  'replicable_strategy',
                  'first_referral',
                  'five_referrals',
                  'ten_referrals',
                  'ml_master',
                  'sharpe_1_5',
                  'tournament_winner'
                )),
  earned_at     timestamptz not null default now(),
  metadata      jsonb default '{}'::jsonb  -- datos extra (ej: torneo_id, submission_id)
);

create unique index if not exists idx_user_badges_unique 
  on public.user_badges(user_id, badge_type);
create index if not exists idx_user_badges_user 
  on public.user_badges(user_id, earned_at desc);

-- RLS: el usuario solo ve sus propios badges.
alter table public.user_badges enable row level security;

drop policy if exists "user_badges read own" on public.user_badges;
create policy "user_badges read own" on public.user_badges
  for select using (auth.uid() = user_id);

drop policy if exists "user_badges insert service" on public.user_badges;
create policy "user_badges insert service" on public.user_badges
  for insert with check (auth.role() = 'service_role');
