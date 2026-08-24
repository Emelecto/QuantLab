# Servidor MCP de QuantLab — conecta tu agente IA (Claude Code, Cursor, Codex CLI)
# a QuantLab para operar torneos, consultar QP y suscribirte a estrategias en lenguaje natural.
#
# Requiere: mcp>=2.0 (pip install -r requirements.txt)

import json
import os

import httpx
from mcp.server.mcpserver import MCPServer

WORKER = os.environ.get("QUANTLAB_WORKER_URL", "https://quantlab-worker.onrender.com").rstrip("/")
TOKEN = os.environ.get("QUANTLAB_TOKEN", "")

mcp = MCPServer(
    name="quantlab",
    instructions=(
        "Servidor de QuantLab: plataforma de torneos de estrategias de trading con rigor "
        "out-of-sample. Usa las tools para listar torneos, ver leaderboards, consultar el "
        "balance QP del usuario, enviar estrategias y suscribirse a estrategias del marketplace. "
        "Las tools marcadas como autenticadas requieren QUANTLAB_TOKEN válido."
    ),
)


def _headers(auth: bool) -> dict:
    h = {"Content-Type": "application/json"}
    if auth:
        if not TOKEN:
            raise RuntimeError(
                "Esta acción requiere QUANTLAB_TOKEN. Configúralo como variable de entorno (ver README.md)."
            )
        h["Authorization"] = f"Bearer {TOKEN}"
    return h


def _get(path: str, auth: bool = False):
    try:
        r = httpx.get(f"{WORKER}{path}", headers=_headers(auth), timeout=30)
    except httpx.HTTPError as e:
        return {"error": f"No se pudo conectar al worker: {e}"}
    if r.status_code == 401:
        return {"error": "Tu QUANTLAB_TOKEN es inválido o expiró. Genera uno nuevo desde la app."}
    if r.status_code >= 400:
        try:
            j = r.json()
            return {"error": j.get("detail") or j.get("error") or f"HTTP {r.status_code}"}
        except Exception:
            return {"error": f"HTTP {r.status_code}"}
    return r.json()


def _post(path: str, body: dict, auth: bool = False):
    try:
        r = httpx.post(f"{WORKER}{path}", headers=_headers(auth), json=body, timeout=30)
    except httpx.HTTPError as e:
        return {"error": f"No se pudo conectar al worker: {e}"}
    if r.status_code == 401:
        return {"error": "Tu QUANTLAB_TOKEN es inválido o expiró. Genera uno nuevo desde la app."}
    if r.status_code >= 400:
        try:
            j = r.json()
            return {"error": j.get("detail") or j.get("error") or f"HTTP {r.status_code}"}
        except Exception:
            return {"error": f"HTTP {r.status_code}"}
    return r.json()


@mcp.tool()
def list_tournaments() -> str:
    """Lista los torneos abiertos de QuantLab. Úsala cuando el usuario pregunte
    en qué torneos puede participar o quiera ver competencias activas."""
    data = _get("/tournament/list")
    if isinstance(data, dict) and "error" in data:
        return f"❌ {data['error']}"
    if not data:
        return "No hay torneos abiertos en este momento."
    lines = ["🏆 Torneos abiertos:"]
    for t in data:
        syms = ", ".join(t.get("symbols", []))
        lines.append(
            f"• {t.get('name')} (id: {t['id']})\n"
            f"  Símbolos: {syms} · Timeframe: {t.get('timeframe')} · Estado: {t.get('status')}\n"
            f"  Deadline submissions: {t.get('submission_deadline', '—')}"
        )
    return "\n".join(lines)


@mcp.tool()
def get_leaderboard(tournament_id: str) -> str:
    """Devuelve el ranking (leaderboard) de un torneo. Necesita el id del torneo
    (list_tournaments lo muestra)."""
    data = _get(f"/tournament/{tournament_id}/leaderboard")
    if isinstance(data, dict) and "error" in data:
        return f"❌ {data['error']}"
    if not data:
        return "El leaderboard está vacío todavía."
    lines = ["🥇 Leaderboard:"]
    for e in data:
        prof = e.get("profiles") or {}
        name = prof.get("username") or prof.get("display_name") or e.get("user_id", "?")
        score = e.get("score")
        score_s = f"{score:.4f}" if isinstance(score, (int, float)) else "—"
        lines.append(f"{e.get('rank', '?')}. {name} · Score {score_s} · +{e.get('qp_earned', 0)} QP")
    return "\n".join(lines)


