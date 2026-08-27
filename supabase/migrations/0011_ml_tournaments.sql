-- 0011: Torneos ML — datasets obfuscados, predicciones de usuarios, holdout privado.
-- Idempotente: seguro de reaplicar. Solo AÑADE objetos; no recrea tablas existentes.
--
-- Modelo: el usuario NO sube código, sube un CSV de predicciones (id, prediction)
-- sobre un dataset público (train/validation) que el worker genera. El holdout
-- (target real por fila) vive en dataset_targets y NUNCA se expone al cliente:
-- la tabla solo es legible por service_role.

-- ---------------------------------------------------------
-- 1. DATASETS (metadatos + enlaces a Storage)
-- ---------------------------------------------------------
create table if not exists public.ml_datasets (
  id            uuid primary key default gen_random_uuid(),
  tournament_id uuid references public.tournaments(id) on delete cascade,
  round_number  integer not null default 1,
  mode          text not null check (mode in ('sintetico', 'real')),
  kind          text not null check (kind in ('train', 'validation', 'live')),
  status        text not null default 'building'
                check (status in ('building', 'ready', 'scored', 'closed')),
  n_assets      integer not null,
  n_eras        integer not null,
  n_features    integer not null,
  feature_cols  text[] not null,
  bucket_path   text,                       -- ruta en Storage (train/validation públicos)
  row_count     integer,
  salt_hash     text not null,              -- hash de la sal (NO la sal) para auditoría
  ic_objetivo   float,                      -- dificultad del generador sintético
  created_at    timestamptz not null default now(),
  closes_at     timestamptz,                -- cierre de la ronda de envíos
  unique (tournament_id, round_number, kind)
);

create index if not exists idx_ml_datasets_tournament on public.ml_datasets(tournament_id, round_number);

-- ---------------------------------------------------------
-- 2. HOLDOUT (target del live) — SOLO service_role
-- ---------------------------------------------------------
-- Guardamos el target real de cada fila del live. El worker lo usa para puntuar.
-- RLS: sin policy de SELECT para anon/auth => el cliente nunca lo lee.
create table if not exists public.dataset_targets (
  dataset_id  uuid not null references public.ml_datasets(id) on delete cascade,
  row_id      text not null,                 -- coincides con la columna 'id' pública
  target      float not null,
  era         text not null,
  primary key (dataset_id, row_id)
);

-- ---------------------------------------------------------
-- 3. SUBMISSION DE PREDICCIONES (lo que sube el usuario)
-- ---------------------------------------------------------
create table if not exists public.prediction_submissions (
  id              uuid primary key default gen_random_uuid(),
  dataset_id      uuid not null references public.ml_datasets(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  file_name       text,
  row_count       integer not null default 0,
  score           float,
  corr_mean       float,
  fnc_mean        float,
  consistencia    float,
  meta_corr       float,
  is_valid        boolean default false,
  plagio_flag     boolean default false,
  status          text not null default 'pending'
                  check (status in ('pending', 'scoring', 'scored', 'disqualified')),
  submitted_at    timestamptz not null default now(),
  scored_at       timestamptz,
  unique (dataset_id, user_id)               -- un envío por usuario por dataset
);

create index if not exists idx_pred_sub_dataset on public.prediction_submissions(dataset_id);
create index if not exists idx_pred_sub_user     on public.prediction_submissions(user_id);

-- ---------------------------------------------------------
-- 4. RLS
-- ---------------------------------------------------------
alter table public.ml_datasets              enable row level security;
alter table public.dataset_targets          enable row level security;
alter table public.prediction_submissions   enable row level security;

-- ml_datasets: lectura pública (metadatos + rutas de Storage públicas).
drop policy if exists "ml_datasets read" on public.ml_datasets;
create policy "ml_datasets read" on public.ml_datasets for select using (true);

-- dataset_targets: SOLO service_role. No hay policy de SELECT para el cliente.
-- (El bucket de Storage para train/validation es público; el holdout no se sube.)
drop policy if exists "dataset_targets service" on public.dataset_targets;
create policy "dataset_targets service"
  on public.dataset_targets for all
  using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- prediction_submissions: el usuario ve y edita solo las suyas.
drop policy if exists "pred_sub read" on public.prediction_submissions;
create policy "pred_sub read" on public.prediction_submissions
  for select using (auth.uid() = user_id);

drop policy if exists "pred_sub write" on public.prediction_submissions;
create policy "pred_sub write" on public.prediction_submissions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------
-- 5. STORAGE BUCKET (train/validation públicos; el live no se sube)
-- ---------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('tournament-datasets', 'tournament-datasets', true)
on conflict (id) do update set public = true;

-- Permitir lectura pública del bucket (los parquet de train/validation).
drop policy if exists "public read datasets" on storage.objects;
create policy "public read datasets"
  on storage.objects for select
  using (bucket_id = 'tournament-datasets');

-- Solo service_role puede escribir en el bucket.
drop policy if exists "service write datasets" on storage.objects;
create policy "service write datasets"
  on storage.objects for insert
  with check (bucket_id = 'tournament-datasets' and auth.role() = 'service_role');
