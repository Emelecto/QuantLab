# Tests de tokens QP.
# Correr con: TESTING=1 python -m pytest tests/test_tokens.py -q

import pytest
from unittest.mock import MagicMock, patch


def _chain_mock(data):
    """Crea un mock que soporta .eq().eq().execute() devolviendo data."""
    m = MagicMock()
    m.eq.return_value = m
    m.execute.return_value = MagicMock(data=data)
    return m


def test_balance_new_user(mock_supabase):
    mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(
        data=None
    )
    with patch("tournaments.get_supabase", return_value=mock_supabase):
        from tournaments import tokens_balance
        result = tokens_balance(MagicMock())
        assert result["balance"] == 0
        assert result["tier"] == "free"


def test_balance_existing_user(mock_supabase):
    mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[{"balance": 150, "lifetime_earned": 200, "lifetime_spent": 50, "tier": "plus"}]
    )
    with patch("tournaments.get_supabase", return_value=mock_supabase):
        from tournaments import tokens_balance
        result = tokens_balance(MagicMock())
        assert result["balance"] == 150


def test_purchase_qp(mock_supabase):
    mock_supabase.table.return_value.insert.return_value.execute.return_value = MagicMock(data=None)
    mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[{"balance": 100}]
    )
    with patch("tournaments.get_supabase", return_value=mock_supabase):
        from tournaments import tokens_transaction
        result = tokens_transaction(MagicMock(amount=100, type="purchase"), MagicMock())
        assert result["balance"] == 100


def test_ledger_entries(mock_supabase):
    mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.limit.return_value.execute.return_value = MagicMock(
        data=[
            {"id": "l1", "amount": 100, "type": "purchase", "created_at": "2024-01-01"},
            {"id": "l2", "amount": -10, "type": "tournament_entry", "created_at": "2024-01-02"},
        ]
    )
    with patch("tournaments.get_supabase", return_value=mock_supabase):
        from tournaments import tokens_ledger
        result = tokens_ledger(MagicMock())
        assert len(result) == 2


def test_ledger_empty(mock_supabase):
    mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.limit.return_value.execute.return_value = MagicMock(
        data=[]
    )
    with patch("tournaments.get_supabase", return_value=mock_supabase):
        from tournaments import tokens_ledger
        result = tokens_ledger(MagicMock())
        assert result == []