@mcp.tool()
def get_my_submission(tournament_id: str) -> str:
    """Muestra TU submission actual en un torneo (requiere QUANTLAB_TOKEN)."""
    data = _get(f"/tournament/{tournament_id}/my-submission", auth=True)
    if isinstance(data, dict) and "error" in data:
        return f"❌ {data['error']}"
    sub = data.get("data") if isinstance(data, dict) else None
    if not sub:
        return "No tienes submission en este torneo todavía."
    return (
        "📤 Tu submission:\n"
        f"• Estado: {sub.get('status')}\n"
        f"• Código: {sub.get('code')}\n"
        f"• Enviada: {sub.get('submitted_at')}"
    )


@mcp.tool()
def submit_strategy(tournament_id: str, code: str, config_json_str: str, qp_stake: int = 0) -> str:
    """Envía una estrategia a un torneo (requiere QUANTLAB_TOKEN).
    code: la lógica/params de la estrategia (ej: 'fast=20,slow=50').
    config_json_str: configuración como string JSON, ej: '{"fast":20,"slow":50}'.
    qp_stake: QuantPoints a apostar (opcional, default 0)."""
    try:
        config = json.loads(config_json_str)
        if not isinstance(config, dict):
            return "❌ El config debe ser un objeto JSON, ej: '{\"fast\":20,\"slow\":50}'"
    except json.JSONDecodeError as e:
        return f"❌ El config no es JSON válido: {e}. Ejemplo correcto: {{\"fast\":20,\"slow\":50}}"
    data = _post(
        "/tournament/submit",
        {
            "tournament_id": tournament_id,
            "code": code,
            "config": config,
            "qp_stake": qp_stake,
        },
        auth=True,
    )
    if isinstance(data, dict) and "error" in data:
        return f"❌ {data['error']}"
    return f"✅ Estrategia enviada (id: {data.get('id')}, estado: {data.get('status')})."


@mcp.tool()
def get_qp_balance() -> str:
    """Consulta tu balance de QuantPoints (QP). Requiere QUANTLAB_TOKEN."""
    data = _get("/tokens/balance", auth=True)
    if isinstance(data, dict) and "error" in data:
        return f"❌ {data['error']}"
    tier = data.get("tier", "free").capitalize()
    return f"💰 Balance: {data.get('balance', 0)} QP · Tier: {tier} · Ganados históricos: {data.get('lifetime_earned', 0)}"


@mcp.tool()
def list_marketplace() -> str:
    """Lista las estrategias publicadas en el marketplace de QuantLab."""
    data = _get("/marketplace")
    if isinstance(data, dict) and "error" in data:
        return f"❌ {data['error']}"
    if not data:
        return "El marketplace está vacío todavía."
    lines = ["🛒 Marketplace:"]
    for s in data[:20]:
        price = s.get("price_qp_week", 0)
        subs = s.get("subscribers", 0)
        lines.append(
            f"• {s.get('title')} (id: {s['id']})\n"
            f"  {s.get('symbol')} · {price} QP/semana · {subs} suscriptores"
        )
    return "\n".join(lines)


@mcp.tool()
def subscribe_strategy(strategy_id: str) -> str:
    """Suscríbete a una estrategia del marketplace gastando QP (requiere QUANTLAB_TOKEN).
    Necesita el id de la estrategia (list_marketplace lo muestra)."""
    data = _post(f"/marketplace/{strategy_id}/subscribe", {}, auth=True)
    if isinstance(data, dict) and "error" in data:
        return f"❌ {data['error']}"
    return f"✅ Suscripción activa (id: {data.get('id')}, estado: {data.get('status')})."


if __name__ == "__main__":
    mcp.run(transport="stdio")
