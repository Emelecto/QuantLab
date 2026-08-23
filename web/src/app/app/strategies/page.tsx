"use client";

import Link from "next/link";
import { useAuth } from "@/lib/useAuth";
import { AuthGuard } from "@/lib/AuthGuard";

function StrategiesContent() {
  const { user, signOut } = useAuth();
  const email = user?.email ?? "";

  return (
    <main className="flex min-h-screen flex-col bg-bg">
      <header className="flex items-center justify-between border-b border-line px-6 py-4">
        <Link
          href="/app"
          className="text-sm font-semibold tracking-tight text-ink"
        >
          ← QuantLab
        </Link>
        <button
          onClick={signOut}
          className="text-sm font-medium text-muted transition-colors hover:text-ink"
        >
          Cerrar sesión
        </button>
      </header>

      <section className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">
          Hola {email}
        </h1>
        <p className="mt-2 text-muted">
          Aquí irá el listado de estrategias (placeholder). El contenido completo
          lo construye otro agente.
        </p>

        <div className="ql-glass mt-10 p-8 text-center text-sm text-muted">
          Sin estrategias todavía.
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
