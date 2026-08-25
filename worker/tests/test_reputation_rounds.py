"""Tests de reputation_score en el leaderboard y rondas de torneo (/round).

Correr con: TESTING=1 python -m pytest tests/test_reputation_rounds.py -q

Supabase se mockea por completo: ninguna prueba toca la base de datos real.
Nombres de columnas verificados en supabase/migrations/0002_tournaments_marketplace.sql:
tabla `submissions` con `primary_score` (métrica primaria, deflated_sharpe_oos
por defecto) y `submitted_at` (orden temporal).
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException


# ---------------------------------------------------------------------------
# Stub de cadena estilo supabase-py: captura filtros y devuelve filas fijadas.
# ---------------------------------------------------------------------------


class FakeQuery:
    """Encadena select/eq/order/limit y responde con filas configuradas."""

    def __init__(self, fixed_rows=None, rows_by_user=None):
        self.fixed_rows = fixed_rows  # lista fija (ignora filtros)
        self.rows_by_user = rows_by_user or {}  # filas por user_id filtrado
        self.last_uid = None
        self.order_args = None
        self.order_kwargs = None
        self.limit_arg = None

    def select(self, *_args, **_kwargs):
        return self

    def eq(self, col, val):
        if col == "user_id":
            self.last_uid = val
        return self

    def order(self, *args, **kwargs):
        self.order_args = args
        self.order_kwargs = kwargs
        return self

    def limit(self, *args, **kwargs):
        self.limit_arg = args[0] if args else kwargs.get("count")
        return self

    def execute(self):
        if self.fixed_rows is not None:
            return MagicMock(data=list(self.fixed_rows))
        return MagicMock(data=list(self.rows_by_user.get(self.last_uid, [])))


def make_sb(routes: dict) -> MagicMock:
    """Cliente supabase mockeado: table(nombre) devuelve la cadena indicada."""
    sb = MagicMock()
    sb.table.side_effect = lambda name: routes[name]
    return sb


def _fake_request() -> MagicMock:
    req = MagicMock()
    req.headers = {"authorization": ""}
    return req


# ---------------------------------------------------------------------------
# Reputation score en el leaderboard
# ---------------------------------------------------------------------------


def test_leaderboard_reputation_es_promedio_de_las_ultimas_5():
    entries = [{"tournament_id": "t1", "user_id": "u1", "rank": 1, "score": 1.2, "qp_earned": 200}]
    # La DB devolvería exactamente las últimas 5 por submitted_at DESC (LIMIT 5).
    subs_q = FakeQuery(rows_by_user={"u1": [
        {"user_id": "u1", "primary_score": 2.0},
        {"user_id": "u1", "primary_score": 1.5},
        {"user_id": "u1", "primary_score": 1.0},
        {"user_id": "u1", "primary_score": 0.5},
        {"user_id": "u1", "primary_score": -0.5},
    ]})
    lb_q = FakeQuery(fixed_rows=entries)
    sb = make_sb({"leaderboard_entries": lb_q, "submissions": subs_q})

    with patch("tournaments.get_supabase", return_value=sb):
        from tournaments import tournament_leaderboard
        result = tournament_leaderboard("t1")

    esperado = round((2.0 + 1.5 + 1.0 + 0.5 - 0.5) / 5, 6)
    assert result[0]["reputation_score"] == pytest.approx(esperado)


def test_leaderboard_usuario_sin_submissions_da_null():
    entries = [
        {"tournament_id": "t1", "user_id": "u1", "rank": 1, "score": 1.0},
        {"tournament_id": "t1", "user_id": "sin_subs", "rank": 2, "score": 0.8},
    ]
    subs_q = FakeQuery(rows_by_user={"u1": [
        {"user_id": "u1", "primary_score": 1.0},
        {"user_id": "u1", "primary_score": 3.0},
    ]})
    lb_q = FakeQuery(fixed_rows=entries)
    sb = make_sb({"leaderboard_entries": lb_q, "submissions": subs_q})

    with patch("tournaments.get_supabase", return_value=sb):
        from tournaments import tournament_leaderboard
        result = tournament_leaderboard("t1")

    assert result[0]["reputation_score"] == pytest.approx(2.0)
    assert result[1]["reputation_score"] is None


def test_leaderboard_puntajes_nulos_no_se_promedian():
    entries = [{"tournament_id": "t1", "user_id": "u1", "rank": 1, "score": 1.0}]
    # Submissions pendientes (sin evaluar) traen primary_score null: se ignoran.
    subs_q = FakeQuery(rows_by_user={"u1": [
        {"user_id": "u1", "primary_score": None},
        {"user_id": "u1", "primary_score": 4.0},
        {"user_id": "u1", "primary_score": None},
        {"user_id": "u1", "primary_score": 6.0},
    ]})
    lb_q = FakeQuery(fixed_rows=entries)
    sb = make_sb({"leaderboard_entries": lb_q, "submissions": subs_q})

    with patch("tournaments.get_supabase", return_value=sb):
        from tournaments import tournament_leaderboard
        result = tournament_leaderboard("t1")

    assert result[0]["reputation_score"] == pytest.approx(5.0)


def test_leaderboard_solo_puntajes_nulos_da_null():
    entries = [{"tournament_id": "t1", "user_id": "u1", "rank": 1, "score": 0.9}]
    subs_q = FakeQuery(rows_by_user={"u1": [
        {"user_id": "u1", "primary_score": None},
        {"user_id": "u1", "primary_score": None},
    ]})
    lb_q = FakeQuery(fixed_rows=entries)
    sb = make_sb({"leaderboard_entries": lb_q, "submissions": subs_q})

    with patch("tournaments.get_supabase", return_value=sb):
        from tournaments import tournament_leaderboard
        result = tournament_leaderboard("t1")

    assert result[0]["reputation_score"] is None


def test_leaderboard_vacio_devuelve_lista_vacia():
    lb_q = FakeQuery(fixed_rows=[])
    submissions_q = FakeQuery()  # no debe consultarse
    sb = make_sb({"leaderboard_entries": lb_q, "submissions": submissions_q})

    with patch("tournaments.get_supabase", return_value=sb):
        from tournaments import tournament_leaderboard
        result = tournament_leaderboard("t-vacío")

    assert result == []
    assert not submissions_q.order_args  # nunca se consultó submissions


def test_leaderboard_mantiene_claves_existentes_aditivo():
    original = {
        "tournament_id": "t1", "user_id": "u1", "submission_id": "s1",
        "rank": 1, "score": 1.75, "qp_earned": 200,
        "badge_earned": "gold",
        "profiles": {"username": "ana", "display_name": "Ana", "avatar_url": None},
    }
    lb_q = FakeQuery(fixed_rows=[dict(original)])
    subs_q = FakeQuery(rows_by_user={"u1": [{"user_id": "u1", "primary_score": 2.0}]})
    sb = make_sb({"leaderboard_entries": lb_q, "submissions": subs_q})

    with patch("tournaments.get_supabase", return_value=sb):
        from tournaments import tournament_leaderboard
        result = tournament_leaderboard("t1")

    fila = result[0]
    for clave, valor in original.items():
        assert fila[clave] == valor  # claves existentes intactas
    assert set(original.keys()) | {"reputation_score"} == set(fila.keys())
    assert fila["reputation_score"] == pytest.approx(2.0)


def test_leaderboard_cada_usuario_tiene_su_propio_promedio():
    entries = [
        {"tournament_id": "t1", "user_id": "u1", "rank": 1, "score": 2.0},
        {"tournament_id": "t1", "user_id": "u2", "rank": 2, "score": 1.0},
    ]
    subs_q = FakeQuery(rows_by_user={
        "u1": [{"user_id": "u1", "primary_score": 3.0}, {"user_id": "u1", "primary_score": 1.0}],
        "u2": [{"user_id": "u2", "primary_score": 0.0}],
    })
    lb_q = FakeQuery(fixed_rows=entries)
    sb = make_sb({"leaderboard_entries": lb_q, "submissions": subs_q})

    with patch("tournaments.get_supabase", return_value=sb):
        from tournaments import tournament_leaderboard
        result = tournament_leaderboard("t1")

    repes = {f["user_id"]: f["reputation_score"] for f in result}
    assert repes["u1"] == pytest.approx(2.0)
    assert repes["u2"] == pytest.approx(0.0)


def test_reputation_consulta_ultimas_5_por_fecha_desc():
    entries = [{"tournament_id": "t1", "user_id": "u1", "rank": 1, "score": 1.0}]
    subs_q = FakeQuery(rows_by_user={"u1": [{"user_id": "u1", "primary_score": 1.0}]})
    lb_q = FakeQuery(fixed_rows=entries)
    sb = make_sb({"leaderboard_entries": lb_q, "submissions": subs_q})

    with patch("tournaments.get_supabase", return_value=sb):
        from tournaments import tournament_leaderboard
        tournament_leaderboard("t1")

    # Forma de la consulta: submitted_at DESC con LIMIT 5.
    assert subs_q.limit_arg == 5
    assert subs_q.order_args[0] == "submitted_at"
    assert subs_q.order_kwargs.get("desc") is True


# ---------------------------------------------------------------------------
# Endpoint /tournament/{id}/round
# ---------------------------------------------------------------------------


def test_round_abierta_con_deadline_futuro():
    futuro = (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat()
    t_row = {"id": "t1", "round_number": 3, "closes_at": futuro}
    sb = make_sb({"tournaments": FakeQuery(fixed_rows=[t_row])})

    with patch("tournaments.get_supabase", return_value=sb):
        from tournaments import tournament_round
        out = tournament_round("t1", _fake_request())

    assert out == {
        "tournament_id": "t1",
        "round_number": 3,
        "closes_at": futuro,
        "status": "open",
    }


def test_round_cerrada_con_deadline_pasado():
    pasado = (datetime.now(timezone.utc) - timedelta(minutes=30)).isoformat()
    t_row = {"id": "t1", "round_number": 7, "closes_at": pasado}
    sb = make_sb({"tournaments": FakeQuery(fixed_rows=[t_row])})

    with patch("tournaments.get_supabase", return_value=sb):
        from tournaments import tournament_round
        out = tournament_round("t1", _fake_request())

    assert out["status"] == "closed"
    assert out["round_number"] == 7


def test_round_sin_closes_at_esta_abierta_y_ronda_default_1():
    # Fila sin las nuevas columnas (antes de migrar): defaults seguros.
    t_row = {"id": "t1"}
    sb = make_sb({"tournaments": FakeQuery(fixed_rows=[t_row])})

    with patch("tournaments.get_supabase", return_value=sb):
        from tournaments import tournament_round
        out = tournament_round("t1", _fake_request())

    assert out["status"] == "open"
    assert out["closes_at"] is None
    assert out["round_number"] == 1


def test_round_formato_iso_con_z():
    t_row = {"id": "t1", "round_number": 2, "closes_at": "2020-01-01T00:00:00Z"}
    sb = make_sb({"tournaments": FakeQuery(fixed_rows=[t_row])})

    with patch("tournaments.get_supabase", return_value=sb):
        from tournaments import tournament_round
        out = tournament_round("t1", _fake_request())

    assert out["status"] == "closed"


def test_round_torneo_inexistente_da_404():
    sb = make_sb({"tournaments": FakeQuery(fixed_rows=[])})

    with patch("tournaments.get_supabase", return_value=sb):
        from tournaments import tournament_round
        with pytest.raises(HTTPException) as exc:
            tournament_round("no-existe", _fake_request())

    assert exc.value.status_code == 404


def test_round_endpoint_http_publico():
    """Ruta registrada en la app FastAPI y accesible sin autenticación."""
    from fastapi.testclient import TestClient
    from main import app

    futuro = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
    t_row = {"id": "11111111-1111-1111-1111-111111111111", "round_number": 5, "closes_at": futuro}
    sb = make_sb({"tournaments": FakeQuery(fixed_rows=[t_row])})

    client = TestClient(app)
    with patch("tournaments.get_supabase", return_value=sb):
        resp = client.get("/tournament/11111111-1111-1111-1111-111111111111/round")

    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "open"
    assert body["round_number"] == 5
    assert body["tournament_id"] == "11111111-1111-1111-1111-111111111111"
