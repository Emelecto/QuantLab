"""Endpoints de torneos ML (modelo Numerai: el usuario sube PREDICCIONES).

Rutas (prefijo /ml):
  GET  /ml/datasets?tournament_id=&round=   -> lista datasets públicos (metadatos + URLs)
  GET  /ml/datasets/{id}/download?kind=     -> URL firmada del parquet (train/validation)
  POST /ml/datasets/{id}/predictions        -> sube CSV (id,prediction), valida, guarda
  GET  /ml/predictions/mine?dataset_id=      -> estado y score de mi envío
  GET  /ml/leaderboard?dataset_id=           -> ranking de la ronda

Ningún endpoint expone dataset_targets (el holdout). El scoring lo hace el cron.
"""
from __future__ import annotations

import io
import logging

import pandas as pd
from typing import Optional
from fastapi import APIRouter, HTTPException, Request, BackgroundTasks, UploadFile, Query
from pydantic import BaseModel

import os
from auth import require_user
import ml_storage as store
import ml_persist as persist

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ml", tags=["ml-tournaments"])


# (PredictionsUpload class removed — JSON body is now parsed directly via request.json())


# ---------------------------------------------------------------------------
# Listar datasets
# ---------------------------------------------------------------------------
@router.get("/datasets")
def list_datasets(tournament_id: str | None = None, round_number: int | None = None):
    from tournaments import get_supabase
    sb = get_supabase()
    q = sb.table("ml_datasets").select(
        "id,tournament_id,round_number,mode,kind,status,n_assets,n_eras,"
        "n_features,row_count,feature_cols,closes_at"
    )
    if tournament_id:
        q = q.eq("tournament_id", tournament_id)
    if round_number:
        q = q.eq("round_number", round_number)
    data = q.order("round_number").execute()
    # URLs públicas de Storage para train/validation
    out = []
    for d in data.data or []:
        d = dict(d)
        if d.get("kind") in ("train", "validation") and d.get("bucket_path"):
            d["download_url"] = store.public_url(d["bucket_path"])
        else:
            d["download_url"] = None  # live nunca se expone
        out.append(d)
    return {"datasets": out}


# ---------------------------------------------------------------------------
# Descargar un parquet público
# ---------------------------------------------------------------------------
@router.get("/datasets/{dataset_id}/download")
def download_dataset(dataset_id: str, kind: str = "train"):
    from tournaments import get_supabase
    sb = get_supabase()
    rec = sb.table("ml_datasets").select("bucket_path,kind").eq("id", dataset_id).execute()
    if not rec.data:
        raise HTTPException(404, "dataset no encontrado")
    rec = rec.data[0]
    if rec["kind"] != kind or kind not in ("train", "validation"):
        raise HTTPException(403, "solo train/validation son públicos")
    if not rec.get("bucket_path"):
        raise HTTPException(404, "ruta no disponible")
    return {"url": store.public_url(rec["bucket_path"])}


# ---------------------------------------------------------------------------
# Enviar predicciones (CSV o JSON)
# ---------------------------------------------------------------------------
def _validar_csv(df: pd.DataFrame) -> pd.DataFrame:
    """Valida columnas, rangos y NaN. Lanza HTTPException si algo falla."""
    # Normalizar nombres de columnas a minúsculas para evitar errores de casing
    df.columns = [col.strip().lower() for col in df.columns]
    
    if "id" not in df.columns or "prediction" not in df.columns:
        raise HTTPException(422, "el CSV debe tener columnas 'id' y 'prediction'")
    if df["prediction"].isna().any():
        raise HTTPException(422, "prediction contiene valores nulos")
    if not pd.api.types.is_numeric_dtype(df["prediction"]):
        raise HTTPException(422, "prediction debe ser numérico")
    return df[["id", "prediction"]].copy()


