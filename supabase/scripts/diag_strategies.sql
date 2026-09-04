-- Issue #5: Diagnosticar y borrar estrategias/ backtest Runs obsoletos.
--
-- Ejecuta primero la sección de DIAGNÓSTICO (SELECT) para REVISAR qué se borrará.
-- Luego, si el listado es correcto, descomenta y ejecuta la sección DE BORRADO.
--
-- IMPORTANTE: usa tu user_id real (no email). Para obtenerlo puedes correr:
--   select id, username from profiles;

--------------------------------------------------
-- 0) Reemplaza este user_id con el tuyo (ej. admin 2ca7b197...)
--------------------------------------------------
\echo '=== DIAGNÓSTICO: estrategias + runs del usuario ===';

select
  s.id           as strategy_id,
  s.symbol,
  s.asset_type,
  s.created_at,
  s.updated_at,
  s.backtest_runs as n_runs,
  r.id          as run_id,
  r.created_at  as run_created,
  r.scores       as has_scores
from strategies s
left join backtest_runs r on r.strategy_id = s.id
where s.user_id = '2ca7b197-86f5-4605-9789-266bf8a0df01'  -- <<< REEMPLAZA
order by s.created_at desc
limit 50;

--------------------------------------------------
-- 1) BORRAR estrategias viejas + sus runs (descomenta para ejecutar)
--    (cascade: al borrar la strategy, su run se borra por FK on delete cascade,
--     y las submissions que referencien la estrategia también se limpian.)
--------------------------------------------------
-- \echo '=== BORRANDO estrategias obsoletas ===';
-- delete from strategies
-- where user_id = '2ca7b197-86f5-4605-9789-266bf8a0df01'   -- <<< REEMPLAZA
--   and created_at < '2025-01-01';                          -- <<< define tu corte
