# QuantLab MCP Server

Conecta tu agente de IA (**Claude Code**, **Cursor**, **Codex CLI**) a QuantLab para
operar la plataforma en lenguaje natural: ver torneos, enviar estrategias, consultar
tu balance de QuantPoints (QP) y suscribirte a estrategias del marketplace.

## Instalación

```bash
cd mcp-server
python -m pip install -r requirements.txt
```

Requiere Python 3.10+.

## Obtén tu QUANTLAB_TOKEN

1. Inicia sesión en https://quant-lab-nine.vercel.app
2. Abre DevTools (F12) → **Application** → **Local Storage** → el sitio de QuantLab
3. Busca la clave que empieza con `sb-` y termina en `auth-token`
4. Copia el valor de `access_token` dentro del JSON

> ⚠️ El token dura ~1 hora. Cuando expire, vuelve a generarlo (pronto habrá API keys dedicadas).

## Configuración

### Claude Code

```bash
claude mcp add quantlab -e QUANTLAB_TOKEN=tu_token -- python C:/Users/ecard/QuantLab/mcp-server/mcp_server.py
```

### Cursor

En `~/.cursor/mcp.json` (o `.cursor/mcp.json` del proyecto):

```json
{
  "mcpServers": {
    "quantlab": {
      "command": "python",
      "args": ["C:/Users/ecard/QuantLab/mcp-server/mcp_server.py"],
      "env": {
        "QUANTLAB_TOKEN": "tu_token"
      }
    }
  }
}
```

### Codex CLI

En `~/.codex/config.toml`:

```toml
[mcp_servers.quantlab]
command = "python"
args = ["C:/Users/ecard/QuantLab/mcp-server/mcp_server.py"]
env = { "QUANTLAB_TOKEN" = "tu_token" }
```

## Ejemplos de uso

Con el servidor configurado, habla naturalmente con tu agente:

- *"¿En qué torneos puedo participar?"*
- *"Muéstrame el leaderboard del torneo de BTC"*
- *"¿Cuántos QP tengo?"*
- *"Envía mi estrategia fast=20 slow=50 al torneo X"*
- *"¿Qué estrategias hay en el marketplace? Suscríbeme a la más barata"*

## Tools disponibles

| Tool | Auth | Descripción |
|------|------|-------------|
| `list_tournaments` | — | Torneos abiertos |
| `get_leaderboard` | — | Ranking de un torneo |
| `list_marketplace` | — | Estrategias publicadas |
| `get_qp_balance` | ✅ | Tu balance QP |
| `get_my_submission` | ✅ | Tu submission en un torneo |
| `submit_strategy` | ✅ | Enviar estrategia a un torneo |
| `subscribe_strategy` | ✅ | Suscribirse a una estrategia |

## Seguridad

- Tu token solo se envía al worker oficial de QuantLab (`https://quantlab-worker.onrender.com`).
- Los permisos los valida el worker en cada llamada; este servidor no guarda nada.
- No compartas tu `QUANTLAB_TOKEN`: da acceso completo a tu cuenta de QuantLab.
