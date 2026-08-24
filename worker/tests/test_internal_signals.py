# Tests de: POST /internal/tokens/grant, GET /marketplace/{id}/signals
# y generación semanal de señales (scheduler.generate_weekly_signals).
# Correr con: TESTING=1 python -m pytest tests/test_internal_signals.py -q

from datetime import datetime, timezone
from unittest.mock import MagicMock, patch

import pandas as pd
import pytest
from fastapi import HTTPException


# ---------------------------------------------------------------------------
# POST /internal/tokens/grant
# ---------------------------------------------------------------------------

def _grant_body(user_id="u-123", amount=50, memo=None):
    from tournaments import GrantBody
    return GrantBody(user_id=user_id, amount=amount, memo=memo)


def test_grant_new_user_creates_row(mock_supabase, monkeypatch):
    monkeypatch.setenv("SCHEDULER_KEY", "secret")
    mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[]
    )
    with patch("tournaments.get_supabase", return_value=mock_supabase):
        from tournaments import internal_tokens_grant
        result = internal_tokens_grant(_grant_body(amount=75), "secret")
        assert result == {"user_id": "u-123", "balance": 75}
        # Primer insert = fila de tokens con tier free y lifetime_earned=75
        tokens_payload = mock_supabase.table.return_value.insert.call_args_list[0]
        row = tokens_payload.kwargs if tokens_payload.kwargs else tokens_payload.args[0]
        assert row["tier"] == "free"
        assert row["balance"] == 75


def test_grant_existing_user_accumulates(mock_supabase, monkeypatch):
    monkeypatch.setenv("SCHEDULER_KEY", "secret")
    mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[{"balance": 100, "lifetime_earned": 200, "lifetime_spent": 10, "tier": "free"}]
    )
    with patch("tournaments.get_supabase", return_value=mock_supabase):
        from tournaments import internal_tokens_grant
        result = internal_tokens_grant(_grant_body(amount=-30), "secret")
        assert result["balance"] == 70
        update_kwargs = (
            mock_supabase.table.return_value.update.call_args.kwargs
            or mock_supabase.table.return_value.update.call_args.args[0]
        )
        assert update_kwargs["lifetime_spent"] == 40  # 10 + 30


def test_grant_ledger_type_stripe_vs_admin(mock_supabase, monkeypatch):
    monkeypatch.setenv("SCHEDULER_KEY", "secret")
    mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[]
    )
    with patch("tournaments.get_supabase", return_value=mock_supabase):
        from tournaments import internal_tokens_grant
        internal_tokens_grant(_grant_body(memo="Compra Stripe plan plus"), "secret")
        internal_tokens_grant(_grant_body(memo="ajuste manual"), "secret")
        ledger_types = [
            (c.kwargs.get("type") if c.kwargs else c.args[0]["type"])
            for c in mock_supabase.table.return_value.insert.call_args_list
            if (c.kwargs.get("type") if c.kwargs else "type" in c.args[0])
        ]
        assert ledger_types == ["stripe_purchase", "admin_grant"]


def test_grant_rejects_wrong_key(mock_supabase, monkeypatch):
    monkeypatch.setenv("SCHEDULER_KEY", "real-key")
    with patch("tournaments.get_supabase", return_value=mock_supabase):
        from tournaments import internal_tokens_grant
        with pytest.raises(HTTPException) as exc:
            internal_tokens_grant(_grant_body(), "wrong-key")
        assert exc.value.status_code == 401


def test_grant_rejects_when_env_missing(mock_supabase, monkeypatch):
    monkeypatch.delenv("SCHEDULER_KEY", raising=False)
    with patch("tournaments.get_supabase", return_value=mock_supabase):
        from tournaments import internal_tokens_grant
        with pytest.raises(HTTPException) as exc:
            internal_tokens_grant(_grant_body(), "cualquier-cosa")
        assert exc.value.status_code == 401


# ---------------------------------------------------------------------------
# GET /marketplace/{strategy_id}/signals
# ---------------------------------------------------------------------------

def test_marketplace_signals_public_list(mock_supabase):
    mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[{"id": "s1"}]  # la estrategia existe
    )
    mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.limit.return_value.execute.return_value = MagicMock(
        data=[{"id": "g1", "direction": "long"}, {"id": "g2", "direction": "short"}]
    )
    with patch("tournaments.get_supabase", return_value=mock_supabase):
        from tournaments import marketplace_signals
        result = marketplace_signals("s1")
        assert len(result) == 2


def test_marketplace_signals_404(mock_supabase):
    mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[]
    )
    with patch("tournaments.get_supabase", return_value=mock_supabase):
        from tournaments import marketplace_signals
        with pytest.raises(HTTPException) as exc:
            marketplace_signals("no-existe")
        assert exc.value.status_code == 404


