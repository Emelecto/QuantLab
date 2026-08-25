# Sistema de comentarios en estrategias del marketplace.
# Endpoints FastAPI: crear (auth), listar (público) y borrar (solo el autor).

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, Request
from auth import require_user
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="", tags=["comments"])

# Límite de comentarios por página (coincide con el default del endpoint).
_DEFAULT_LIMIT = 50
_MAX_LIMIT = 100


def get_supabase():
    """Cliente Supabase service_role, mismo patrón que tournaments.py."""
    from tournaments import get_supabase as _get

    return _get()


class CommentBody(BaseModel):
    body: str


@router.post("/marketplace/{strategy_id}/comments")
def create_comment(strategy_id: str, payload: CommentBody, request: Request):
    """Crea un comentario en una estrategia del marketplace (requiere auth)."""
    uid = require_user(request)
    sb = get_supabase()

    # Validar cuerpo: entre 1 y 2000 caracteres (igual que el CHECK de la DB).
    text = (payload.body or "").strip()
    if not (1 <= len(text) <= 2000):
        raise HTTPException(
            400, "El comentario debe tener entre 1 y 2000 caracteres."
        )

    # La estrategia debe existir.
    exists = (
        sb.table("marketplace_strategies").select("id").eq("id", strategy_id).execute()
    )
    if not exists.data:
        raise HTTPException(404, "Estrategia no encontrada")

    res = (
        sb.table("marketplace_comments")
        .insert({"strategy_id": strategy_id, "author_id": uid, "body": text})
        .execute()
    )
    if not res.data:
        raise HTTPException(500, "No se pudo crear el comentario")
    return res.data[0]


@router.get("/marketplace/{strategy_id}/comments")
def list_comments(strategy_id: str, limit: int = _DEFAULT_LIMIT):
    """Lista pública de comentarios de una estrategia, del más antiguo al más nuevo.

    Join con profiles para incluir el username del autor cuando exista.
    """
    limit = max(1, min(limit, _MAX_LIMIT))
    sb = get_supabase()

    # La estrategia debe existir (lectura pública).
    exists = (
        sb.table("marketplace_strategies").select("id").eq("id", strategy_id).execute()
    )
    if not exists.data:
        raise HTTPException(404, "Estrategia no encontrada")

    res = (
        sb.table("marketplace_comments")
        .select("id,author_id,body,created_at,profiles(username)")
        .eq("strategy_id", strategy_id)
        .order("created_at")  # ASC por defecto
        .limit(limit)
        .execute()
    )
    out = []
    for row in res.data or []:
        profile = row.get("profiles") or {}
        out.append(
            {
                "id": row.get("id"),
                "author_id": row.get("author_id"),
                "username": profile.get("username"),
                "body": row.get("body"),
                "created_at": row.get("created_at"),
            }
        )
    return out


@router.delete("/comments/{comment_id}")
def delete_comment(comment_id: str, request: Request):
    """Borra un comentario; solo su autor puede hacerlo."""
    uid = require_user(request)
    sb = get_supabase()
    res = (
        sb.table("marketplace_comments")
        .delete()
        .eq("id", comment_id)
        .eq("author_id", uid)
        .execute()
    )
    if not res.data:
        # No existe, o existe pero es de otro autor (RLS + filtro por author_id).
        raise HTTPException(404, "Comentario no encontrado")
    return {"ok": True}
