-- 0014: dataset_targets necesita las columnas feature_* para el FNC (feature-neutral
-- correlation) en el scoring. La migracion 0011 solo creo dataset_id, row_id, target, era.
-- El codigo (ml_persist.crear_dataset) inserta las feature_* del live en dataset_targets;
-- sin estas columnas falla con PGRST204.
--
-- Idempotente: usa DO block para añadir solo las columnas que falten.
-- Aplica esto en el SQL Editor de Supabase (prod). El agente NO corre DDL en prod.

do $$
declare
  i int;
  col text;
begin
  for i in 1..50 loop
    col := 'feature_' || lpad(i::text, 2, '0');
    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public'
        and table_name = 'dataset_targets'
        and column_name = col
    ) then
      execute format('alter table public.dataset_targets add column %I float', col);
    end if;
  end loop;
end $$;

-- Indice para joins por dataset_id (ya existe PK, pero por si acaso)
create index if not exists idx_dataset_targets_dataset
  on public.dataset_targets(dataset_id);
