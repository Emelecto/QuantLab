# Tests para el middleware CORS dinámico.
# Verifica que:
#   1. Sin CORS_ORIGINS configurado → refleja el Origin del request + Allow-Credentials.
#   2. Con CORS_ORIGINS configurado → solo refleja Origins de la lista blanca.
#   3. Preflight OPTIONS responde 200 con los headers correctos.

import os
import pytest
from fastapi.testclient import TestClient


def _make_app_with_cors(cors_origins_env: str | None):
    """Reconfigura el app con un valor específico de CORS_ORIGINS."""
    if cors_origins_env is not None:
        os.environ["CORS_ORIGINS"] = cors_origins_env
    elif "CORS_ORIGINS" in os.environ:
        del os.environ["CORS_ORIGINS"]

    # Forzar reimport del módulo main para que lea el nuevo env.
    import importlib
    import main as main_mod
    importlib.reload(main_mod)
    return main_mod.app


def test_cors_no_env_reflects_origin_and_allows_credentials():
    """Sin CORS_ORIGINS, cualquier Origin debe ser reflejado con credentials=true."""
    app = _make_app_with_cors("")  # vacío = no configurado
    client = TestClient(app)
    resp = client.options(
        "/health",
        headers={
            "Origin": "https://mi-app.vercel.app",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert resp.status_code == 200
    assert resp.headers.get("access-control-allow-origin") == "https://mi-app.vercel.app"
    assert resp.headers.get("access-control-allow-credentials") == "true"


def test_cors_with_env_only_allows_whitelist():
    """Con CORS_ORIGINS, solo los Origins en la lista blanca reciben CORS headers."""
    app = _make_app_with_cors("https://app.quantlab.io,https://foo.vercel.app")
    client = TestClient(app)

    # Origin permitido
    resp = client.options(
        "/health",
        headers={
            "Origin": "https://app.quantlab.io",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert resp.status_code == 200
    assert resp.headers.get("access-control-allow-origin") == "https://app.quantlab.io"
    assert resp.headers.get("access-control-allow-credentials") == "true"

    # Origin NO permitido → no debe recibir CORS headers específicos.
    resp2 = client.options(
        "/health",
        headers={
            "Origin": "https://malicious-site.com",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert resp2.status_code == 200
    assert resp2.headers.get("access-control-allow-origin") != "https://malicious-site.com"


def test_cors_preflight_on_post_endpoint():
    """Preflight para POST /marketplace/publish debe incluir POST en métodos permitidos."""
    app = _make_app_with_cors("")  # sin env → abierto
    client = TestClient(app)
    resp = client.options(
        "/marketplace/publish",
        headers={
            "Origin": "https://mi-app.vercel.app",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Content-Type,Authorization",
        },
    )
    assert resp.status_code == 200
    assert resp.headers.get("access-control-allow-origin") == "https://mi-app.vercel.app"
    assert resp.headers.get("access-control-allow-credentials") == "true"
    assert "POST" in resp.headers.get("access-control-allow-methods", "")


def test_cors_no_origin_header_gets_wildcard():
    """Sin header Origin, responde con * (modo abierto, sin credentials)."""
    app = _make_app_with_cors("")  # sin env
    client = TestClient(app)
    resp = client.get("/health")
    assert resp.status_code == 200
    # Sin Origin, el middleware pone "*" (no credentials porque no hay origen que validar).
    assert resp.headers.get("access-control-allow-origin") == "*"