@router.post("/datasets/{dataset_id}/predictions")
async def submit_predictions(
    dataset_id: str,
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile | None = None,
):
    try:
        import csv
        import io
        user_id = require_user(request)
        from tournaments import get_supabase
        sb = get_supabase()

        # El dataset debe existir y estar abierto
        ds = sb.table("ml_datasets").select("id,kind,status,closes_at").eq("id", dataset_id).execute()
        if not ds.data or ds.data[0]["kind"] != "live":
            raise HTTPException(404, "dataset de predicciones no encontrado")
        if ds.data[0]["status"] not in ("ready", "building"):
            raise HTTPException(409, f"ronda en estado {ds.data[0]['status']}")

        # Parsear entrada
        if file is not None:
            content = await file.read()
            try:
                csv_text = content.decode("utf-8")
            except Exception:
                raise HTTPException(422, "archivo no es UTF-8 válido")
        else:
            try:
                json_body = await request.json()
                rows = json_body.get("rows")
                if not rows or not isinstance(rows, list):
                    raise HTTPException(422, "envía un archivo CSV o un body JSON con 'rows'")
                # Construir CSV en memoria
                buf = io.StringIO()
                w = csv.writer(buf)
                w.writerow(["id", "prediction"])
                for r in rows:
                    w.writerow([r.get("id"), r.get("prediction")])
                csv_text = buf.getvalue()
            except HTTPException:
                raise
            except Exception as e:
                raise HTTPException(422, f"Datos de predicciones inválidos: {e}")

        # Validar CSV parseando una muestra
        try:
            df_check = pd.read_csv(io.BytesIO(csv_text.encode("utf-8")))
            df_check = _validar_csv(df_check)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(422, f"CSV inválido: {e}")

        # Crear submission en DB (status "pending": el CHECK real solo admite
        # pending/scoring/scored/disqualified; NUNCA "processing"/"error").
        prev = sb.table("prediction_submissions").select("id").eq(
            "dataset_id", dataset_id
        ).eq("user_id", user_id).execute()
        # La ruta del CSV es determinista (dataset_id[:8] + user_id); no se
        # guarda en una columna (p.ej. file_path) que el esquema real no tiene.
        path = f"submissions/{dataset_id[:8]}/{user_id}.csv"
        payload = {
            "dataset_id": dataset_id,
            "user_id": user_id,
            "file_name": file.filename if file else "inline.json",
            "row_count": len(df_check),
            "status": "pending",
        }
        try:
            if prev.data:
                sb.table("prediction_submissions").update(payload).eq("id", prev.data[0]["id"]).execute()
                sub_id = prev.data[0]["id"]
            else:
                res = sb.table("prediction_submissions").insert(payload).execute()
                sub_id = res.data[0]["id"]
        except Exception as e:
            logger.exception("Error al guardar submission en DB")
            raise HTTPException(502, f"No fue posible guardar el envío: {e}")

        # Upload síncrono (CSV directo, sin parquet — más rápido)
        try:
            store.upload_csv(csv_text, path)
            sb.table("prediction_submissions").update({"status": "pending"}).eq("id", sub_id).execute()
        except Exception as e:
            logger.exception("Error en upload de predicciones")
            sb.table("prediction_submissions").update({"status": "disqualified"}).eq("id", sub_id).execute()
            raise HTTPException(502, f"No fue posible guardar el archivo: {e}")

        # SCORING SINCRONO (set-and-forget). El plan free/start de Render mata
        # los BackgroundTask tras responder, así que la evaluacion se corre AQUI
        # mismo dentro del request: el usuario envia -> se puntua al instante ->
        # la respuesta ya trae status terminal (scored/disqualified). El scoring
        # de ~70 eras cabe en el timeout de gunicorn (Dockerfile: --timeout 300).
        import ml_persist
        try:
            ml_persist.puntuar_submission_en_bd(sub_id)
        except Exception:
            logger.exception(f"Scoring sincrono falló para {sub_id}")

        # Devolver resultado final (siempre 200, con el status ya terminal)
        res = sb.table("prediction_submissions").select(
            "id,row_count,status,score,corr_mean,fnc_mean,consistencia,meta_corr,is_valid,plagio_flag,submitted_at,scored_at"
        ).eq("id", sub_id).execute()
        return {"submission": res.data[0] if res.data else {"id": sub_id, "status": "pending"}}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error inesperado en submit_predictions")
        raise HTTPException(500, f"Error interno del servidor: {e}")


