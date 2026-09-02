"""Persistencia de datasets y submissions de torneos ML.

Funciones server-side (service_role). El holdout (dataset_targets) se escribe
aquí y NUNCA se expone al cliente (ver RLS en la migración 0011).
"""
from __future__ import annotations

import hashlib
import io
import logging
import os

import pandas as pd

import ml_storage as store
import dataset_builder as db
import scoring_ml as sc

logger = logging.getLogger(__name__)

_SALT = os.environ.get("DATASET_SALT") or os.environ.get(
    "SUPABASE_SERVICE_ROLE_KEY", ""
)[:32]


# ---------------------------------------------------------------------------
# Generación de una ronda (cron / scheduler)
# ---------------------------------------------------------------------------
def crear_dataset(tournament_id: str, round_number: int, mode: str = "sintetico",
                  closes_at=None, now=None, **gen_kwargs) -> dict:
    """Genera un dataset completo (train/validation/live), lo sube a Storage y
    guarda el holdout en dataset_targets. Devuelve el dict del dataset creado.

    Para 'real' se requiere `universo` (lista de (tipo, simbolo)).
    """
    from datetime import datetime, timezone
    now = now or datetime.now(timezone.utc)
    if mode == "sintetico":
        panel, cols, meta = db.generar_mercado_sintetico(**gen_kwargs)
    elif mode == "real":
        if "universo" not in gen_kwargs:
            raise ValueError("modo 'real' requiere 'universo'")
        panel, cols, meta = db.generar_panel_real(**gen_kwargs)
    else:
        raise ValueError(f"mode desconocido: {mode}")

    publico, interna, mapeos = db.obfuscar(panel, cols, salt=_SALT, seed=meta.get("seed", 0))
    partes = db.partir(interna)

    # Metadatos derivados del panel (no dependen de claves del meta del generador)
    n_activos = int(interna["activo_idx"].nunique()) if "activo_idx" in interna else int(panel["activo_idx"].nunique())
    n_eras = int(interna["era_idx"].nunique())

    from tournaments import get_supabase
    supabase = get_supabase()

    base = f"{mode}/{tournament_id[:8]}/r{round_number:03d}"
    recs = []
    for kind, df in (("train", partes["train"]), ("validation", partes["validation"])):
        path = f"{base}/{kind}.parquet"
        # Quitar columnas internas y el target real (nunca se publica).
        # era_idx es server-side; activo_idx/target_raw ya no existen en interno.
        df_pub = df.drop(columns=["era_idx", "activo_idx", "target_raw", "target"], errors="ignore")
        store.upload_parquet(df_pub, path)
        recs.append({
            "tournament_id": tournament_id,
            "round_number": round_number,
            "mode": mode,
            "kind": kind,
            "status": "ready",
            "n_assets": n_activos,
            "n_eras": int(df["era_idx"].nunique()),
            "n_features": len(mapeos["feat_cols"]),
            "feature_cols": mapeos["feat_cols"],
            "bucket_path": path,
            "row_count": len(df),
            "salt_hash": hashlib.sha256(_SALT.encode()).hexdigest()[:16],
            "ic_objetivo": meta.get("ic_objetivo"),
            "closes_at": closes_at,
            "created_at": now.isoformat(),
        })

    # Insertar los tres kind (train, validation, live-vacio que se llena abajo)
    inserted = []
    for r in recs:
        res = supabase.table("ml_datasets").insert(r).execute()
        inserted.append(res.data[0])

    # El live es privado: NO se sube a Storage. Guardamos su holdout en DB.
    live = partes["live"]
    live_rec = {
        "tournament_id": tournament_id,
        "round_number": round_number,
        "mode": mode,
        "kind": "live",
        "status": "ready",
        "n_assets": n_activos,
        "n_eras": int(live["era_idx"].nunique()),
        "n_features": len(mapeos["feat_cols"]),
        "feature_cols": mapeos["feat_cols"],
        "bucket_path": None,  # deliberadamente nulo: el live no se publica
        "row_count": len(live),
        "salt_hash": hashlib.sha256(_SALT.encode()).hexdigest()[:16],
        "ic_objetivo": meta.get("ic_objetivo"),
        "closes_at": closes_at,
        "created_at": now.isoformat(),
    }
    res = supabase.table("ml_datasets").insert(live_rec).execute()
    live_dataset = res.data[0]
    inserted.append(live_dataset)

    # Guardar holdout (target real por fila). SOLO service_role.
    # Incluimos las features del live: el worker las necesita para el FNC
    # (feature-neutral correlation). El cliente NO puede leer dataset_targets
    # (RLS), así que las features del live nunca se exponen.
    feat_cols = mapeos["feat_cols"]
    targets = live[["id", "target", "era"] + feat_cols].rename(columns={"id": "row_id"})
    targets = targets.assign(dataset_id=live_dataset["id"])
    supabase.table("dataset_targets").insert(targets.to_dict("records")).execute()

    logger.info(f"Dataset {mode} creado para torneo {tournament_id} ronda {round_number}: "
                f"{len(inserted)} registros, holdout {len(targets)} filas.")
    return live_dataset


