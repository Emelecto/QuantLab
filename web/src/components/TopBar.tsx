"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { buttonClasses } from "@/components/ui/Button";
import { useAuth } from "@/lib/useAuth";

const PUBLIC_NAV = [
  { href: "/features", label: "Producto" },
  { href: "/community", label: "Comunidad" },
  { href: "/leaderboard", label: "Ranking" },
  { href: "/pricing", label: "Precios" },
] as const;

export function TopBar() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  async function handleSignOut() {
    await signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-0 bg-[rgba(10,12,16,0.72)] backdrop-blur-[14px] relative">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-6 px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-ink"
        >
          <span
            aria-hidden
            className="ql-glow-box inline-block h-2.5 w-2.5 rounded-sm bg-accent"
          />
          QuantLab
        </Link>

        {user ? (
          // Sesión iniciada: solo lo esencial, sin duplicar.
          <nav className="hidden items-center gap-6 md:flex">
            <Link
              href="/app"
              className="text-sm text-muted transition-colors hover:text-ink"
            >
              Dashboard
            </Link>
            <Link
              href="/"
              className="text-sm text-muted transition-colors hover:text-ink"
            >
              Ir a inicio
            </Link>
          </nav>
        ) : (
          <nav className="hidden items-center gap-6 md:flex">
            {PUBLIC_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-muted transition-colors hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}

        <div className="ml-auto flex items-center gap-3">
          {user ? (
            <button
              onClick={handleSignOut}
              className="text-sm font-medium text-muted transition-colors hover:text-ink"
            >
              Cerrar sesión
            </button>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-muted transition-colors hover:text-ink"
              >
                Iniciar sesión
              </Link>
              <Link href="/register" className={buttonClasses("primary", "sm")}>
                Crear cuenta
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
