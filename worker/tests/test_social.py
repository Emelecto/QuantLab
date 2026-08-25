# Tests del sistema social: follows y feed de actividad.
# Correr con: TESTING=1 python -m pytest tests/test_social.py -q

import os

import pytest
from fastapi import HTTPException
from unittest.mock import MagicMock, patch


def _tables(mock_supabase, names):
    """Un MagicMock independiente por tabla (feed consulta follows + activity_log)."""
    tms = {n: MagicMock() for n in names}
    mock_supabase.table.side_effect = lambda name: tms[name]
    return tms


# ---------------------------------------------------------------------------
# follow / unfollow
# ---------------------------------------------------------------------------


def test_follow_ok(mock_supabase):
    mock_supabase.table.return_value.insert.return_value.execute.return_value = (
        MagicMock(data=[{"follower_id": "u1", "followed_id": "u2"}])
    )
    with patch("social.get_supabase", return_value=mock_supabase):
        from social import follow_user

        result = follow_user("user-2", MagicMock())
        assert result == {"ok": True, "following": True}
        args = mock_supabase.table.return_value.insert.call_args[0][0]
        assert args == {
            "follower_id": "00000000-0000-0000-0000-000000000001",
            "followed_id": "user-2",
        }


def test_follow_self_rejected(mock_supabase):
    with patch("social.get_supabase", return_value=mock_supabase):
        from social import follow_user

        with pytest.raises(HTTPException) as exc:
            follow_user(
                "00000000-0000-0000-0000-000000000001",  # uid fijo de TESTING
                MagicMock(),
            )
        assert exc.value.status_code == 400
        # Nunca llegó a insertar.
        mock_supabase.table.assert_not_called()


def test_unfollow_ok(mock_supabase):
    builder = mock_supabase.table.return_value.delete.return_value
    builder.eq.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[{"follower_id": "u1"}]
    )
    with patch("social.get_supabase", return_value=mock_supabase):
        from social import unfollow_user

        result = unfollow_user("user-2", MagicMock())
        assert result == {"ok": True, "following": False}
        eq_calls = [c.args[0] for c in builder.eq.call_args_list]
        eq_calls += [c.args[0] for c in builder.eq.return_value.eq.call_args_list]
        assert eq_calls == ["follower_id", "followed_id"]
        followed_val = builder.eq.return_value.eq.call_args_list[-1].args[1]
        assert followed_val == "user-2"


def test_unfollow_when_not_following_404(mock_supabase):
    mock_supabase.table.return_value.delete.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[]
    )
    with patch("social.get_supabase", return_value=mock_supabase):
        from social import unfollow_user

        with pytest.raises(HTTPException) as exc:
            unfollow_user("user-desconocido", MagicMock())
        assert exc.value.status_code == 404


# ---------------------------------------------------------------------------
# feed personalizado (auth)
# ---------------------------------------------------------------------------


def _configure_feed(tables, followed_ids, rows):
    """Configura follows -> ids seguidos y activity_log -> filas del feed."""
    tables["follows"].select.return_value.eq.return_value.execute.return_value = (
        MagicMock(data=[{"followed_id": fid} for fid in followed_ids])
    )
    tables[
        "activity_log"
    ].select.return_value.in_.return_value.order.return_value.limit.return_value.execute.return_value = (
        MagicMock(data=rows)
    )


def test_feed_includes_own_and_followed(mock_supabase):
    tables = _tables(mock_supabase, ["follows", "activity_log"])
    rows = [
        {
            "id": 7,
            "actor_id": "user-2",
            "action": "published_strategy",
            "target_type": "marketplace_strategy",
            "target_id": "strat-9",
            "meta": {"title": "Momentum"},
            "created_at": "2026-08-20T10:00:00+00:00",
            "profiles": {"username": "ana"},
        },
    ]
    _configure_feed(tables, ["user-2", "user-3"], rows)
    with patch("social.get_supabase", return_value=mock_supabase):
        from social import social_feed

        result = social_feed(MagicMock())
        assert len(result) == 1
        ev = result[0]
        assert ev["username"] == "ana"
        assert ev["action"] == "published_strategy"
        assert ev["meta"] == {"title": "Momentum"}
        # Formato plano del evento.
        assert set(ev.keys()) == {
            "id", "actor_id", "username", "action",
            "target_type", "target_id", "meta", "created_at",
        }
        # El filtro .in_ incluye a los seguidos Y al propio usuario.
        in_call = tables["activity_log"].select.return_value.in_.call_args
        assert in_call.args[0] == "actor_id"
        assert set(in_call.args[1]) == {
            "user-2", "user-3", "00000000-0000-0000-0000-000000000001",
        }
        # Orden descendente por created_at.
        order_kwargs = tables[
            "activity_log"
        ].select.return_value.in_.return_value.order.call_args.kwargs
        assert order_kwargs.get("desc") is True


