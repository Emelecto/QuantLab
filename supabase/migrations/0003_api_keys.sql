-- Claves de API dedicadas (para MCP / acceso programático sin JWT efímero)
-- Formato de clave pública: qlk_<48 hex>. En DB solo se guarda su SHA-256.

create table if not exists public.api_keys (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  name          text not null,
  key_hash      text not null unique,
  created_at    timestamptz not null default now(),
  last_used_at  timestamptz,
  revoked_at    timestamptz
);

create index if not exists idx_api_keys_user   on public.api_keys(user_id);
create index if not exists idx_api_keys_lookup on public.api_keys(key_hash);

alter table public.api_keys enable row level security;

create policy "api keys read"  on public.api_keys for select using (auth.uid() = user_id);
create policy "api keys write" on public.api_keys for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
