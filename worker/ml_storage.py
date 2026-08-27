"""Capa de Storage para datasets de torneos ML.

Sube/baja parquet a Supabase Storage (bucket 'tournament-datasets', público).
El holdout (target del live) NO se sube nunca: vive en dataset_targets en la DB
y solo es legible por service_role.
"""
from __future__ import annotations

import io
import logging
import os

import pandas as pd

logger = logging.getLogger(__name__)

BUCKET = "tournament-datasets"


def _client():
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise RuntimeError("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY no configuradas")
    from supabase import create_client

    return create_client(url, key)


def upload_parquet(df: pd.DataFrame, path: str) -> str:
    """Sube un DataFrame como parquet y devuelve la ruta en el bucket.

    `path` es tipo 'sintetico/2026-W35/train.parquet'. El cliente público
    puede leerlo vía la URL firmada/cableada del bucket.
    """
    buf = io.BytesIO()
    df.to_parquet(buf, index=False, engine="pyarrow")
    buf.seek(0)
    sb = _client()
    sb.storage.from_(BUCKET).upload(
        path, buf.getvalue(),
        {"content-type": "application/octet-stream", "upsert": "true"},
    )
    return path


def download_parquet(path: str) -> pd.DataFrame:
    """Descarga un parquet del bucket a un DataFrame."""
    sb = _client()
    data = sb.storage.from_(BUCKET).download(path)
    return pd.read_parquet(io.BytesIO(data), engine="pyarrow")


def public_url(path: str) -> str:
    """URL pública estable del objeto (el bucket es público)."""
    url = os.environ.get("SUPABASE_URL", "").strip().rstrip("/")
    return f"{url}/storage/v1/object/public/{BUCKET}/{path}"
