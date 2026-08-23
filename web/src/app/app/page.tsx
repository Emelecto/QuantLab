"use client";

import Link from "next/link";
import { useAuth } from "@/lib/useAuth";
import { AuthGuard } from "@/lib/AuthGuard";

function DashboardContent() {
  const { user, signOut } = useAuth();
  const email = user?.email ?? "";

  return (
    <main className="flex min-h-screen flex-col bg-bg">
      <header className="flex items-center justify-between border-b border-line px-6 py-4">
        <span className="text-sm font-semibold tracking-tight text-ink">
          QuantLab
        </span>
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
          Este es tu dashboard. El contenido completo lo construye otro agente.
        </p>

        <nav className="mt-10 flex flex-col gap-3">
          <Link
            href="/app/strategies"
            className="ql-glass ql-elev-1 flex h-12 items-center rounded-lg px-4 text-sm font-medium text-ink transition-colors hover:border-accent"
          >
            Mis estrategias →
          </Link>
        </nav>
      </section>
    </main>
  );
}

export default function AppDashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}
