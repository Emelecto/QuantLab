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
            base = os.environ.get("SUPABASE_URL", "")
            _JWKS_URL = f"{base}/auth/v1/.well-known/jwks.json"
    return _JWKS_URL


def _fetch_jwks() -> dict:
    global _JWKS
    if _JWKS is None:
        try:
            # Supabase requiere el header `apikey` para leer el JWKS público.
            # Usamos la service_role key (ya disponible en el worker) como apikey.
            api_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get(
                "SUPABASE_ANON_KEY"
            )
            logger.info(f"[AUTH DEBUG] JWKS url={_get_jwks_url()} apikey_present={bool(api_key)}")
            headers = {"apikey": api_key} if api_key else {}
            resp = requests.get(_get_jwks_url(), headers=headers, timeout=10)
            resp.raise_for_status()
            _JWKS = resp.json()
            logger.info(f"[AUTH DEBUG] JWKS obtenido, keys={len(_JWKS.get('keys', []))}")
        except Exception as e:
            logger.error(f"[AUTH DEBUG] No se pudo obtener JWKS de Supabase: {e}")
            _JWKS = {}
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
            logger.warning(f"[AUTH DEBUG] Firma con longitud inesperada: {len(sig_raw)}")
            return None
        r = int.from_bytes(sig_raw[:32], "big")
        s = int.from_bytes(sig_raw[32:], "big")
        from cryptography.hazmat.primitives.asymmetric.utils import encode_dss_signature
        sig_der = encode_dss_signature(r, s)

        message = f"{parts[0]}.{parts[1]}".encode()
        try:
            public_key.verify(sig_der, message, ec.ECDSA(hashes.SHA256()))
        except Exception:
            logger.warning("[AUTH DEBUG] Firma ES256 inválida")
            return None

        # Decodificar payload y validar exp/aud
        payload = _b64d(parts[1])
        now = int(time.time())
        if "exp" in payload and payload["exp"] < now:
            logger.warning("[AUTH DEBUG] JWT expirado")
            return None
        if payload.get("aud") != "authenticated":
            logger.warning("[AUTH DEBUG] JWT audience incorrecto")
            return None
        return payload
    except _JWT_EXP_ERR:
        logger.warning("[AUTH DEBUG] JWT expirado")
        return None
    except Exception as e:
        logger.warning(f"[AUTH DEBUG] JWT inválido: {e}")
        return None


def get_user_id_from_request(request: Request) -> Optional[str]:
    """Extrae el user_id del token JWT en el header Authorization."""
    auth_header = request.headers.get("authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    token = auth_header[7:]
    payload = _verify_jwt(token)
    if not payload:
        return None
    return payload.get("sub")


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
