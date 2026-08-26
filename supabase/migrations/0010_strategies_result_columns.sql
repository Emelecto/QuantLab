-- 0010: columnas de resultado en strategies (fix de 0008).
-- La tabla ya existía con el schema viejo, así que el CREATE TABLE IF NOT EXISTS
-- de 0008 fue un no-op y las columnas metrics/equity/integrity nunca se crearon.
-- Eso hacía que el sync del dashboard trajera filas sin métricas y crasheara la UI.

alter table public.strategies add column if not exists metrics   jsonb not null default '{}'::jsonb;
alter table public.strategies add column if not exists equity    jsonb not null default '[]'::jsonb;
alter table public.strategies add column if not exists integrity text  not null default 'High';

-- Las políticas RLS de 0008 sí se crearon correctamente (no dependen del schema).
