-- PEGAR EN EL SQL EDITOR DE SUPABASE (no la aplica el agente)
-- ---------------------------------------------------------------------------
-- FASE 2 — Campos de integridad del marketplace.
-- Añade las columnas que alimentan el "Sello de Integridad" y la zona de
-- autor de la página de detalle. El frontend ya las lee con fallback, así
-- que puede aplicarse en cualquier momento sin romper la UI.
--
-- IMPORTANTE: el agente NO ejecuta este DDL. Cópialo en el SQL Editor de
-- Supabase y ejecútalo tú. No requiere datos de backfill: los valores por
-- defecto mantienen el comportamiento actual hasta que marketplace_publish
-- los complete tras un backtest.
-- ---------------------------------------------------------------------------

ALTER TABLE marketplace_strategies
  ADD COLUMN IF NOT EXISTS delivers text NOT NULL DEFAULT 'signals',
  ADD COLUMN IF NOT EXISTS replicable boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS bench_buyhold float,
  ADD COLUMN IF NOT EXISTS bench_ma float,
  ADD COLUMN IF NOT EXISTS method text,
  ADD COLUMN IF NOT EXISTS integrity_label text,
  ADD COLUMN IF NOT EXISTS author_integrity_streak int NOT NULL DEFAULT 0;

-- Índice opcional para ordenar el listado por replicabilidad (Fase 1 backend).
-- Inocuo si aún no se usa en el ORDER BY.
CREATE INDEX IF NOT EXISTS idx_marketplace_replicable
  ON marketplace_strategies (replicable);
