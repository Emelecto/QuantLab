"""Capa de Storage para datasets de torneos ML.

Sube/baja archivos a Supabase Storage (bucket 'tournament-datasets', público).
El holdout (target del live) NO se sube nunca: vive en dataset_targets en la DB
y solo es legible por service_role.

Resiliencia:
  - Toda operación de red usa reintento con backoff exponencial + jitter
    (STORAGE_RETRY_ATTEMPTS / STORAGE_RETRY_BASE_DELAY). Los errores de
    "objeto no encontrado" NO se reintentan (son deterministas).
  - Cada objeto lleva un sidecar `<path>.sha256` (best-effort) con el SHA-256
    hex de sus bytes. Las descargas aceptan `expected_sha256` y lanzan
    ValueError si el contenido no coincide (corrupción / truncado).
"""
from __future__ import annotations

import hashlib
import hmac
import io
import logging
import os
import random
import time

import pandas as pd

logger = logging.getLogger(__name__)

# Bucket de datasets públicos (train/validation en parquet + URLs públicas).
# Siempre público: los usuarios descargan train/validation sin autenticación.
DATASET_BUCKET = os.environ.get("DATASET_BUCKET", "tournament-datasets")

# Bucket de predicciones de usuarios (CSV). Tras aplicar la migración
# 0023_submissions_privadas.sql, fijar SUBMISSIONS_BUCKET=submissions en Render;
# mientras tanto comparte el bucket público por compatibilidad.
SUBMISSIONS_BUCKET = os.environ.get("SUBMISSIONS_BUCKET", "tournament-datasets")


def _env_int(name: str, default: int) -> int:
    try:
        return int(os.environ.get(name, default))
    except (TypeError, ValueError):
        return default


def _env_float(name: str, default: float) -> float:
    try:
        return float(os.environ.get(name, default))
    except (TypeError, ValueError):
        return default


RETRY_ATTEMPTS = _env_int("STORAGE_RETRY_ATTEMPTS", 4)
RETRY_BASE_DELAY = _env_float("STORAGE_RETRY_BASE_DELAY", 0.5)

_SIDECAR_SUFFIX = ".sha256"


def _is_not_found(exc: Exception) -> bool:
    msg = str(exc).lower()
    return any(s in msg for s in ("not found", "notfound", "404", "does not exist", "no such"))


def _with_retry(fn, *, op: str, attempts: int | None = None,
                base_delay: float | None = None, fatal=None):
    """Ejecuta `fn()` con reintento y backoff exponencial + jitter.

    `fatal(exc) -> bool`: si es True, el error es determinista y se relanza
    sin reintentar (p. ej. objeto inexistente).
    """
    attempts = RETRY_ATTEMPTS if attempts is None else attempts
    base_delay = RETRY_BASE_DELAY if base_delay is None else base_delay
    last_exc: Exception | None = None
    for attempt in range(1, attempts + 1):
        try:
            return fn()
        except Exception as exc:
            if fatal is not None and fatal(exc):
                raise
            last_exc = exc
            if attempt >= attempts:
                break
            delay = base_delay * (2 ** (attempt - 1)) + random.uniform(0, base_delay)
            logger.warning("%s: intento %d/%d falló (%s); reintento en %.2fs",
                           op, attempt, attempts, exc, delay)
            time.sleep(delay)
    assert last_exc is not None
    raise last_exc


# ---------------------------------------------------------------------------
# Checksums
# ---------------------------------------------------------------------------
def sha256_bytes(data: bytes) -> str:
    """SHA-256 hex de unos bytes."""
    return hashlib.sha256(data).hexdigest()


def sha256_df(df: pd.DataFrame) -> str:
    """SHA-256 estable del contenido de un DataFrame.

    Ordena filas por todas las columnas antes de serializar, de modo que el
    hash solo depende del contenido (misma versión = mismo resultado),
    no del orden físico de las filas.
    """
    try:
        ordered = df.sort_values(by=list(df.columns)).reset_index(drop=True)
    except Exception:
        ordered = df
    buf = io.BytesIO()
    ordered.to_parquet(buf, index=False, engine="pyarrow")
    return sha256_bytes(buf.getvalue())


