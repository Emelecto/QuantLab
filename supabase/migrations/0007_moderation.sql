-- Moderación UGC: reportes de contenido + marca de administrador.
-- Los reportes solo los ve quien los crea y los admins; insertar requiere sesión.

alter table public.profiles add column if not exists is_admin boolean not null default false;

create table if not exists public.content_reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('comment', 'marketplace_strategy')),
  target_id   uuid not null,
  reason      text not null check (char_length(reason) between 1 and 500),
  status      text not null default 'open' check (status in ('open', 'dismissed', 'resolved')),
  created_at  timestamptz not null default now()
);

create index if not exists idx_reports_status
  on public.content_reports(status, created_at);

alter table public.content_reports enable row level security;

create policy "reports insert" on public.content_reports for insert
  with check (auth.uid() = reporter_id);

-- Solo admins leen los reportes (la lectura vía service role del worker no pasa por RLS).
create policy "reports read admin" on public.content_reports for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );
