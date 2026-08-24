# Scheduler de torneos QuantLab.
# Se ejecuta periódicamente (cron job) para crear, evaluar y cerrar torneos.

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone

logger = logging.getLogger(__name__)


def create_weekly_tournament(supabase_client, now: datetime | None = None) -> dict | None:
    """Crea el torneo semanal automático (BTCUSDT, 1d).

    Ventanas: IS = 90 días, OOS = 30 días desde el cierre de IS.
    Si ya existe un torneo weekly abierto/abierto-hoy, no crea duplicados.
    """
    now = now or datetime.now(timezone.utc)
    # Evitar duplicados: si hay un weekly con status open/draft creado en los últimos 3 días, no crear.
    recent = (
        supabase_client.table("tournaments")
        .select("id")
        .eq("type", "weekly")
        .in_("status", ["draft", "open"])
        .gte("created_at", (now - timedelta(days=3)).isoformat())
        .execute()
    )
    if recent.data:
        logger.info("Torneo weekly ya existe, se omite creación.")
        return None

    data_start = (now - timedelta(days=120)).date()
    data_end = (now - timedelta(days=30)).date()  # cierre IS
    eval_end = now.date()  # cierre OOS = hoy
    deadline = (now + timedelta(days=1)).isoformat()  # submissions hasta mañana

    payload = {
        "name": f"Torneo Semanal BTC · {now.strftime('%Y-W%V')}",
        "slug": f"weekly-btc-{now.strftime('%Y-W%V')}",
        "type": "weekly",
        "status": "open",
        "asset_type": "crypto",
        "symbols": ["BTCUSDT"],
        "timeframe": "1d",
        "data_start": str(data_start),
        "data_end": str(data_end),
        "eval_end": str(eval_end),
        "submission_deadline": deadline,
        "prize_pool_qp": 200,
        "primary_metric": "deflated_sharpe_oos",
        "min_trades": 10,
        "max_slippage_pct": 0.005,
        "rules_text": "Backtest OOS sobre BTCUSDT. Walk-forward 90d train / 30d test. Mínimo 10 operaciones.",
    }
    res = supabase_client.table("tournaments").insert(payload).execute()
    logger.info(f"Torneo weekly creado: {res.data[0]['id'] if res.data else 'error'}")
    return res.data[0] if res.data else None


def evaluate_tournaments(supabase_client, engine, now: datetime | None = None) -> int:
    """Evalúa torneos cerrados (deadline pasado) con submissions pendientes.

    Para cada submission pendiente:
      1. Corre el backtest en la ventana OOS.
      2. Guarda metrics, integrity_label, primary_score.
    Luego rankea y distribuye QP.
    """
    now = now or datetime.now(timezone.utc)
    cerrados = (
        supabase_client.table("tournaments")
        .select("id,submission_deadline,primary_metric")
        .eq("status", "closed")
        .eq("evaluated", False) if False else
        supabase_client.table("tournaments")
        .select("id")
        .eq("status", "closed")
        .execute()
    )
    # Nota: no usamos campo 'evaluated'; filtramos por submissions pendientes.
    tournaments = (
        supabase_client.table("tournaments")
        .select("id,primary_metric")
        .in_("status", ["closed", "evaluating"])
        .execute()
    )
    evaluated = 0
    for t in tournaments.data or []:
        pending = (
            supabase_client.table("submissions")
            .select("id,code,config,user_id,qp_staked")
            .eq("tournament_id", t["id"])
            .eq("status", "pending")
            .execute()
        )
        for sub in pending.data or []:
            try:
                from schemas import StrategyConfig
                cfg = StrategyConfig(**sub["config"])
                result = engine.run_backtest(cfg)
                metrics = result.get("metrics", {})
                integrity = result.get("integrity", "Low")
                primary = metrics.get(t.get("primary_metric", "deflated_sharpe_oos"), 0) or 0
                supabase_client.table("submissions").update({
                    "metrics": metrics,
                    "integrity_label": integrity,
                    "primary_score": primary,
                    "status": "scoring",
                }).eq("id", sub["id"]).execute()
            except Exception as e:
                supabase_client.table("submissions").update({
                    "status": "disqualified",
                    "eval_error": str(e)[:500],
                }).eq("id", sub["id"]).execute()
        evaluated += 1
        distribute_qp(supabase_client, t["id"])
        supabase_client.table("tournaments").update({"status": "completed"}).eq("id", t["id"]).execute()
    return evaluated


def distribute_qp(supabase_client, tournament_id: str):
    """Rankea submissions y distribuye QP según posición.

    Premio base: 1° = 200 QP, 2° = 100 QP, 3° = 50 QP. Resto con score>0 = 10 QP.
    Solo submissions con integrity_label = High y primary_score > 0.
    """
    subs = (
        supabase_client.table("submissions")
        .select("id,user_id,primary_score,integrity_label,qp_staked")
        .eq("tournament_id", tournament_id)
        .eq("status", "scoring")
        .eq("integrity_label", "High")
        .order("primary_score", desc=True)
        .execute()
    )
    prizes = {0: 200, 1: 100, 2: 50}
    entries = []
    for i, sub in enumerate(subs.data or []):
        if (sub.get("primary_score") or 0) <= 0:
            continue
        prize = prizes.get(i, 10)
        entries.append({
            "tournament_id": tournament_id,
            "user_id": sub["user_id"],
            "submission_id": sub["id"],
            "rank": i + 1,
            "score": sub["primary_score"],
            "qp_earned": prize,
        })
        # Actualizar submission con qp_earned
        supabase_client.table("submissions").update({
            "qp_earned": prize,
            "rank": i + 1,
            "status": "scored",
        }).eq("id", sub["id"]).execute()
        # Añadir QP al usuario
        _credit_qp(supabase_client, sub["user_id"], prize, "tournament_prize", tournament_id)
    if entries:
        supabase_client.table("leaderboard_entries").upsert(entries).execute()


def _credit_qp(supabase_client, user_id: str, amount: int, type: str, ref_id: str):
    """Añade QP al balance y registra en el ledger."""
    # Leer balance actual
    cur = supabase_client.table("tokens").select("balance,lifetime_earned").eq("user_id", user_id).execute()
    if cur.data:
        bal = cur.data[0]["balance"] + amount
        earned = cur.data[0]["lifetime_earned"] + max(0, amount)
        supabase_client.table("tokens").update({"balance": bal, "lifetime_earned": earned}).eq("user_id", user_id).execute()
    else:
        supabase_client.table("tokens").insert({
            "user_id": user_id, "balance": amount,
            "lifetime_earned": max(0, amount), "lifetime_spent": 0,
        }).execute()
    supabase_client.table("token_ledger").insert({
        "user_id": user_id, "amount": amount, "type": type,
        "ref_id": ref_id, "memo": f"Premio torneo" if type == "tournament_prize" else type,
    }).execute()
