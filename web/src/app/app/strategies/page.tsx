"use client";

import Link from "next/link";
import { useAuth } from "@/lib/useAuth";
import { AuthGuard } from "@/lib/AuthGuard";

function StrategiesContent() {
  const { user, signOut } = useAuth();
  const email = user?.email ?? "";

  return (
    <main className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <header className="flex items-center justify-between border-b border-black/[.08] px-6 py-4 dark:border-white/[.1]">
        <Link
          href="/app"
          className="text-sm font-semibold tracking-tight text-black dark:text-zinc-50"
        >
          ← QuantLab
        </Link>
        <button
          onClick={signOut}
          className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          Cerrar sesión
        </button>
      </header>

      <section className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Hola {email}
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Aquí irá el listado de estrategias (placeholder). El contenido completo
          lo construye otro agente.
        </p>

        <div className="mt-10 rounded-lg border border-dashed border-black/[.15] p-8 text-center text-sm text-zinc-500 dark:border-white/[.15] dark:text-zinc-400">
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
