# Tests del sistema de comentarios del marketplace.
# Correr con: TESTING=1 python -m pytest tests/test_comments.py -q

import pytest
from fastapi import HTTPException
from unittest.mock import MagicMock, patch


def _configure_exists(mock_supabase, data):
    """Configura la cadena select -> eq -> execute (chequeo de estrategia)."""
    mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(
        data=data
    )


def test_create_comment_ok(mock_supabase):
    row = {
        "id": "cmt-1",
        "strategy_id": "strat-1",
        "author_id": "00000000-0000-0000-0000-000000000001",
        "body": "Buena estrategia",
        "created_at": "2026-01-01T00:00:00+00:00",
    }
    _configure_exists(mock_supabase, [{"id": "strat-1"}])
    mock_supabase.table.return_value.insert.return_value.execute.return_value = MagicMock(
        data=[row]
    )
    with patch("comments.get_supabase", return_value=mock_supabase):
        from comments import create_comment, CommentBody

        result = create_comment("strat-1", CommentBody(body="Buena estrategia"), MagicMock())
        assert result["id"] == "cmt-1"
        assert result["body"] == "Buena estrategia"
        # Inserta con author_id del usuario autenticado (TESTING fija el uid).
        args = mock_supabase.table.return_value.insert.call_args[0][0]
        assert args["author_id"] == "00000000-0000-0000-0000-000000000001"


def test_create_comment_too_long(mock_supabase):
    with patch("comments.get_supabase", return_value=mock_supabase):
        from comments import create_comment, CommentBody

        with pytest.raises(HTTPException) as exc:
            create_comment("strat-1", CommentBody(body="x" * 2001), MagicMock())
        assert exc.value.status_code == 400


def test_create_comment_empty(mock_supabase):
    with patch("comments.get_supabase", return_value=mock_supabase):
        from comments import create_comment, CommentBody

        for text in ("", "   "):
            with pytest.raises(HTTPException) as exc:
                create_comment("strat-1", CommentBody(body=text), MagicMock())
            assert exc.value.status_code == 400


def test_create_comment_requires_auth(mock_supabase):
    # Sin TESTING, require_user sin token válido lanza 401.
    with patch("comments.get_supabase", return_value=mock_supabase), patch(
        "auth.get_user_id_from_request", return_value=None
    ), patch.dict("os.environ", {}, clear=False):
        import os

        os.environ.pop("TESTING", None)
        from comments import create_comment, CommentBody

        try:
            with pytest.raises(HTTPException) as exc:
                create_comment("strat-1", CommentBody(body="hola"), MagicMock())
            assert exc.value.status_code == 401
        finally:
            os.environ["TESTING"] = "1"


def test_create_comment_strategy_not_found(mock_supabase):
    _configure_exists(mock_supabase, [])
    with patch("comments.get_supabase", return_value=mock_supabase):
        from comments import create_comment, CommentBody

        with pytest.raises(HTTPException) as exc:
            create_comment("no-existe", CommentBody(body="hola"), MagicMock())
        assert exc.value.status_code == 404


def test_list_comments_public(mock_supabase):
    rows = [
        {
            "id": "cmt-1",
            "author_id": "u1",
            "body": "primero",
            "created_at": "2026-01-01T00:00:00+00:00",
            "profiles": {"username": "ana"},
        },
        {
            "id": "cmt-2",
            "author_id": "u2",
            "body": "segundo",
            "created_at": "2026-01-02T00:00:00+00:00",
            "profiles": {"username": "bruno"},
        },
    ]
    _configure_exists(mock_supabase, [{"id": "strat-1"}])
    mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.limit.return_value.execute.return_value = MagicMock(
        data=rows
    )
    with patch("comments.get_supabase", return_value=mock_supabase):
        from comments import list_comments

        result = list_comments("strat-1")
        assert len(result) == 2
        assert result[0]["username"] == "ana"
        assert result[1]["username"] == "bruno"
        # Formato plano: id, author_id, username, body, created_at.
        assert set(result[0].keys()) == {"id", "author_id", "username", "body", "created_at"}
        # Orden ASC (desc=False por defecto en .order).
        order_kwargs = (
            mock_supabase.table.return_value.select.return_value.eq.return_value.order.call_args
        )
        assert order_kwargs.kwargs.get("desc", False) is False


def test_list_comments_empty(mock_supabase):
    _configure_exists(mock_supabase, [{"id": "strat-1"}])
    mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.limit.return_value.execute.return_value = MagicMock(
        data=[]
    )
    with patch("comments.get_supabase", return_value=mock_supabase):
        from comments import list_comments

        assert list_comments("strat-1") == []


def test_list_comments_profile_missing(mock_supabase):
    # Join izquierdo: un comentario puede venir sin perfil asociado.
    rows = [
        {
            "id": "cmt-3",
            "author_id": "u3",
            "body": "sin username",
            "created_at": "2026-01-03T00:00:00+00:00",
            "profiles": None,
        }
    ]
    _configure_exists(mock_supabase, [{"id": "strat-1"}])
    mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.limit.return_value.execute.return_value = MagicMock(
        data=rows
    )
    with patch("comments.get_supabase", return_value=mock_supabase):
        from comments import list_comments

        result = list_comments("strat-1")
        assert result[0]["username"] is None


def test_list_comments_strategy_not_found(mock_supabase):
    _configure_exists(mock_supabase, [])
    with patch("comments.get_supabase", return_value=mock_supabase):
        from comments import list_comments

        with pytest.raises(HTTPException) as exc:
            list_comments("no-existe")
        assert exc.value.status_code == 404


def test_list_comments_limit_clamped(mock_supabase):
    _configure_exists(mock_supabase, [{"id": "strat-1"}])
    mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.limit.return_value.execute.return_value = MagicMock(
        data=[]
    )
    with patch("comments.get_supabase", return_value=mock_supabase):
        from comments import list_comments

        list_comments("strat-1", limit=500)
        limit_call = (
            mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.limit.call_args[0][0]
        )
        assert limit_call == 100  # tope máximo por página
        list_comments("strat-1")  # default 50
        limit_call = (
            mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.limit.call_args[0][0]
        )
        assert limit_call == 50


def test_delete_comment_by_author(mock_supabase):
    mock_supabase.table.return_value.delete.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[{"id": "cmt-1"}]
    )
    with patch("comments.get_supabase", return_value=mock_supabase):
        from comments import delete_comment

        result = delete_comment("cmt-1", MagicMock())
        assert result == {"ok": True}
        # Filtra por autor: solo puede borrar los suyos.
        # Cadena: delete().eq(id).eq(author_id) — la 2ª .eq vive en el sub-mock.
        builder = mock_supabase.table.return_value.delete.return_value
        eq_calls = [c.args[0] for c in builder.eq.call_args_list]
        eq_calls += [c.args[0] for c in builder.eq.return_value.eq.call_args_list]
        assert eq_calls == ["id", "author_id"]
        author_val = builder.eq.return_value.eq.call_args_list[-1].args[1]
        assert author_val == "00000000-0000-0000-0000-000000000001"


def test_delete_comment_of_other_author_404(mock_supabase):
    # El delete filtrado por author_id no afectó filas -> 404.
    mock_supabase.table.return_value.delete.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[]
    )
    with patch("comments.get_supabase", return_value=mock_supabase):
        from comments import delete_comment

        with pytest.raises(HTTPException) as exc:
            delete_comment("cmt-de-otro", MagicMock())
        assert exc.value.status_code == 404
