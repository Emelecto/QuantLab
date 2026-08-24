# Tests de marketplace.
# Correr con: TESTING=1 python -m pytest tests/test_marketplace.py -q

import pytest
from unittest.mock import MagicMock, patch


def test_publish_strategy(mock_supabase):
    mock_supabase.table.return_value.insert.return_value.execute.return_value = MagicMock(
        data=[{"id": "strat-1"}]
    )
    with patch("tournaments.get_supabase", return_value=mock_supabase):
        from tournaments import marketplace_publish
        body = MagicMock(
            title="Test Strategy",
            description="Desc",
            tags=["btc"],
            asset_type="crypto",
            symbol="BTCUSDT",
            timeframe="1d",
            config={"fast": 20, "slow": 50},
            is_public_code=False,
            price_qp_week=10,
        )
        result = marketplace_publish(body, MagicMock())
        assert result["id"] == "strat-1"


def test_marketplace_list(mock_supabase):
    mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.execute.return_value = MagicMock(
        data=[
            {"id": "s1", "title": "Strat 1", "price_qp_week": 10, "subscribers": 5},
        ]
    )
    with patch("tournaments.get_supabase", return_value=mock_supabase):
        from tournaments import marketplace_list
        result = marketplace_list()
        assert len(result) >= 1


def test_marketplace_list_empty(mock_supabase):
    mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.execute.return_value = MagicMock(
        data=[]
    )
    with patch("tournaments.get_supabase", return_value=mock_supabase):
        from tournaments import marketplace_list
        result = marketplace_list()
        assert result == []


def test_subscribe_to_strategy(mock_supabase):
    # Mock: no hay suscripción previa
    mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[]
    )
    # Mock: estrategia existe
    mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[{"id": "strat-1", "price_qp_week": 0, "author_id": "author-1"}]
    )
    with patch("tournaments.get_supabase", return_value=mock_supabase):
        from tournaments import marketplace_subscribe
        result = marketplace_subscribe("strat-1", MagicMock())
        assert result["status"] == "active"


def test_signals_empty(mock_supabase):
    mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.limit.return_value.execute.return_value = MagicMock(
        data=[]
    )
    with patch("tournaments.get_supabase", return_value=mock_supabase):
        from tournaments import signals_list
        result = signals_list("strat-1")
        assert result == []


def test_signals_with_data(mock_supabase):
    signals = [
        {"id": "sig1", "direction": "long", "strength": 0.8, "created_at": "2024-01-01"},
        {"id": "sig2", "direction": "short", "strength": 0.6, "created_at": "2024-01-02"},
    ]
    mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.limit.return_value.execute.return_value = MagicMock(
        data=signals
    )
    with patch("tournaments.get_supabase", return_value=mock_supabase):
        from tournaments import signals_list
        result = signals_list("strat-1")
        assert len(result) == 2