def test_marketplace_signals_limit_capped(mock_supabase):
    mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[{"id": "s1"}]
    )
    mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.limit.return_value.execute.return_value = MagicMock(
        data=[]
    )
    with patch("tournaments.get_supabase", return_value=mock_supabase):
        from tournaments import marketplace_signals
        marketplace_signals("s1", limit=999)
        limit_arg = (
            mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.limit.call_args.args[0]
        )
        assert limit_arg == 100


# ---------------------------------------------------------------------------
# generate_weekly_signals
# ---------------------------------------------------------------------------

def _fake_df():
    idx = pd.date_range("2026-06-15", periods=40, freq="D", tz="UTC")
    return pd.DataFrame({"close": [100.0 + i for i in range(40)]}, index=idx)


def _signal_supabase(strategies, dup_data=None):
    """Supabase mock con cadenas separadas para estrategias y anti-duplicado."""
    sb = MagicMock()
    sb.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(
        data=strategies
    )
    sb.table.return_value.select.return_value.eq.return_value.eq.return_value.gte.return_value.execute.return_value = MagicMock(
        data=dup_data if dup_data is not None else []
    )
    return sb


NOW = datetime(2026, 8, 20, 12, 0, tzinfo=timezone.utc)


def test_generate_weekly_signals_inserts_momentum_signal():
    sb = _signal_supabase([
        {"id": "s1", "symbol": "BTCUSDT", "asset_type": "crypto", "timeframe": "1d"},
    ])
    with patch("scheduler.data_feed.get_ohlcv", return_value=_fake_df()) as feed:
        from scheduler import generate_weekly_signals
        count = generate_weekly_signals(sb, NOW)
    assert count == 1
    feed.assert_called_once()
    args = feed.call_args.args
    assert args[0] == "crypto" and args[1] == "BTCUSDT"
    payload = (
        sb.table.return_value.insert.call_args.kwargs
        or sb.table.return_value.insert.call_args.args[0]
    )
    assert payload["strategy_id"] == "s1"
    assert payload["symbol"] == "BTCUSDT"
    assert payload["direction"] == "long"  # 136 -> 139 sube
    assert payload["strength"] == 0.22     # min(|ret|*10, 0.99), 2 decimales
    assert payload["metadata"]["basis"] == "momentum_30d"
    assert payload["metadata"]["close_last"] == 139.0
    assert payload["metadata"]["close_prev"] == 136.0
    # Purga de señales >7 días antes de insertar
    sb.table.return_value.delete.assert_called_once()


def test_generate_weekly_signals_short_direction():
    sb = _signal_supabase([
        {"id": "s2", "symbol": "AAPL", "asset_type": "stock", "timeframe": "1d"},
    ])
    df = _fake_df()
    df["close"] = df["close"].iloc[::-1].values  # cae: short
    with patch("scheduler.data_feed.get_ohlcv", return_value=df):
        from scheduler import generate_weekly_signals
        count = generate_weekly_signals(sb, NOW)
    assert count == 1
    payload = (
        sb.table.return_value.insert.call_args.kwargs
        or sb.table.return_value.insert.call_args.args[0]
    )
    assert payload["direction"] == "short"


def test_generate_weekly_signals_fetch_failure_isolated():
    sb = _signal_supabase([
        {"id": "bad", "symbol": "XXXXX", "asset_type": "crypto", "timeframe": "1d"},
        {"id": "good", "symbol": "ETHUSDT", "asset_type": "crypto", "timeframe": "1d"},
    ])
    with patch("scheduler.data_feed.get_ohlcv", side_effect=[ValueError("red"), _fake_df()]):
        from scheduler import generate_weekly_signals
        count = generate_weekly_signals(sb, NOW)
    assert count == 1  # el fallo del primero no rompe al segundo
    assert sb.table.return_value.insert.called


def test_generate_weekly_signals_skips_today_duplicate():
    sb = _signal_supabase(
        [{"id": "s1", "symbol": "BTCUSDT", "asset_type": "crypto", "timeframe": "1d"}],
        dup_data=[{"id": "ya-existe"}],
    )
    with patch("scheduler.data_feed.get_ohlcv") as feed:
        from scheduler import generate_weekly_signals
        count = generate_weekly_signals(sb, NOW)
    assert count == 0
    feed.assert_not_called()  # chequeo previo evita el fetch
    assert not sb.table.return_value.insert.called


def test_evaluate_tournaments_calls_generate_weekly_signals():
    sb = _signal_supabase([])  # sin torneos cerrados ni estrategias
    fake_engine = MagicMock()
    from scheduler import evaluate_tournaments
    evaluated = evaluate_tournaments(sb, fake_engine, NOW)
    assert evaluated == 0
    # La generación de señales se invoca al final del run
    assert sb.table.return_value.delete.called
