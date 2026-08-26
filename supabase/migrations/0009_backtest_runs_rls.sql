-- RLS para backtest_runs: permitir a usuarios autenticados insertar/leer sus runs.
-- La tabla ya existía sin user_id; lo añadimos y vinculamos a strategies.user_id.

-- 1. Añadir columna user_id si no existe.
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'backtest_runs' and column_name = 'user_id'
  ) then
    alter table public.backtest_runs add column user_id uuid references public.profiles(id) on delete cascade;
  end if;
end $$;

-- 2. Rellenar user_id desde strategies para filas existentes que lo tengan nulo.
update public.backtest_runs br
set user_id = s.user_id
from public.strategies s
where br.strategy_id = s.id and br.user_id is null;

-- 3. Habilitar RLS.
alter table public.backtest_runs enable row level security;

-- 4. Políticas: cada usuario gestiona solo sus runs.
drop policy if exists "backtest_runs insert own" on public.backtest_runs;
create policy "backtest_runs insert own"
  on public.backtest_runs for insert
  with check (user_id = auth.uid());

drop policy if exists "backtest_runs select own" on public.backtest_runs;
create policy "backtest_runs select own"
  on public.backtest_runs for select
  using (user_id = auth.uid());

drop policy if exists "backtest_runs update own" on public.backtest_runs;
create policy "backtest_runs update own"
  on public.backtest_runs for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "backtest_runs delete own" on public.backtest_runs;
create policy "backtest_runs delete own"
  on public.backtest_runs for delete
  using (user_id = auth.uid());
