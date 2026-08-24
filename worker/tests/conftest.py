# Fixtures compartidas para tests de torneos, tokens y marketplace.

import os
import sys
import pytest
from unittest.mock import MagicMock, patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


@pytest.fixture
def mock_supabase():
    """Cliente Supabase mockeado."""
    sb = MagicMock()
    # Default responses
    sb.table.return_value.select.return_value.execute.return_value = MagicMock(data=[])
    sb.table.return_value.insert.return_value.execute.return_value = MagicMock(data=[{"id": "test-id"}])
    sb.table.return_value.upsert.return_value.execute.return_value = MagicMock(data=None)
    return sb


@pytest.fixture
def sample_user():
    return {
        "id": "00000000-0000-0000-0000-000000000001",
        "email": "test@example.com",
        "username": "testuser",
        "display_name": "Test User",
    }


@pytest.fixture
def sample_tournament():
    return {
        "id": "00000000-0000-0000-0000-000000000002",
        "name": "Torneo de Prueba",
        "slug": "test-tournament",
        "type": "weekly",
        "status": "open",
        "asset_type": "crypto",
        "symbols": ["BTCUSDT"],
        "timeframe": "1d",
        "prize_pool_qp": 200,
        "min_trades": 10,
        "primary_metric": "deflated_sharpe_oos",
        "submission_deadline": "2024-12-31T00:00:00+00:00",
    }


@pytest.fixture
def sample_submission():
    return {
        "id": "00000000-0000-0000-0000-000000000003",
        "tournament_id": "00000000-0000-0000-0000-000000000002",
        "user_id": "00000000-0000-0000-0000-000000000001",
        "code": "fast=20,slow=50",
        "config": {"fast": 20, "slow": 50},
        "status": "pending",
        "qp_staked": 0,
    }