def verify_bytes(data: bytes, expected_sha256: str | None) -> bytes:
    """Valida el checksum; lanza ValueError si no coincide. Devuelve `data`."""
    if expected_sha256 and not hmac.compare_digest(sha256_bytes(data), expected_sha256):
        raise ValueError("checksum SHA-256 no coincide: objeto corrupto o truncado")
    return data


def _sidecar_path(path: str) -> str:
    return path + _SIDECAR_SUFFIX


def _write_sidecar_best_effort(sb, bucket: str, path: str, digest: str) -> None:
    """Escribe el sidecar `<path>.sha256`. Nunca lanza (best-effort)."""
    try:
        sb.storage.from_(bucket).upload(
            _sidecar_path(path), digest.encode("utf-8"),
            {"content-type": "text/plain", "upsert": "true"},
        )
    except Exception as exc:
        logger.debug("sidecar %s no escrito: %s", _sidecar_path(path), exc)


def _client():
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise RuntimeError("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY no configuradas")
    from supabase import create_client

    return create_client(url, key)


def upload_csv(csv_text: str, path: str) -> str:
    """Sube un CSV como texto plano al bucket de predicciones."""
    sb = _client()
    data = csv_text.encode("utf-8")
    digest = sha256_bytes(data)

    def _do():
        sb.storage.from_(SUBMISSIONS_BUCKET).upload(
            path, data,
            {"content-type": "text/csv", "upsert": "true"},
        )

    _with_retry(_do, op=f"upload_csv {path}", fatal=_is_not_found)
    _write_sidecar_best_effort(sb, SUBMISSIONS_BUCKET, path, digest)
    return path


def upload_parquet(df: pd.DataFrame, path: str) -> str:
    """Sube un DataFrame como parquet al bucket público de datasets."""
    buf = io.BytesIO()
    df.to_parquet(buf, index=False, engine="pyarrow")
    data = buf.getvalue()
    digest = sha256_bytes(data)
    sb = _client()

    def _do():
        sb.storage.from_(DATASET_BUCKET).upload(
            path, data,
            {"content-type": "application/octet-stream", "upsert": "true"},
        )

    _with_retry(_do, op=f"upload_parquet {path}", fatal=_is_not_found)
    _write_sidecar_best_effort(sb, DATASET_BUCKET, path, digest)
    return path


def download_parquet(path: str, bucket: str | None = None,
                     expected_sha256: str | None = None) -> pd.DataFrame:
    """Descarga un parquet a un DataFrame (por defecto, bucket de datasets).

    Si `expected_sha256` se indica, verifica el checksum y lanza ValueError
    ante corrupción.
    """
    sb = _client()
    data = _with_retry(
        lambda: sb.storage.from_(bucket or DATASET_BUCKET).download(path),
        op=f"download_parquet {path}", fatal=_is_not_found,
    )
    verify_bytes(data, expected_sha256)
    return pd.read_parquet(io.BytesIO(data), engine="pyarrow")


def download_parquet_verified(path: str, expected_sha256: str,
                              bucket: str | None = None) -> pd.DataFrame:
    """Descarga un parquet exigiendo un checksum exacto."""
    return download_parquet(path, bucket=bucket, expected_sha256=expected_sha256)


def download_csv(path: str, expected_sha256: str | None = None) -> bytes:
    """Descarga un CSV de predicciones.

    Prueba el bucket privado primero y cae al de datasets por compatibilidad
    con envíos anteriores a la migración 0023. Si `expected_sha256` se indica,
    verifica el checksum.
    """
    sb = _client()
    try:
        data = _with_retry(
            lambda: sb.storage.from_(SUBMISSIONS_BUCKET).download(path),
            op=f"download_csv {path}", fatal=_is_not_found,
        )
    except Exception:
        if SUBMISSIONS_BUCKET == DATASET_BUCKET:
            raise
        data = _with_retry(
            lambda: sb.storage.from_(DATASET_BUCKET).download(path),
            op=f"download_csv(fallback) {path}", fatal=_is_not_found,
        )
    verify_bytes(data, expected_sha256)
    return data


def public_url(path: str) -> str:
    """URL pública estable del objeto (el bucket de datasets es público)."""
    url = os.environ.get("SUPABASE_URL", "").strip().rstrip("/")
    return f"{url}/storage/v1/object/public/{DATASET_BUCKET}/{path}"