def test_feed_without_follows_only_own_activity(mock_supabase):
    tables = _tables(mock_supabase, ["follows", "activity_log"])
    _configure_feed(tables, [], [])
    with patch("social.get_supabase", return_value=mock_supabase):
        from social import social_feed

        result = social_feed(MagicMock())
        assert result == []
        in_call = (
            tables["activity_log"].select.return_value.in_.call_args
        )
        assert list(in_call.args[1]) == ["00000000-0000-0000-0000-000000000001"]


def test_feed_limit_clamped(mock_supabase):
    tables = _tables(mock_supabase, ["follows", "activity_log"])
    _configure_feed(tables, [], [])
    with patch("social.get_supabase", return_value=mock_supabase):
        from social import social_feed

        social_feed(MagicMock(), limit=500)
        limit_call = (
            tables["activity_log"]
            .select.return_value.in_.return_value.order.return_value.limit.call_args[0][0]
        )
        assert limit_call == 100  # tope máximo por página


def test_feed_requires_auth(mock_supabase):
    # Sin TESTING, require_user sin token válido lanza 401.
    with patch("social.get_supabase", return_value=mock_supabase), patch(
        "auth.get_user_id_from_request", return_value=None
    ):
        os.environ.pop("TESTING", None)
        try:
            from social import social_feed

            with pytest.raises(HTTPException) as exc:
                social_feed(MagicMock())
            assert exc.value.status_code == 401
        finally:
            os.environ["TESTING"] = "1"


# ---------------------------------------------------------------------------
# actividad global (pública)
# ---------------------------------------------------------------------------


def test_global_activity_public(mock_supabase):
    tables = _tables(mock_supabase, ["activity_log"])
    rows = [
        {
            "id": 3,
            "actor_id": "u1",
            "action": "tournament_submission",
            "target_type": "tournament",
            "target_id": "t-1",
            "meta": {},
            "created_at": "2026-08-21T09:00:00+00:00",
            "profiles": {"username": "bruno"},
        },
        {
            "id": 2,
            "actor_id": "u2",
            "action": "comment_added",
            "target_type": None,
            "target_id": None,
            "meta": {},
            "created_at": "2026-08-21T08:00:00+00:00",
            "profiles": None,
        },
    ]
    tables[
        "activity_log"
    ].select.return_value.order.return_value.limit.return_value.execute.return_value = (
        MagicMock(data=rows)
    )
    with patch("social.get_supabase", return_value=mock_supabase):
        from social import global_activity

        result = global_activity()
        assert len(result) == 2
        assert result[0]["username"] == "bruno"
        assert result[1]["username"] is None  # join izquierdo sin perfil
        # Público: no filtra por actor (no hay llamada a .in_ ni a .eq).
        assert not tables["activity_log"].select.return_value.in_.called
        order_kwargs = (
            tables["activity_log"].select.return_value.order.call_args.kwargs
        )
        assert order_kwargs.get("desc") is True


def test_global_activity_limit_default_30(mock_supabase):
    tables = _tables(mock_supabase, ["activity_log"])
    tables[
        "activity_log"
    ].select.return_value.order.return_value.limit.return_value.execute.return_value = (
        MagicMock(data=[])
    )
    with patch("social.get_supabase", return_value=mock_supabase):
        from social import global_activity

        global_activity()
        limit_call = (
            tables["activity_log"]
            .select.return_value.order.return_value.limit.call_args[0][0]
        )
        assert limit_call == 30


# ---------------------------------------------------------------------------
# log_activity best-effort
# ---------------------------------------------------------------------------


def test_log_activity_inserts_event(mock_supabase):
    with patch("social.get_supabase", return_value=mock_supabase):
        from social import log_activity

        log_activity(
            "u1",
            "published_strategy",
            target_type="marketplace_strategy",
            target_id="strat-1",
            meta={"title": "Alpha"},
        )
        args = mock_supabase.table.return_value.insert.call_args[0][0]
        assert args["actor_id"] == "u1"
        assert args["action"] == "published_strategy"
        assert args["target_id"] == "strat-1"
        assert args["meta"] == {"title": "Alpha"}


def test_log_activity_never_raises(mock_supabase):
    # Supabase caído: la función traga la excepción y no rompe al llamador.
    broken = MagicMock()
    broken.table.side_effect = RuntimeError("supabase down")
    with patch("social.get_supabase", return_value=broken):
        from social import log_activity

        log_activity("u1", "tournament_submission")  # no debe lanzar
