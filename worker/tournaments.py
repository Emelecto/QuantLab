# Motor de torneos + tokens + marketplace para QuantLab.
# Endpoints FastAPI que el frontend invoca vía NEXT_PUBLIC_WORKER_URL.

from __future__ import annotations

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="", tags=["tournaments"])

# ---------------------------------------------------------------------------
# Cliente Supabase (service_role, server-side)
# ---------------------------------------------------------------------------
_supabase = None


def get_supabase():
    global _supabase
    if _supabase is None:
        import os
        from supabase import create_client
        url = os.environ.get("SUPABASE_URL")
        key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
        if not url or not key:
            raise RuntimeError("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY no configuradas")
        _supabase = create_client(url, key)
    return _supabase


# ---------------------------------------------------------------------------
# TORNEOS
# ---------------------------------------------------------------------------

@router.get("/tournament/list")
def tournament_list(type: str | None = None, status: str | None = None):
    sb = get_supabase()
    q = sb.table("tournaments").select("*")
    if type:
        q = q.eq("type", type)
    if status:
        q = q.eq("status", status)
    q = q.order("created_at", desc=True)
    res = q.execute()
    return res.data or []


@router.get("/tournament/{tournament_id}")
def tournament_detail(tournament_id: str):
    sb = get_supabase()
    res = sb.table("tournaments").select("*").eq("id", tournament_id).execute()
    if not res.data:
        raise HTTPException(404, "Torneo no encontrado")
    return res.data[0]


class SubmitBody(BaseModel):
    tournament_id: str
    code: str
    config: dict
    qp_stake: int = 0


@router.post("/tournament/submit")
def tournament_submit(body: SubmitBody):
    sb = get_supabase()
    # 1. Validar torneo existe y está abierto
    t = sb.table("tournaments").select("*").eq("id", body.tournament_id).execute()
    if not t.data:
        raise HTTPException(404, "Torneo no encontrado")
    if t.data[0]["status"] != "open":
        raise HTTPException(400, "El torneo no está abierto a submissions")

    # 2. Validar QP si hay stake
    uid = _get_user_id()
    if body.qp_stake > 0:
        bal = sb.table("tokens").select("balance").eq("user_id", uid).execute()
        balance = bal.data[0]["balance"] if bal.data else 0
        if balance < body.qp_stake:
            raise HTTPException(402, "QP insuficientes para el stake")

    # 3. Crear submission
    sub = sb.table("submissions").insert({
        "tournament_id": body.tournament_id,
        "user_id": uid,
        "code": body.code,
        "config": body.config,
        "qp_staked": body.qp_stake,
        "status": "pending",
    }).execute()
    sid = sub.data[0]["id"]

    # 4. Descontar QP del stake
    if body.qp_stake > 0:
        sb.table("token_ledger").insert({
            "user_id": uid, "amount": -body.qp_stake,
            "type": "tournament_entry", "ref_id": sid,
            "memo": f"Stake torneo {body.tournament_id}",
        }).execute()
        _update_balance(uid, -body.qp_stake)

    return {"id": sid, "status": "pending"}


@router.get("/tournament/{tournament_id}/leaderboard")
def tournament_leaderboard(tournament_id: str):
    sb = get_supabase()
    res = (
        sb.table("leaderboard_entries")
        .select("*,profiles(username,display_name,avatar_url)")
        .eq("tournament_id", tournament_id)
        .order("rank")
        .limit(100)
        .execute()
    )
    return res.data or []


@router.get("/tournament/{tournament_id}/my-submission")
def tournament_my_submission(tournament_id: str):
    sb = get_supabase()
    uid = _get_user_id()
    res = (
        sb.table("submissions")
        .select("*")
        .eq("tournament_id", tournament_id)
        .eq("user_id", uid)
        .execute()
    )
    return {"data": res.data[0] if res.data else None}


# ---------------------------------------------------------------------------
# TOKENS (QP)
# ---------------------------------------------------------------------------

@router.get("/tokens/balance")
def tokens_balance():
    sb = get_supabase()
    uid = _get_user_id()
    res = sb.table("tokens").select("*").eq("user_id", uid).execute()
    return res.data[0] if res.data else {"balance": 0, "lifetime_earned": 0, "lifetime_spent": 0, "tier": "free"}


@router.get("/tokens/ledger")
def tokens_ledger():
    sb = get_supabase()
    uid = _get_user_id()
    res = (
        sb.table("token_ledger")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", desc=True)
        .limit(100)
        .execute()
    )
    return res.data or []


class TransactionBody(BaseModel):
    amount: int
    type: str
    ref_id: str | None = None
    memo: str | None = None


@router.post("/tokens/transaction")
def tokens_transaction(body: TransactionBody):
    sb = get_supabase()
    uid = _get_user_id()
    # Insert ledger entry
    sb.table("token_ledger").insert({
        "user_id": uid, "amount": body.amount, "type": body.type,
        "ref_id": body.ref_id, "memo": body.memo,
    }).execute()
    # Update balance
    _update_balance(uid, body.amount)
    return {"balance": _get_balance(uid)}


