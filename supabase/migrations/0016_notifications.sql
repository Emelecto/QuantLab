-- 0016: Notificaciones en-app para usuarios
-- Idempotente: seguro de reaplicar.

create table if not exists public.notifications (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  type          text not null check (type in (
                  'submission_scored',
                  'tournament_closed',
                  'tournament_opened',
                  'badge_earned',
                  'referral_joined',
                  'qp_received',
                  'strategy_replicated'
                )),
  title         text not null,
  body          text not null,
  link          text,                       -- ruta interna opcional (ej: /app/tournaments/123)
  is_read       boolean not null default false,
  created_at    timestamptz not null default now()
);

create index if not exists idx_notifications_user_unread
  on public.notifications(user_id, is_read, created_at desc);

-- RLS: el usuario solo ve y edita las suyas.
alter table public.notifications enable row level security;

drop policy if exists "notifications read" on public.notifications;
create policy "notifications read" on public.notifications
  for select using (auth.uid() = user_id);

drop policy if exists "notifications update" on public.notifications;
create policy "notifications update" on public.notifications
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "notifications insert service" on public.notifications;
create policy "notifications insert service" on public.notifications
  for insert with check (auth.role() = 'service_role');
