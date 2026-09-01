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
from fastapi import APIRouter, HTTPException, Request, UploadFile
from pydantic import BaseModel

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
    file: UploadFile | None = None,
):
    try:
        user_id = require_user(request)
        from tournaments import get_supabase
        sb = get_supabase()

        # El dataset debe existir y estar abierto
        ds = sb.table("ml_datasets").select("id,kind,status,closes_at").eq("id", dataset_id).execute()
        if not ds.data or ds.data[0]["kind"] != "live":
            raise HTTPException(404, "dataset de predicciones no encontrado")
        if ds.data[0]["status"] not in ("ready", "building"):
            raise HTTPException(409, f"ronda en estado {ds.data[0]['status']}")

        # Parsear entrada (ligero) — el upload pesado va en background
        if file is not None:
            content = await file.read()
            try:
                df = pd.read_csv(io.BytesIO(content))
            except Exception as e:
                raise HTTPException(422, f"CSV inválido: {e}")
        else:
            try:
                json_body = await request.json()
                rows = json_body.get("rows")
                if not rows or not isinstance(rows, list):
                    raise HTTPException(422, "envía un archivo CSV o un body JSON con 'rows'")
                df = pd.DataFrame(rows)
            except HTTPException:
                raise
            except Exception as e:
                raise HTTPException(422, f"Datos de predicciones inválidos: {e}")
        df = _validar_csv(df)

        # Crear submission en DB primero (status "processing") para devolver ID inmediato
        prev = sb.table("prediction_submissions").select("id").eq(
            "dataset_id", dataset_id
        ).eq("user_id", user_id).execute()
        path = f"submissions/{dataset_id[:8]}/{user_id}.csv"
        payload = {
            "dataset_id": dataset_id,
            "user_id": user_id,
            "file_name": file.filename if file else "inline.json",
            "row_count": len(df),
            "file_path": path,
            "status": "processing",
            "submitted_at": "now()",
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

        # Upload pesado en background para no exceder timeout de Render
        # Usamos run_in_executor porque el cliente Supabase es síncrono
        # y bloquearía el event loop de FastAPI si lo usamos directo en async
        import asyncio
        from concurrent.futures import ThreadPoolExecutor
        _executor = ThreadPoolExecutor(max_workers=2)

        async def _upload_background():
            loop = asyncio.get_event_loop()
            try:
                await loop.run_in_executor(_executor, store.upload_parquet, df, path)
                await loop.run_in_executor(
                    _executor,
                    lambda: sb.table("prediction_submissions").update({"status": "pending"}).eq("id", sub_id).execute()
                )
            except Exception as e:
                logger.exception("Error en upload background de predicciones")
                await loop.run_in_executor(
                    _executor,
                    lambda: sb.table("prediction_submissions").update({"status": "error"}).eq("id", sub_id).execute()
                )

        asyncio.create_task(_upload_background())

        return {"id": sub_id, "row_count": len(df), "status": "processing"}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error inesperado en submit_predictions")
        raise HTTPException(500, f"Error interno del servidor: {e}")


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