# ---------------------------------------------------------------------------
# Evaluar submission bajo demanda (llamado desde el frontend vía polling)
# ---------------------------------------------------------------------------
@router.post("/submissions/{submission_id}/evaluate")
def evaluate_submission(submission_id: str, request: Request, scheduler_key: Optional[str] = Query(None)):
    """Evalúa una submission pending bajo demanda (timeout-safe).

    Auth: JWT de usuario (Authorization) o ?scheduler_key=<SCHEDULER_KEY> para
    disparar scoring programado/forzado sin intervención del usuario (cron,
    admin, etc.). En Render plan free el BackgroundTask no persiste, así que
    este endpoint ejecuta el scoring SÍNCRONO dentro del request.
    """
    from tournaments import get_supabase
    sb = get_supabase()
    # Auth: clave de scheduler (bypass) o usuario normal.
    _sk = os.environ.get("SCHEDULER_KEY")
    if scheduler_key and _sk and scheduler_key == _sk:
        user_id = sb.table("prediction_submissions").select("user_id").eq("id", submission_id).execute().data[0]["user_id"] if True else None
    else:
        user_id = require_user(request)
    sub = sb.table("prediction_submissions").select("id,user_id,status").eq("id", submission_id).eq("user_id", user_id).execute()
    if not sub.data:
        raise HTTPException(404, "submission no encontrada")
    if sub.data[0]["status"] != "pending":
        raise HTTPException(409, f"submission en estado {sub.data[0]['status']}, no se puede evaluar")
    import ml_persist
    try:
        ml_persist.puntuar_submission_en_bd(submission_id)
        return {"status": "scored"}
    except Exception as e:
        logger.exception(f"Evaluación falló para {submission_id}")
        sb.table("prediction_submissions").update({"status": "pending"}).eq("id", submission_id).execute()
        raise HTTPException(500, f"Error al evaluar: {e}")


# ---------------------------------------------------------------------------
# Estado de una submission (para polling desde el frontend)
# ---------------------------------------------------------------------------
@router.get("/submissions/{submission_id}")
def get_submission(submission_id: str, request: Request):
    """Devuelve el estado y score de una submission propia (para polling)."""
    user_id = require_user(request)
    from tournaments import get_supabase
    sb = get_supabase()
    res = sb.table("prediction_submissions").select(
        "id,dataset_id,row_count,status,score,corr_mean,fnc_mean,consistencia,"
        "meta_corr,is_valid,plagio_flag,submitted_at,scored_at"
    ).eq("id", submission_id).eq("user_id", user_id).execute()
    if not res.data:
        raise HTTPException(404, "submission no encontrada")
    return {"submission": res.data[0]}


# ---------------------------------------------------------------------------
# Mi envío
# ---------------------------------------------------------------------------
@router.get("/predictions/mine")
def my_prediction(dataset_id: str, request: Request):
    user_id = require_user(request)
    from tournaments import get_supabase
    sb = get_supabase()
    res = sb.table("prediction_submissions").select(
        "id,row_count,status,score,corr_mean,fnc_mean,consistencia,meta_corr,is_valid,plagio_flag,submitted_at,scored_at"
    ).eq("dataset_id", dataset_id).eq("user_id", user_id).execute()
    return {"submission": res.data[0] if res.data else None}


# ---------------------------------------------------------------------------
# Leaderboard de la ronda
# ---------------------------------------------------------------------------
@router.get("/leaderboard")
def leaderboard(dataset_id: str):
    from tournaments import get_supabase
    sb = get_supabase()
    res = sb.table("prediction_submissions").select(
        "user_id,score,corr_mean,fnc_mean,consistencia,is_valid,plagio_flag,submitted_at"
    ).eq("dataset_id", dataset_id).eq("is_valid", True).order("score", desc=True).execute()
    return {"leaderboard": res.data or []}