# ---------------------------------------------------------------------------
# Scoring de una submission
# ---------------------------------------------------------------------------
def puntuar_submission_en_bd(submission_id: str, meta_modelo=None) -> dict:
    """Carga la submission + el holdout privado, puntúa y guarda el resultado.

    Si `meta_modelo` (Serie de predicciones del meta-modelo comunitario) se
    pasa, se usa para penalizar falta de originalidad (meta_corr > UMBRAL_PLAGIO).
    """
    from tournaments import get_supabase
    supabase = get_supabase()

    sub = supabase.table("prediction_submissions").select("*").eq("id", submission_id).execute()
    if not sub.data:
        raise ValueError("submission no encontrada")
    sub = sub.data[0]

    ds = supabase.table("ml_datasets").select("id,feature_cols").eq("id", sub["dataset_id"]).execute()
    feat_cols = (ds.data[0].get("feature_cols") or []) if ds.data else []

    # Descargar el CSV de predicciones del usuario desde Storage (o leer del campo).
    preds = _leer_predicciones(sub)
    if preds is None or len(preds) == 0:
        supabase.table("prediction_submissions").update({
            "status": "disqualified", "is_valid": False,
        }).eq("id", submission_id).execute()
        return {"status": "disqualified", "motivo": "sin predicciones"}

    # Holdout privado (incluye features para el FNC)
    # OJO: PostgREST capa a 1000 filas por query (db-max-rows). Sin paginar,
    # solo se puntuaban ~1000 filas del holdout -> n_eras ~2 -> todas las
    # submissions quedaban is_valid=false. Se pagina con offset+limit.
    cols = "row_id,target,era" + ("," + ",".join(feat_cols) if feat_cols else "")
    targets = []
    _off = 0
    while True:
        _page = supabase.table("dataset_targets").select(cols).eq(
            "dataset_id", sub["dataset_id"]
        ).offset(_off).limit(1000).execute()
        targets.extend(_page.data or [])
        if len(_page.data or []) < 1000:
            break
        _off += len(_page.data or [])
    tdf = pd.DataFrame(targets)
    merged = preds.merge(tdf, left_on="id", right_on="row_id", how="inner")
    if len(merged) == 0:
        supabase.table("prediction_submissions").update({
            "status": "disqualified", "is_valid": False,
        }).eq("id", submission_id).execute()
        return {"status": "disqualified", "motivo": "ids de prediccion no coinciden con el dataset"}
    if len(merged) < sc.MIN_ERAS:
        supabase.table("prediction_submissions").update({
            "status": "disqualified", "is_valid": False,
        }).eq("id", submission_id).execute()
        return {"status": "disqualified", "motivo": "filas insuficientes"}

    res = sc.puntuar_submission(
        merged["prediction"], merged["target"], merged["era"],
        merged[feat_cols] if feat_cols else merged.drop(columns=["id", "prediction", "target", "era", "row_id"]),
        meta_modelo=meta_modelo,
    )

    # Anti-plagio: comparar con otras submissions del mismo dataset
    otras = supabase.table("prediction_submissions").select("id").eq(
        "dataset_id", sub["dataset_id"]
    ).neq("id", submission_id).eq("is_valid", True).execute()
    plagio = False
    if otras.data:
        dfp = pd.DataFrame({"base": merged["prediction"].values})
        for s in otras.data:
            op = _leer_predicciones(s)
            if op is None or len(op) == 0:
                continue
            dfp[len(dfp.columns)] = op.iloc[:, 1].values
        if dfp.shape[1] > 1:
            pares = sc.matriz_similitud(dfp)
            # Sospechoso si el "base" (col 0) se parece a otra submission
            if any(p["a"] == "base" or p["b"] == "base" for p in pares):
                plagio = True

    supabase.table("prediction_submissions").update({
        "status": "scored", "is_valid": res["valida"], "plagio_flag": plagio,
        "score": res["score"], "corr_mean": res["corr_mean"], "fnc_mean": res["fnc_mean"],
        "consistencia": res["consistencia"], "meta_corr": res["meta_corr"],
        "scored_at": "now()",
    }).eq("id", submission_id).execute()
    return res


def _leer_predicciones(sub: dict) -> pd.DataFrame | None:
    """Lee el CSV de predicciones del usuario desde Storage.

    La ruta es determinista: `submissions/{dataset_id[:8]}/{user_id}.csv`.
    El esquema real de `prediction_submissions` NO tiene columna `file_path`,
    así que la reconstruimos desde dataset_id + user_id (ambos presentes en la
    fila). Si por compatibilidad la fila trae `file_path`, se prefiere.
    """
    if sub.get("_predicciones_df") is not None:
        return sub["_predicciones_df"]
    path = sub.get("file_path")
    if not path:
        path = f"submissions/{str(sub.get('dataset_id',''))[:8]}/{sub.get('user_id')}.csv"
    if not path:
        return None
    try:
        # Intentar CSV primero, luego parquet
        try:
            data = store.download_csv(path)
            return pd.read_csv(io.BytesIO(data))
        except Exception:
            return store.download_parquet(path)
    except Exception as e:
        logger.warning(f"No se pudo leer predicciones desde {path}: {e}")
        return None


def cargar_predicciones_validas(supabase, dataset_id) -> pd.DataFrame:
    """Trae las predicciones de subs is_valid=True del dataset y arma un DataFrame.

    Índice = row_id (columna `id` del CSV de la submission), columnas = submission
    id, valores = prediction. Devuelve un DataFrame vacío si no hay subs válidas.
    """
    subs = (
        supabase.table("prediction_submissions")
        .select("id,dataset_id,user_id,status,is_valid,plagio_flag")
        .eq("dataset_id", dataset_id)
        .eq("is_valid", True)
        .execute()
    )
    if not subs.data:
        return pd.DataFrame()
    series = {}
    for sub in subs.data:
        preds = _leer_predicciones(sub)
        if preds is None or len(preds) == 0:
            continue
        s = preds.set_index("id")["prediction"]
        s.name = sub["id"]
        series[sub["id"]] = s
    if not series:
        return pd.DataFrame()
    return pd.concat(series, axis=1)
