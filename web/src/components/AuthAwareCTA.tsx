"use client";

import Link from "next/link";
import { useAuth } from "@/lib/useAuth";
import { buttonClasses } from "@/components/ui/Button";

/**
 * CTA que cambia según el estado de sesión:
 * - Sin sesión: muestra `loggedOutLabel` (ej. "Empieza gratis") → `loggedOutHref` (/register)
 * - Con sesión: muestra `loggedInLabel` (ej. "Ir al dashboard") → `loggedInHref` (/app)
 *
 * Evita la incongruencia de ver "Empieza gratis" / "Crear cuenta" cuando ya
 * estás logeado (y que te mande a /register de nuevo).
 */
export function AuthAwareCTA({
  loggedOutLabel = "Empieza gratis",
  loggedOutHref = "/register",
  loggedInLabel = "Ir al dashboard",
  loggedInHref = "/app",
  size = "lg",
  className,
}: {
  loggedOutLabel?: string;
  loggedOutHref?: string;
  loggedInLabel?: string;
  loggedInHref?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const { user, loading } = useAuth();

  // Mientras carga, mostramos el CTA de registro (comportamiento público por defecto)
  const isAuthed = !loading && !!user;

  return (
    <Link
      href={isAuthed ? loggedInHref : loggedOutHref}
      className={buttonClasses("primary", size) + (className ? ` ${className}` : "")}
    >
      {isAuthed ? loggedInLabel : loggedOutLabel}
    </Link>
  );
}
