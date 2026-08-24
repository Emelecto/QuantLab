# Tests del motor de torneos.
# Correr con: TESTING=1 python -m pytest tests/test_tournaments.py -q

import pytest
from unittest.mock import MagicMock, patch


def test_create_tournament(mock_supabase, sample_tournament):
    # create_weekly_tournament: select -> eq(type) -> in_(status) -> gte(created_at)
    mock_supabase.table.return_value.select.return_value.eq.return_value.in_.return_value.gte.return_value.execute.return_value = MagicMock(
        data=[]
    )
    mock_supabase.table.return_value.insert.return_value.execute.return_value = MagicMock(
        data=[sample_tournament]
    )
    from scheduler import create_weekly_tournament
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    result = create_weekly_tournament(mock_supabase, now)
    assert result is not None
    assert "id" in result


def test_list_tournaments(mock_supabase, sample_tournament):
    mock_supabase.table.return_value.select.return_value.order.return_value.execute.return_value = MagicMock(
        data=[sample_tournament]
    )
    with patch("tournaments.get_supabase", return_value=mock_supabase):
        from tournaments import tournament_list
        result = tournament_list()
        assert isinstance(result, list)
        assert len(result) >= 1


def test_list_tournaments_empty(mock_supabase):
    mock_supabase.table.return_value.select.return_value.order.return_value.execute.return_value = MagicMock(
        data=[]
    )
    with patch("tournaments.get_supabase", return_value=mock_supabase):
        from tournaments import tournament_list
        result = tournament_list()
        assert result == []


def test_list_tournaments_with_filter(mock_supabase, sample_tournament):
    # tournament_list con type filtra select -> eq -> order -> execute
    mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.execute.return_value = MagicMock(
        data=[sample_tournament]
    )
    with patch("tournaments.get_supabase", return_value=mock_supabase):
        from tournaments import tournament_list
        result = tournament_list(type="weekly")
        assert isinstance(result, list)


def test_leaderboard_empty(mock_supabase):
    mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.limit.return_value.execute.return_value = MagicMock(
        data=[]
    )
    with patch("tournaments.get_supabase", return_value=mock_supabase):
        from tournaments import tournament_leaderboard
        result = tournament_leaderboard("test-id")
        assert result == []


def test_leaderboard_with_entries(mock_supabase):
    entries = [
        {"rank": 1, "user_id": "u1", "score": 1.5, "qp_earned": 200},
        {"rank": 2, "user_id": "u2", "score": 1.0, "qp_earned": 100},
    ]
    mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.limit.return_value.execute.return_value = MagicMock(
        data=entries
    )
    with patch("tournaments.get_supabase", return_value=mock_supabase):
        from tournaments import tournament_leaderboard
        result = tournament_leaderboard("test-id")
        assert len(result) == 2


def test_distribute_qp_ranking(mock_supabase):
    subs = [
        {"id": "sub1", "user_id": "u1", "primary_score": 1.5, "integrity_label": "High", "qp_staked": 10},
        {"id": "sub2", "user_id": "u2", "primary_score": 1.0, "integrity_label": "High", "qp_staked": 10},
    ]
    # distribute_qp vive en scheduler.py y encadena eq x3 + order
    mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.eq.return_value.order.return_value.execute.return_value = MagicMock(
        data=subs
    )
    from scheduler import distribute_qp
    distribute_qp(mock_supabase, "test-tournament")
    assert mock_supabase.table.return_value.upsert.called


def test_evaluate_tournaments_no_pending(mock_supabase):
    mock_supabase.table.return_value.select.return_value.in_.return_value.execute.return_value = MagicMock(
        data=[]
    )
    from scheduler import evaluate_tournaments
    result = evaluate_tournaments(mock_supabase, MagicMock())
    assert result >= 0


def test_tournament_detail_found(mock_supabase, sample_tournament):
    mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[sample_tournament]
    )
    with patch("tournaments.get_supabase", return_value=mock_supabase):
        from tournaments import tournament_detail
        result = tournament_detail(sample_tournament["id"])
        assert result is not None


def test_tournament_detail_not_found(mock_supabase):
    mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[]
    )
    with patch("tournaments.get_supabase", return_value=mock_supabase):
        from tournaments import tournament_detail
        with pytest.raises(Exception):
            tournament_detail("nonexistent")
