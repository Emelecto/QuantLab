-- RLS para backtest_runs: permitir a usuarios autenticados insertar sus propios runs.
-- La tabla ya existía en el schema base pero sin políticas para authenticated.

alter table public.backtest_runs enable row level security;

-- Insert: solo el dueño (user_id = auth.uid()).
drop policy if exists "backtest_runs insert own" on public.backtest_runs;
create policy "backtest_runs insert own"
  on public.backtest_runs for insert
  with check (
    user_id = auth.uid()
  );

-- Select: solo el dueño ve sus runs.
drop policy if exists "backtest_runs select own" on public.backtest_runs;
create policy "backtest_runs select own"
  on public.backtest_runs for select
  using (
    user_id = auth.uid()
  );

-- Update: solo el dueño.
drop policy if exists "backtest_runs update own" on public.backtest_runs;
create policy "backtest_runs update own"
  on public.backtest_runs for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Delete: solo el dueño.
drop policy if exists "backtest_runs delete own" on public.backtest_runs;
create policy "backtest_runs delete own"
  on public.backtest_runs for delete
  using (user_id = auth.uid());
