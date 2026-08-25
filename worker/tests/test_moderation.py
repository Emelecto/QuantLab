"""Tests de moderación UGC (reportes, admin) y rate limit de comentarios."""

import os
import sys
import time
from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from conftest import mock_supabase  # noqa: F401,E501  (fixture compartida)

USER = "00000000-0000-0000-0000-000000000001"
ADMIN = "00000000-0000-0000-0000-000000000009"


def _profile_rows(is_admin: bool):
    return [{"id": "p", "is_admin": is_admin}]


# ---------------------------------------------------------------------------
# require_admin
# ---------------------------------------------------------------------------
def test_require_admin_rejects_non_admin(mock_supabase):
    from moderation import require_admin

    mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = (
        MagicMock(data=_profile_rows(False))
    )
    with patch("moderation.get_supabase", return_value=mock_supabase):
        with patch("moderation.require_user", return_value=USER):
            request = MagicMock()
            with pytest.raises(HTTPException) as exc:
                require_admin(request)
            assert exc.value.status_code == 403


def test_require_admin_accepts_admin(mock_supabase):
    from moderation import require_admin

    mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = (
        MagicMock(data=_profile_rows(True))
    )
    with patch("moderation.get_supabase", return_value=mock_supabase):
        with patch("moderation.require_user", return_value=ADMIN):
            request = MagicMock()
            assert require_admin(request) == ADMIN


# ---------------------------------------------------------------------------
# POST /moderation/report
# ---------------------------------------------------------------------------
def test_create_report_ok(mock_supabase):
    import moderation

    # El objetivo existe.
    exists_res = MagicMock(data=[{"id": "cmt-1"}])
    insert_res = MagicMock(data=[{"id": "rep-1"}])

    def table(name):
        t = MagicMock()
        if name == "marketplace_comments":
            t.select.return_value.eq.return_value.execute.return_value = exists_res
        elif name == "content_reports":
            t.insert.return_value.execute.return_value = insert_res
        return t

    mock_supabase.table.side_effect = table

    body = moderation.ReportBody(
        target_type="comment", target_id="cmt-1", reason="spam evidente"
    )
    with patch("moderation.get_supabase", return_value=mock_supabase):
        with patch("moderation.require_user", return_value=USER):
            out = moderation.create_report(body, MagicMock())
    assert out == {"id": "rep-1", "status": "open"}


def test_create_report_target_missing_404(mock_supabase):
    import moderation

    def table(name):
        t = MagicMock()
        if name == "marketplace_comments":
            t.select.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[]
            )
        return t

    mock_supabase.table.side_effect = table
    body = moderation.ReportBody(
        target_type="comment", target_id="nope", reason="x"
    )
    with patch("moderation.get_supabase", return_value=mock_supabase):
        with patch("moderation.require_user", return_value=USER):
            with pytest.raises(HTTPException) as exc:
                moderation.create_report(body, MagicMock())
    assert exc.value.status_code == 404


# ---------------------------------------------------------------------------
# Resolución / descarte (admin)
# ---------------------------------------------------------------------------
@pytest.mark.parametrize("endpoint,status", [
    ("resolve_report", "resolved"),
    ("dismiss_report", "dismissed"),
])
def test_resolve_dispatch(mock_supabase, endpoint, status):
    mod = __import__("moderation")
    update_res = MagicMock(data=[{"id": "rep-1", "status": status}])
    mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value = (
        update_res
    )
    fn = getattr(mod, endpoint)
    with patch.object(mod, "_is_admin", return_value=True), \
         patch("moderation.get_supabase", return_value=mock_supabase), \
         patch("moderation.require_user", return_value=ADMIN):
        out = fn("rep-1", MagicMock())
    assert out["status"] == status


def test_resolve_missing_report_404(mock_supabase):
    from moderation import resolve_report

    mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value = (
        MagicMock(data=[])
    )
    with patch("moderation.get_supabase", return_value=mock_supabase):
        with patch("moderation.require_admin", return_value=ADMIN):
            with pytest.raises(HTTPException) as exc:
                resolve_report("nope", MagicMock())
    assert exc.value.status_code == 404


def test_admin_delete_comment_ok(mock_supabase):
    from moderation import admin_delete_comment

    mock_supabase.table.return_value.delete.return_value.eq.return_value.execute.return_value = (
        MagicMock(data=[{"id": "cmt-1"}])
    )
    with patch("moderation.get_supabase", return_value=mock_supabase):
        with patch("moderation.require_admin", return_value=ADMIN):
            out = admin_delete_comment("cmt-1", MagicMock())
    assert out == {"ok": True}


def test_admin_delete_comment_404(mock_supabase):
    from moderation import admin_delete_comment

    mock_supabase.table.return_value.delete.return_value.eq.return_value.execute.return_value = (
        MagicMock(data=[])
    )
    with patch("moderation.get_supabase", return_value=mock_supabase):
        with patch("moderation.require_admin", return_value=ADMIN):
            with pytest.raises(HTTPException) as exc:
                admin_delete_comment("nope", MagicMock())
    assert exc.value.status_code == 404


# ---------------------------------------------------------------------------
# Rate limit de comentarios (5/min)
# ---------------------------------------------------------------------------
def test_rate_limit_blocks_sixth_comment():
    from comments import _check_rate_limit, _comment_times

    _comment_times.clear()  # aísla este test del estado global
    for _ in range(5):
        _check_rate_limit(USER)
    with pytest.raises(HTTPException) as exc:
        _check_rate_limit(USER)
    assert exc.value.status_code == 429


def test_rate_limit_window_expires():
    import comments as c

    c._comment_times.clear()
    # Simula comentarios con más de 60s de antigüedad.
    old = time.monotonic() - c._RATE_WINDOW - 1
    c._comment_times[USER].append(old)
    # No debe lanzar: la ventana vieja se purga.
    c._check_rate_limit(USER)


def test_rate_limit_per_user_isolated():
    from comments import _check_rate_limit, _comment_times

    _comment_times.clear()
    other = "00000000-0000-0000-0000-000000000002"
    for _ in range(5):
        _check_rate_limit(USER)
    # Otro usuario NO está bloqueado.
    _check_rate_limit(other)
    _comment_times.clear()
