# Módulo de autenticación para el worker de QuantLab.
# Extrae el user_id del JWT de Supabase en el header Authorization.

from __future__ import annotations

import logging
import os
from typing import Optional

from fastapi import HTTPException, Request
try:
    import jwt  # solo por si existe; no se usa para verificar firma
    _JWT_EXP_ERR = jwt.ExpiredSignatureError
except Exception:
    class _JWT_EXP_ERR(Exception):
        pass
import requests

logger = logging.getLogger(__name__)

_JWKS_URL: str | None = None
_JWKS: dict | None = None


def _get_jwks_url() -> str:
    global _JWKS_URL
    if _JWKS_URL is None:
        _JWKS_URL = os.environ.get("SUPABASE_JWKS_URL")
        if not _JWKS_URL:
            base = os.environ.get("SUPABASE_URL", "").strip().rstrip("/")
            if not base:
                raise RuntimeError(
                    "SUPABASE_URL no configurada. "
                    "El worker necesita SUPABASE_URL o SUPABASE_JWKS_URL."
                )
            _JWKS_URL = f"{base}/auth/v1/.well-known/jwks.json"
        logger.info(f"JWKS URL configurada: {_JWKS_URL}")
    return _JWKS_URL


def _fetch_jwks() -> dict:
    global _JWKS
    if _JWKS is None:
        try:
            api_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get(
                "SUPABASE_ANON_KEY"
            )
            headers = {"apikey": api_key} if api_key else {}
            jwks_url = _get_jwks_url()
            resp = requests.get(jwks_url, headers=headers, timeout=10)
            resp.raise_for_status()
            _JWKS = resp.json()
            keys = _JWKS.get("keys", [])
            logger.info(f"JWKS obtenido: {len(keys)} key(s) desde {jwks_url}")
        except Exception as e:
            logger.error(f"No se pudo obtener JWKS de Supabase: {e}")
            # NO cachear el fallo: permitir reintento en la siguiente request
            # si el error fue transitorio (red, timeout, etc.)
            return {}
    return _JWKS


def _verify_jwt(token: str) -> dict | None:
    """Verifica un JWT de Supabase (ES256/ECDSA) usando cryptography directamente.

    No depende de PyJWT para la verificación de firma, lo que evita conflictos
    con el paquete `jwt` viejo que a veces se instala en lugar de PyJWT.
    """
    try:
        import base64 as _b64
        import json as _json
        import time

        def _b64u(s: str) -> bytes:
            return _b64.urlsafe_b64decode(s + "=" * (-len(s) % 4))

        def _b64d(s: str):
            return _json.loads(_b64u(s))

        parts = token.split(".")
        if len(parts) != 3:
            return None
        header = _b64d(parts[0])
        kid = header.get("kid")
        if not kid:
            return None

        jwks = _fetch_jwks()
        keys = jwks.get("keys", [])
        key = next((k for k in keys if k.get("kid") == kid), None)
        if not key:
            global _JWKS
            _JWKS = None
            jwks = _fetch_jwks()
            keys = jwks.get("keys", [])
            key = next((k for k in keys if k.get("kid") == kid), None)
        if not key:
            return None

        # Construir clave pública EC (P-256) desde el JWK
        from cryptography.hazmat.primitives.asymmetric import ec
        from cryptography.hazmat.primitives import hashes
        from cryptography.hazmat.primitives.asymmetric.utils import decode_dss_signature

        x = int.from_bytes(_b64u(key["x"]), "big")
        y = int.from_bytes(_b64u(key["y"]), "big")
        curve = ec.SECP256R1()
        public_key = ec.EllipticCurvePublicNumbers(x, y, curve).public_key()

        # La firma ES256 de Supabase viene en formato raw (r || s, 32 bytes c/u)
        sig_raw = _b64u(parts[2])
        if len(sig_raw) != 64:
            logger.warning(f"Firma con longitud inesperada: {len(sig_raw)}")
            return None
        r = int.from_bytes(sig_raw[:32], "big")
        s = int.from_bytes(sig_raw[32:], "big")
        from cryptography.hazmat.primitives.asymmetric.utils import encode_dss_signature
        sig_der = encode_dss_signature(r, s)

        message = f"{parts[0]}.{parts[1]}".encode()
        try:
            public_key.verify(sig_der, message, ec.ECDSA(hashes.SHA256()))
        except Exception:
            logger.warning("Firma ES256 inválida")
            return None

        # Decodificar payload y validar exp/aud
        payload = _b64d(parts[1])
        now = int(time.time())
        if "exp" in payload and payload["exp"] < now:
            logger.warning("JWT expirado")
            return None
        if payload.get("aud") != "authenticated":
            logger.warning("JWT audience incorrecto")
            return None
        return payload
    except _JWT_EXP_ERR:
        logger.warning("JWT expirado")
        return None
    except Exception as e:
        logger.warning(f"JWT inválido: {e}")
        return None


def get_user_id_from_request(request: Request) -> Optional[str]:
    """Extrae el user_id del header Authorization.

    Acepta dos formatos:
    - Bearer <JWT de Supabase>  → verifica firma ES256 vía JWKS.
    - Bearer qlk_<hex>          → clave de API dedicada (hash SHA-256 en api_keys).
    """
    auth_header = request.headers.get("authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    token = auth_header[7:].strip()

    # Clave de API dedicada (qlk_...): lookup por hash, sin expiración.
    if token.startswith("qlk_"):
        return _user_id_from_api_key(token)

    payload = _verify_jwt(token)
    if not payload:
        return None
    return payload.get("sub")


def _get_service_client():
    """Cliente Supabase con service role (solo para lookups de claves API)."""
    url = os.environ.get("SUPABASE_URL", "")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
    if not url or not key:
        return None
    try:
        from supabase import create_client

        return create_client(url, key)
    except Exception as e:
        logger.warning(f"No se pudo crear cliente Supabase para api_keys: {e}")
        return None


def _user_id_from_api_key(key: str) -> Optional[str]:
    """Resuelve user_id desde una clave de API (qlk_...). Hash SHA-256 lookup."""
    import hashlib
    from datetime import datetime, timezone

    key_hash = hashlib.sha256(key.encode()).hexdigest()
    sb = _get_service_client()
    if not sb:
        return None
    try:
        res = (
            sb.table("api_keys")
            .select("id, user_id, revoked_at")
            .eq("key_hash", key_hash)
            .limit(1)
            .execute()
        )
        rows = res.data or []
        if not rows:
            return None
        row = rows[0]
        if row.get("revoked_at"):
            return None
        # Actualizar last_used_at (best-effort, no bloquea la request).
        try:
            sb.table("api_keys").update(
                {"last_used_at": datetime.now(timezone.utc).isoformat()}
            ).eq("id", row["id"]).execute()
        except Exception:
            pass
        return row.get("user_id")
    except Exception as e:
        logger.warning(f"Error resolviendo api_key: {e}")
        return None


def require_user(request: Request) -> str:
    """Igual pero lanza HTTPException(401) si no hay token válido."""
    if os.environ.get("TESTING"):
        # En tests, devolver un usuario fijo
        return "00000000-0000-0000-0000-000000000001"
    uid = get_user_id_from_request(request)
    if not uid:
        raise HTTPException(401, "Token inválido o ausente")
    return uid


def get_optional_user(request: Request) -> Optional[str]:
    """Versión opcional, no lanza excepción."""
    try:
        return get_user_id_from_request(request)
    except Exception:
        return None
