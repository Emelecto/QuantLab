"""Tareas del scheduler para torneos ML (modelo Numerai).

Se suman al scheduler existente sin tocar los flujos de código. El nuevo flujo
usa predicciones sobre datasets obfuscados; el de código (submissions) queda
como está (aunque el frontend lo retirará).
"""
from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone

logger = logging.getLogger(__name__)


def create_ml_round(supabase_client, mode: str = "sintetico", now: datetime | None = None,
                    round_days: int = 4, **gen_kwargs) -> dict | None:
    """Crea una ronda de predicciones ML (dataset sintético o real).

    Cadencia rápida (decisión de Emilio): rondas cortas de `round_days` días.
    Si ya hay una ronda abierta reciente, no duplica.
    """
    now = now or datetime.now(timezone.utc)
    recent = (
        supabase_client.table("ml_datasets")
        .select("id")
        .eq("kind", "live")
        .eq("status", "ready")
        .gte("created_at", (now - timedelta(days=round_days)).isoformat())
        .execute()
    )
    if recent.data:
        logger.info("Ronda ML ya existe reciente, se omite creación.")
        return None

    # Torneo contenedor (uno por modo, reutilizado). Lo creamos si falta.
    torneo = supabase_client.table("tournaments").select("id").eq(
        "slug", f"ml-{mode}"
    ).execute()
    if torneo.data:
        tid = torneo.data[0]["id"]
    else:
        res = supabase_client.table("tournaments").insert({
            "name": f"Torneo ML · {mode}",
            "slug": f"ml-{mode}",
            "type": "ml",
            "status": "open",
            "asset_type": "synthetic" if mode == "sintetico" else "mixed",
            "symbols": [],
            "timeframe": "1d",
            "data_start": str((now - timedelta(days=400)).date()),
            "data_end": str(now.date()),
            "eval_end": str(now.date()),
            "submission_deadline": (now + timedelta(days=round_days)).isoformat(),
            "prize_pool_qp": 100 if mode == "sintetico" else 300,
            "primary_metric": "ml_score",
            "min_trades": 0,
            "max_slippage_pct": 0.005,
            "rules_text": "Sube predicciones (id,prediction) sobre el dataset. Se puntúa por "
                          "correlación de Spearman + FNC (feature-neutral) + consistencia.",
        }).execute()
        tid = res.data[0]["id"]

    # Número de ronda
    last = supabase_client.table("ml_datasets").select("round_number").eq(
        "tournament_id", tid
    ).order("round_number", desc=True).limit(1).execute()
    ronda = (last.data[0]["round_number"] + 1) if last.data else 1

    closes_at = (now + timedelta(days=round_days)).isoformat()
    import ml_persist
    live = ml_persist.crear_dataset(
        tid, ronda, mode=mode, closes_at=closes_at, now=now, **gen_kwargs
    )
    logger.info(f"Ronda ML {mode} #{ronda} creada (dataset live {live['id']}).")
    return live


def evaluate_ml_rounds(supabase_client, now: datetime | None = None) -> int:
    """Evalúa submissions de rondas ML cuyo cierre ya pasó.

    Por cada dataset live con closes_at en el pasado y submissions pendientes:
    puntúa, rankea y reparte QP.
    """
    now = now or datetime.now(timezone.utc)
    live_ds = (
        supabase_client.table("ml_datasets")
        .select("id,tournament_id,round_number,closes_at")
        .eq("kind", "live")
        .eq("status", "ready")
        .execute()
    )
    evaluados = 0
    for ds in live_ds.data or []:
        if ds.get("closes_at") and ds["closes_at"] > now.isoformat():
            continue  # ronda aún abierta
        pending = (
            supabase_client.table("prediction_submissions")
            .select("id")
            .eq("dataset_id", ds["id"])
            .eq("status", "pending")
            .execute()
        )
        if not pending.data:
            continue
        import ml_persist
        for sub in pending.data:
            try:
                ml_persist.puntuar_submission_en_bd(sub["id"])
                # Notificar al usuario que su submission fue evaluada
                try:
                    from notifications import notify_user
                    notify_user(
                        user_id=sub["user_id"],
                        type="submission_scored",
                        title="Tu submission fue evaluada",
                        body=f"Recibiste un score en el torneo ML. Revisa el ranking.",
                        link="/app/tournaments",
                    )
                except Exception:
                    pass
            except Exception as e:  # noqa: BLE001
                logger.warning(f"Score falló para submission {sub['id']}: {e}")
        # Cerrar ronda y repartir QP
        _distribute_ml_qp(supabase_client, ds["id"])
        supabase_client.table("ml_datasets").update({"status": "scored"}).eq(
            "id", ds["id"]
        ).execute()
        evaluados += 1
    return evaluados


