-- 0017: Sistema de referidos — código único + tracking + recompensa
-- Idempotente: seguro de reaplicar.

-- Tabla de códigos de referido por usuario (único por usuario)
create table if not exists public.referral_codes (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null unique references public.profiles(id) on delete cascade,
  code          text not null unique,
  created_at    timestamptz not null default now()
);

create index if not exists idx_referral_codes_code on public.referral_codes(code);

-- Tabla de referidos (quién invitó a quién)
create table if not exists public.referrals (
  id              uuid primary key default gen_random_uuid(),
  referrer_id     uuid not null references public.profiles(id) on delete cascade,
  referred_id     uuid not null unique references public.profiles(id) on delete cascade,
  status          text not null default 'pending' check (status in ('pending', 'registered', 'rewarded')),
  reward_qp       integer not null default 5,
  created_at      timestamptz not null default now(),
  rewarded_at     timestamptz
);

create index if not exists idx_referrals_referrer on public.referrals(referrer_id);
create index if not exists idx_referrals_referred on public.referrals(referred_id);

-- RLS: el usuario solo ve sus propios referidos y su propio código.
alter table public.referral_codes enable row level security;
alter table public.referrals enable row level security;

drop policy if exists "referral_codes read own" on public.referral_codes;
create policy "referral_codes read own" on public.referral_codes
  for select using (auth.uid() = user_id);

drop policy if exists "referral_codes insert own" on public.referral_codes;
create policy "referral_codes insert own" on public.referral_codes
  for insert with check (auth.uid() = user_id);

drop policy if exists "referrals read own" on public.referrals;
create policy "referrals read own" on public.referrals
  for select using (auth.uid() = referrer_id);

drop policy if exists "referrals insert service" on public.referrals;
create policy "referrals insert service" on public.referrals
  for insert with check (auth.role() = 'service_role');

drop policy if exists "referrals update service" on public.referrals;
create policy "referrals update service" on public.referrals
  for update using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
