"""Persistencia de datasets y submissions de torneos ML.

Funciones server-side (service_role). El holdout (dataset_targets) se escribe
aquí y NUNCA se expone al cliente (ver RLS en la migración 0011).
"""
from __future__ import annotations

import hashlib
import io
import json
import logging
import os
import random
import time
from datetime import datetime, timezone

import pandas as pd

import ml_storage as store
import dataset_builder as db
import scoring_ml as sc

logger = logging.getLogger(__name__)

_SALT = os.environ.get("DATASET_SALT") or os.environ.get(
    "SUPABASE_SERVICE_ROLE_KEY", ""
)[:32]

# Reintento con backoff para operaciones de DB/Storage (igual política que
# ml_storage: exponencial + jitter, 4 intentos por defecto).
_DB_RETRY_ATTEMPTS = 4
_DB_RETRY_BASE_DELAY = 0.5


def _with_retry(fn, *, op: str):
    """Reintenta `fn()` con backoff exponencial + jitter."""
    last_exc: Exception | None = None
    for attempt in range(1, _DB_RETRY_ATTEMPTS + 1):
        try:
            return fn()
        except Exception as exc:
            last_exc = exc
            if attempt >= _DB_RETRY_ATTEMPTS:
                break
            delay = _DB_RETRY_BASE_DELAY * (2 ** (attempt - 1)) + random.uniform(0, _DB_RETRY_BASE_DELAY)
            logger.warning("%s: intento %d/%d falló (%s); reintento en %.2fs",
                           op, attempt, _DB_RETRY_ATTEMPTS, exc, delay)
            time.sleep(delay)
    assert last_exc is not None
    raise last_exc


# ---------------------------------------------------------------------------
# Versionado determinista del dataset (misma versión = mismo resultado)
# ---------------------------------------------------------------------------
def frame_hash(df: pd.DataFrame) -> str:
    """Checksum SHA-256 estable del contenido de un frame publicado."""
    try:
        return store.sha256_df(df)
    except Exception:
        # Fallback sin pyarrow: CSV ordenado (nunca debe fallar el versionado).
        ordered = df.sort_values(by=list(df.columns)).reset_index(drop=True)
        return hashlib.sha256(ordered.to_csv(index=False).encode("utf-8")).hexdigest()


def verify_frame_hash(df: pd.DataFrame, expected: str) -> bool:
    """True si el contenido del frame coincide con el hash esperado."""
    try:
        import hmac
        return hmac.compare_digest(frame_hash(df), expected)
    except Exception:
        return False


def compute_dataset_version(*, mode: str, seed_obfuscar, seed_gen,
                            salt_hash: str, feature_cols: list,
                            frames: dict, row_counts: dict,
                            n_activos: int, n_eras: int,
                            ic_objetivo=None) -> dict:
    """Huella determinista del dataset.

    `frames`: {kind: sha256 del frame publicado} (train/validation/live).
    Devuelve {"version": "v1-<12hex>", "data_hash": "<64hex>"}.
    Mismos inputs (mismo seed, sal, features y contenido) => misma versión,
    de modo que el paper es reproducible: fijar `version` fija el resultado.
    """
    canonical = json.dumps({
        "mode": mode,
        "seed_obfuscar": seed_obfuscar,
        "seed_gen": seed_gen,
        "salt_hash": salt_hash,
        "feature_cols": list(feature_cols),
        "frames": {k: frames[k] for k in sorted(frames)},
        "row_counts": {k: int(row_counts[k]) for k in sorted(row_counts)},
        "n_activos": int(n_activos),
        "n_eras": int(n_eras),
        "ic_objetivo": ic_objetivo,
    }, sort_keys=True, separators=(",", ":"))
    data_hash = hashlib.sha256(canonical.encode("utf-8")).hexdigest()
    return {"version": f"v1-{data_hash[:12]}", "data_hash": data_hash}


