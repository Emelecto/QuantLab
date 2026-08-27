-- PEGAR EN EL SQL EDITOR DE SUPABASE (no la aplica el agente)
-- 0013: consensus_signals — señal viva del meta-modelo comunitario de los torneos ML.
-- Idempotente: seguro de reaplicar. Solo AÑADE la tabla; no recrea tablas existentes.
--
-- El worker (worker/ml_scheduler.py :: _distribute_ml_qp) construye el meta-modelo
-- comunitario ('meta', Serie de predicciones del ensemble ponderado por stake) y lo
-- persiste aquí con un upsert por (tournament_id, round_number). El endpoint
-- GET /marketplace/consensus-signal lo expone como señal viva del marketplace.

create table if not exists public.consensus_signals (
  id            uuid primary key default gen_random_uuid(),
  tournament_id uuid references public.tournaments(id) on delete cascade,
  round_number  integer not null,
  dataset_id    uuid references public.ml_datasets(id) on delete cascade,
  signal_json   jsonb not null,            -- predicciones del ensemble alineadas por row_id
  created_at    timestamptz not null default now(),
  unique (tournament_id, round_number)
);

create index if not exists idx_consensus_signals_tournament
  on public.consensus_signals(tournament_id, round_number);
create index if not exists idx_consensus_signals_created
  on public.consensus_signals(created_at desc);

-- RLS: lectura pública (es una señal de mercado, no datos privados).
alter table public.consensus_signals enable row level security;

drop policy if exists "consensus_signals read" on public.consensus_signals;
create policy "consensus_signals read"
  on public.consensus_signals for select using (true);