# ---------------------------------------------------------------------------
# MARKETPLACE
# ---------------------------------------------------------------------------

@router.get("/marketplace")
def marketplace_list(asset_type: str | None = None, symbol: str | None = None):
    sb = get_supabase()
    q = sb.table("marketplace_strategies").select("*,profiles(username,display_name,avatar_url)").eq("status", "published")
    if asset_type:
        q = q.eq("asset_type", asset_type)
    if symbol:
        q = q.eq("symbol", symbol)
    q = q.order("subscribers", desc=True)
    return q.execute().data or []


class PublishBody(BaseModel):
    title: str
    description: str | None = None
    tags: list[str] | None = None
    asset_type: str
    symbol: str
    timeframe: str
    code: str | None = None
    is_public_code: bool = False
    config: dict
    price_qp_week: int = 0


@router.post("/marketplace/publish")
def marketplace_publish(body: PublishBody):
    sb = get_supabase()
    uid = _get_user_id()
    slug = _slugify(body.title)
    res = sb.table("marketplace_strategies").insert({
        "author_id": uid,
        "title": body.title,
        "slug": slug,
        "description": body.description,
        "tags": body.tags or [],
        "asset_type": body.asset_type,
        "symbol": body.symbol,
        "timeframe": body.timeframe,
        "code": body.code,
        "is_public_code": body.is_public_code,
        "config": body.config,
        "price_qp_week": body.price_qp_week,
        "status": "published",
        "published_at": datetime.now(timezone.utc).isoformat(),
    }).execute()
    return {"id": res.data[0]["id"]}


@router.post("/marketplace/{strategy_id}/subscribe")
def marketplace_subscribe(strategy_id: str):
    sb = get_supabase()
    uid = _get_user_id()
    # Verificar que no esté ya suscrito
    existing = sb.table("strategy_subscriptions").select("id").eq("strategy_id", strategy_id).eq("subscriber_id", uid).execute()
    if existing.data:
        raise HTTPException(400, "Ya estás suscrito a esta estrategia")
    s = sb.table("marketplace_strategies").select("price_qp_week,author_id").eq("id", strategy_id).execute()
    if not s.data:
        raise HTTPException(404, "Estrategia no encontrada")
    price = s.data[0]["price_qp_week"]
    # Cobrar si hay precio
    if price > 0:
        bal = _get_balance(uid)
        if bal < price:
            raise HTTPException(402, "QP insuficientes")
        sb.table("token_ledger").insert({
            "user_id": uid, "amount": -price, "type": "copy_cost",
            "ref_id": strategy_id, "memo": f"Suscripción a {strategy_id}",
        }).execute()
        _update_balance(uid, -price)
        # Pagar al autor
        sb.table("token_ledger").insert({
            "user_id": s.data[0]["author_id"], "amount": price, "type": "copy_income",
            "ref_id": strategy_id, "memo": f"Copy de {uid}",
        }).execute()
        _update_balance(s.data[0]["author_id"], price)
    sub = sb.table("strategy_subscriptions").insert({
        "strategy_id": strategy_id, "subscriber_id": uid, "status": "active",
    }).execute()
    return {"id": sub.data[0]["id"], "status": "active"}


@router.post("/marketplace/{strategy_id}/unsubscribe")
def marketplace_unsubscribe(strategy_id: str):
    sb = get_supabase()
    uid = _get_user_id()
    sb.table("strategy_subscriptions").update({"status": "cancelled"}).eq("strategy_id", strategy_id).eq("subscriber_id", uid).execute()
    return {"status": "cancelled"}


@router.get("/marketplace/my-subscriptions")
def marketplace_my_subscriptions():
    sb = get_supabase()
    uid = _get_user_id()
    res = (
        sb.table("strategy_subscriptions")
        .select("*,marketplace_strategies!inner(*)")
        .eq("subscriber_id", uid)
        .eq("status", "active")
        .execute()
    )
    return res.data or []


@router.get("/signals/{strategy_id}")
def signals_list(strategy_id: str):
    sb = get_supabase()
    res = (
        sb.table("signals")
        .select("*")
        .eq("strategy_id", strategy_id)
        .order("created_at", desc=True)
        .limit(50)
        .execute()
    )
    return res.data or []


# ---------------------------------------------------------------------------
# HELPERS
# ---------------------------------------------------------------------------

def _get_user_id() -> str:
    # En producción viene del JWT/Supabase auth. Por ahora devuelve un placeholder.
    # TODO: extraer del header Authorization
    return "00000000-0000-0000-0000-000000000000"


def _get_balance(uid: str) -> int:
    sb = get_supabase()
    res = sb.table("tokens").select("balance").eq("user_id", uid).execute()
    return res.data[0]["balance"] if res.data else 0


def _update_balance(uid: str, delta: int):
    sb = get_supabase()
    bal = _get_balance(uid) + delta
    sb.table("tokens").upsert({"user_id": uid, "balance": bal}, on_conflict="user_id").execute()


def _slugify(s: str) -> str:
    import re
    s = s.lower().strip()
    s = re.sub(r"[^\w\s-]", "", s)
    s = re.sub(r"[\s]+", "-", s)
    return s[:50]
