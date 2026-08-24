"""Entry point CLI para ejecutar el scheduler de torneos QuantLab.

Uso:
    python run_scheduler.py              # Ejecuta --all por defecto
    python run_scheduler.py --create-tournament
    python run_scheduler.py --evaluate
    python run_scheduler.py --all
"""
from __future__ import annotations

import argparse
import logging
import os
import sys
from datetime import datetime, timezone

# Añadir el directorio worker al path para imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


def get_supabase_client():
    """Crea cliente Supabase desde variables de entorno."""
    from supabase import create_client

    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise RuntimeError(
            "SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridas"
        )
    return create_client(url, key)


def run_create_tournament() -> None:
    """Ejecuta create_weekly_tournament."""
    from scheduler import create_weekly_tournament

    sb = get_supabase_client()
    now = datetime.now(timezone.utc)
    result = create_weekly_tournament(sb, now)
    if result:
        logger.info(f"Torneo creado exitosamente: {result.get('id')}")
    else:
        logger.info("No se creó ningún torneo (posible duplicado)")


def run_evaluate() -> None:
    """Ejecuta evaluate_tournaments."""
    import engine
    from scheduler import evaluate_tournaments

    sb = get_supabase_client()
    now = datetime.now(timezone.utc)
    evaluated = evaluate_tournaments(sb, engine, now)
    logger.info(f"Torneos evaluados: {evaluated}")


def run_all() -> None:
    """Ejecuta create_weekly_tournament y luego evaluate_tournaments."""
    logger.info("=== Iniciando scheduler completo ===")
    run_create_tournament()
    run_evaluate()
    logger.info("=== Scheduler finalizado ===")


def main():
    parser = argparse.ArgumentParser(
        description="Scheduler de torneos QuantLab",
    )
    parser.add_argument(
        "--create-tournament",
        action="store_true",
        help="Crear torneo semanal",
    )
    parser.add_argument(
        "--evaluate",
        action="store_true",
        help="Evaluar torneos cerrados",
    )
    parser.add_argument(
        "--all",
        action="store_true",
        default=True,
        help="Ejecutar todo (crear + evaluar). Comportamiento por defecto.",
    )

    args = parser.parse_args()

    # Si no se especifica ninguna acción, --all por defecto
    if not args.create_tournament and not args.evaluate:
        args.all = True

    try:
        if args.all:
            run_all()
        else:
            if args.create_tournament:
                run_create_tournament()
            if args.evaluate:
                run_evaluate()
    except Exception as e:
        logger.error(f"Error ejecutando scheduler: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()