def _distribute_ml_qp(supabase_client, dataset_id: str):
    """Rankea submissions válidas y reparte QP por posición (reusa _credit_qp).

    Antes de repartir QP construye el meta-modelo comunitario (solo con subs
    score>0) y re-puntúa cada submission penalizando falta de originalidad.
    """
    import numpy as np
    import pandas as pd
    from scheduler import _credit_qp  # evita import circular en tests

    import ml_persist
    import scoring_ml as sc

    # --- Meta-modelo comunitario: se construye SOLO con subs score>0 ---
    preds_df = ml_persist.cargar_predicciones_validas(supabase_client, dataset_id)
    meta = None
    if not preds_df.empty:
        # scores desde BD para descartar subs no aportantes (score <= 0)
        score_rows = (
            supabase_client.table("prediction_submissions")
            .select("id,score")
            .eq("dataset_id", dataset_id)
            .eq("is_valid", True)
            .execute()
        )
        score_map = {r["id"]: (r.get("score") or 0) for r in (score_rows.data or [])}
        cols_validas = [c for c in preds_df.columns if score_map.get(c, 0) > 0]
        if cols_validas:
            # pesos = softmax de los scores: más score -> más peso en el meta-modelo
            s = np.asarray([score_map[c] for c in cols_validas], dtype=float)
            e = np.exp(s - s.max())
            pesos = pd.Series(e / e.sum(), index=cols_validas)
            meta = sc.stake_weight(preds_df[cols_validas], pesos)

    # --- Persistir el meta-modelo comunitario como SEÑAL VIVA del marketplace ---
    # Se guarda en consensus_signals (upsert por (tournament_id, round_number)) para
    # que el endpoint /marketplace/consensus-signal lo exponga. Si la migración 0013
    # aún no está aplicada, no rompemos el flujo de la ronda: logueamos y seguimos.
    if meta is not None and len(meta) > 0:
        try:
            ds_meta = (
                supabase_client.table("ml_datasets")
                .select("tournament_id,round_number")
                .eq("id", dataset_id)
                .execute()
            )
            if ds_meta.data:
                info = ds_meta.data[0]
                supabase_client.table("consensus_signals").upsert({
                    "tournament_id": info.get("tournament_id"),
                    "round_number": info.get("round_number"),
                    "dataset_id": dataset_id,
                    "signal_json": meta.to_dict(),
                }, on_conflict="tournament_id,round_number").execute()
                logger.info(
                    f"Meta-modelo comunitario persistido en consensus_signals "
                    f"(torneo {info.get('tournament_id')}, ronda {info.get('round_number')}): "
                    f"{len(meta)} señales)."
                )
        except Exception as e:  # noqa: BLE001
            logger.warning(
                f"No se pudo guardar consensus_signals (¿migración 0013 no aplicada?): {e}"
            )

    # --- Re-puntuar cada submission con el meta-modelo alineado por índice ---
    subs_validas = (
        supabase_client.table("prediction_submissions")
        .select("id")
        .eq("dataset_id", dataset_id)
        .eq("is_valid", True)
        .execute()
    )
    for sub in (subs_validas.data or []):
        ml_persist.puntuar_submission_en_bd(sub["id"], meta_modelo=meta)

    # --- Repartir QP (score ya incluye la penalización por meta_corr) ---
    subs = (
        supabase_client.table("prediction_submissions")
        .select("id,user_id,score")
        .eq("dataset_id", dataset_id)
        .eq("is_valid", True)
        .eq("plagio_flag", False)
        .order("score", desc=True)
        .execute()
    )
    prizes = {0: 100, 1: 50, 2: 25}
    for i, sub in enumerate(subs.data or []):
        if (sub.get("score") or 0) <= 0:
            continue
        prize = prizes.get(i, 5)
        supabase_client.table("prediction_submissions").update({
            "status": "scored",
        }).eq("id", sub["id"]).execute()
        _credit_qp(supabase_client, sub["user_id"], prize, "ml_tournament_prize", dataset_id)
    logger.info(f"QP distribuidos para dataset {dataset_id}: {len(subs.data or [])} subs.")
