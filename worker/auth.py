# Módulo de autenticación para el worker de QuantLab.
# Extrae el user_id del JWT de Supabase en el header Authorization.

from __future__ import annotations

import logging
import os
from typing import Optional

from fastapi import HTTPException, Request
import jwt
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
            _JWKS_URL = f"{base}/auth/v1/keys"
    return _JWKS_URL


def _fetch_jwks() -> dict:
    global _JWKS
    if _JWKS is None:
        try:
            resp = requests.get(_get_jwks_url(), timeout=10)
            resp.raise_for_status()
            _JWKS = resp.json()
        except Exception as e:
            logger.warning(f"No se pudo obtener JWKS de Supabase: {e}")
            _JWKS = {}
    return _JWKS


def _verify_jwt(token: str) -> dict | None:
    """Verifica un JWT de Supabase y devuelve el payload."""
    try:
        # Obtener el header para ver el kid
        header = jwt.get_unverified_header(token)
        kid = header.get("kid")
        if not kid:
            return None

        # Buscar la clave correspondiente en JWKS
        jwks = _fetch_jwks()
        keys = jwks.get("keys", [])
        key = next((k for k in keys if k.get("kid") == kid), None)
        if not key:
            # Refrescar JWKS si no encontró
            global _JWKS
            _JWKS = None
            jwks = _fetch_jwks()
            keys = jwks.get("keys", [])
            key = next((k for k in keys if k.get("kid") == kid), None)
        if not key:
            return None

        # Obtener el RSA public key
        public_key = jwt.algorithms.RSAAlgorithm.from_jwk(key)

        # Verificar token
        payload = jwt.decode(
            token,
            public_key,
            algorithms=["RS256"],
            audience="authenticated",
            options={"verify_exp": True},
        )
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None
    except Exception as e:
        logger.warning(f"Error verificando JWT: {e}")
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