# ---------------------------------------------------------------------------
# Generación de una ronda (cron / scheduler)
# ---------------------------------------------------------------------------
def crear_dataset(tournament_id: str, round_number: int, mode: str = "sintetico",
                  closes_at=None, now=None, **gen_kwargs) -> dict:
    """Genera un dataset completo (train/validation/live), lo sube a Storage y
    guarda el holdout en dataset_targets. Devuelve el dict del dataset creado.

    Para 'real' se requiere `universo` (lista de (tipo, simbolo)).

    Reproducibilidad: los registros de `ml_datasets` llevan `version`,
    `data_hash` (checksum global), `seed` y `params`. Mismos inputs (mismo
    seed, sal, features y contenido) => misma `version`; el paper fija la
    versión y obtiene siempre el mismo resultado. La subida a Storage usa
    reintento con backoff + sidecar SHA-256 (ver `ml_storage`).
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
    salt_hash = hashlib.sha256(_SALT.encode()).hexdigest()[:16]
    # Semilla efectiva de la obfuscación (la que fija los ids/features) y
    # semilla pedida al generador (informativa; el generador no siempre la
    # devuelve en `meta`). Ambas entran al versionado.
    _sg = gen_kwargs.get("seed", meta.get("seed", 0))
    try:
        seed_gen = int(_sg) if _sg is not None else None
    except (TypeError, ValueError):
        seed_gen = None
    _so = meta.get("seed", 0)
    try:
        seed_obf = int(_so) if _so is not None else 0
    except (TypeError, ValueError):
        seed_obf = 0
    params = {
        "n_activos": n_activos,
        "n_eras": n_eras,
        "n_features": gen_kwargs.get("n_features", len(mapeos["feat_cols"])),
        "n_features_utiles": gen_kwargs.get("n_features_utiles"),
        "ic_objetivo": meta.get("ic_objetivo"),
        "seed_gen": seed_gen,
        "seed_obfuscar": seed_obf,
        "dias": gen_kwargs.get("dias"),
        "timeframe": gen_kwargs.get("timeframe"),
    }
    if "universo" in gen_kwargs:
        try:
            params["universo"] = [list(u) for u in gen_kwargs["universo"]]
        except Exception:
            params["universo"] = None
    params = {k: v for k, v in params.items() if v is not None}

    _DROP = ["era_idx", "activo_idx", "target_raw", "target"]
    frame_hashes: dict[str, str] = {}
    row_counts: dict[str, int] = {}
    recs = []
    for kind, df in (("train", partes["train"]), ("validation", partes["validation"])):
        path = f"{base}/{kind}.parquet"
        # Quitar columnas internas y el target real (nunca se publica).
        # era_idx es server-side; activo_idx/target_raw ya no existen en interno.
        df_pub = df.drop(columns=_DROP, errors="ignore")
        store.upload_parquet(df_pub, path)  # reintento + sidecar SHA-256 internos
        frame_hashes[kind] = frame_hash(df_pub)
        row_counts[kind] = len(df)
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
            "salt_hash": salt_hash,
            "ic_objetivo": meta.get("ic_objetivo"),
            "closes_at": closes_at,
            "created_at": now.isoformat(),
            "data_hash": frame_hashes[kind],
            "seed": seed_gen,
            "params": params,
        })

    # Huella del holdout (sin subirlo): fija la versión del live también.
    live = partes["live"]
    live_pub = live.drop(columns=_DROP, errors="ignore")
    frame_hashes["live"] = frame_hash(live_pub)
    row_counts["live"] = len(live)
    ver = compute_dataset_version(
        mode=mode, seed_obfuscar=seed_obf, seed_gen=seed_gen,
        salt_hash=salt_hash, feature_cols=mapeos["feat_cols"],
        frames=frame_hashes, row_counts=row_counts,
        n_activos=n_activos, n_eras=n_eras, ic_objetivo=meta.get("ic_objetivo"),
    )
    for r in recs:
        r["version"] = ver["version"]

    # Insertar los tres kind (train, validation, live-vacio que se llena abajo)
    inserted = []
    for r in recs:
        res = _with_retry(
            lambda r=r: supabase.table("ml_datasets").insert(r).execute(),
            op=f"insert ml_datasets {r['kind']}",
        )
        inserted.append(res.data[0])

    # El live es privado: NO se sube a Storage. Guardamos su holdout en DB.
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
        "salt_hash": salt_hash,
        "ic_objetivo": meta.get("ic_objetivo"),
        "closes_at": closes_at,
        "created_at": now.isoformat(),
        "data_hash": frame_hashes["live"],
        "version": ver["version"],
        "seed": seed_gen,
        "params": params,
    }
    res = _with_retry(
        lambda: supabase.table("ml_datasets").insert(live_rec).execute(),
        op="insert ml_datasets live",
    )
    live_dataset = res.data[0]
    inserted.append(live_dataset)

    # Guardar holdout (target real por fila). SOLO service_role.
    # Incluimos las features del live: el worker las necesita para el FNC
    # (feature-neutral correlation). El cliente NO puede leer dataset_targets
    # (RLS), así que las features del live nunca se exponen.
    feat_cols = mapeos["feat_cols"]
    targets = live[["id", "target", "era"] + feat_cols].rename(columns={"id": "row_id"})
    targets = targets.assign(dataset_id=live_dataset["id"])
    _with_retry(
        lambda: supabase.table("dataset_targets").insert(targets.to_dict("records")).execute(),
        op="insert dataset_targets",
    )

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
    ahora_iso = datetime.now(timezone.utc).isoformat()

    ds = supabase.table("ml_datasets").select("id,feature_cols").eq("id", sub["dataset_id"]).execute()
    feat_cols = (ds.data[0].get("feature_cols") or []) if ds.data else []

    # Descargar el CSV de predicciones del usuario desde Storage (o leer del campo).
    preds = _leer_predicciones(sub)
    if preds is None or len(preds) == 0:
        supabase.table("prediction_submissions").update({
            "status": "disqualified", "is_valid": False,
            "eval_error": "sin predicciones", "scored_at": ahora_iso,
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
            "eval_error": "ids de prediccion no coinciden con el dataset",
            "scored_at": ahora_iso,
        }).eq("id", submission_id).execute()
        return {"status": "disqualified", "motivo": "ids de prediccion no coinciden con el dataset"}
    if len(merged) < sc.MIN_ERAS:
        supabase.table("prediction_submissions").update({
            "status": "disqualified", "is_valid": False,
            "eval_error": "filas insuficientes", "scored_at": ahora_iso,
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
        "scored_at": datetime.now(timezone.utc).isoformat(),
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
        # Intentar CSV primero, luego parquet (ambos en el bucket de predicciones)
        try:
            data = store.download_csv(path)
            return pd.read_csv(io.BytesIO(data))
        except Exception:
            return store.download_parquet(path, bucket=store.SUBMISSIONS_BUCKET)
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


# ---------------------------------------------------------------------------
# Scoring programado de submissions pendientes (cron / scheduler)
# ---------------------------------------------------------------------------
def evaluate_ml_rounds(supabase, now=None) -> int:
    """Puntúa TODAS las submissions ML en estado `pending` que aún no han
    sido evaluadas.

    Llamado desde el scheduler (`main.py: /scheduler/run`) para asegurar que
    una submission que quedó en `pending` (el BackgroundTask de FastAPI se fue
    en background bajo Render free, que mata el request) eventualmente se
    puntúa. Cada submission se puntua de forma aislada: si una falla no
    aborta el lote (se loggea y se marca `disqualified` con `eval_error`;
    el CHECK de prediction_submissions solo admite
    pending/scoring/scored/disqualified, NUNCA 'error').

    Devuelve la cantidad de submissions puntuadas en esta pasada.
    """
    import logging
    logger_ = logging.getLogger(__name__)
    # Import tardío para evitar ciclo de importaciones en el arranque del
    # worker (tournaments.py no importa ml_persist).
    try:
        from ml_persist import puntuar_submission_en_bd
    except Exception:  # pragma: no cover - defensivo
        from ml_persist import puntuar_submission_en_bd  # noqa: F811

    import typing as _t
    # La firma pública acepta un cliente supabase; si llega None, lo creamos.
    if supabase is None:
        from tournaments import get_supabase
        supabase = get_supabase()

    subs = (
        supabase.table("prediction_submissions")
        .select("id,status,submitted_at")
        .eq("status", "pending")
        .order("submitted_at", desc=False)
        .execute()
    )
    rows = subs.data or []
    scored = 0
    for r in rows:
        sid = r.get("id")
        if not sid:
            continue
        try:
            puntuar_submission_en_bd(sid)
            scored += 1
        except Exception as e:
            logger_.exception("evaluate_ml_rounds: submission %s falló", sid)
            try:
                from datetime import datetime as _dt, timezone as _tz
                supabase.table("prediction_submissions").update(
                    {"status": "disqualified", "is_valid": False,
                     "eval_error": str(e)[:500],
                     "scored_at": _dt.now(_tz.utc).isoformat()}
                ).eq("id", sid).execute()
            except Exception:
                pass
    return scored

