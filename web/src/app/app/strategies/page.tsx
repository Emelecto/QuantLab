"use client";

import Link from "next/link";
import { useAuth } from "@/lib/useAuth";
import { AuthGuard } from "@/lib/AuthGuard";

function StrategiesContent() {
  const { user } = useAuth();
  const email = user?.email ?? "";

  return (
    <main className="flex min-h-screen flex-col bg-bg">
      <section className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">
          Hola {email}
        </h1>
        <p className="mt-2 text-muted">
          Aquí irá el listado de estrategias (placeholder). El contenido completo
          lo construye otro agente.
        </p>

        <div className="ql-glass ql-elev-1 mt-10 flex flex-col items-center gap-4 rounded-xl px-6 py-14 text-center animate-fadeIn">
                  <span
                    aria-hidden
                    className="flex h-14 w-14 items-center justify-center rounded-full border border-accent/30 bg-accent/10 text-accent"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.6}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-7 w-7"
                    >
                      <path d="M3 3v18h18" />
                      <path d="M7 14l3-4 3 3 4-6" />
                      <circle cx="17" cy="7" r="1.4" fill="currentColor" stroke="none" />
                    </svg>
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-ink">
                      Sin estrategias todavía
                    </h3>
                    <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-muted">
                      Crea tu primera estrategia, pruébala con datos reales y descubre si sobrevive fuera de muestra.
                    </p>
                  </div>
                  <Link
                    href="/app/strategies/new"
                    className="ql-btn-primary ql-btn h-9 rounded-md px-5 text-sm font-medium"
                  >
                    Crear estrategia
                  </Link>
                </div>
      </section>
    </main>
  );
}

export default function StrategiesPage() {
  return (
    <AuthGuard>
      <StrategiesContent />
    </AuthGuard>
  );
}
