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

        # Obtener la clave pública (Supabase usa ES256 / ECDSA, kty=EC)
        from jwt.algorithms import ECAlgorithm
        public_key = ECAlgorithm.from_jwk(key)

        # Verificar token
        payload = jwt.decode(
            token,
            public_key,
            algorithms=["ES256"],
            audience="authenticated",
            options={"verify_exp": True},
        )
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("[AUTH DEBUG] JWT expirado")
        return None
    except jwt.InvalidTokenError as e:
        logger.warning(f"[AUTH DEBUG] JWT inválido: {e}")
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
