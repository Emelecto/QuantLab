"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { buttonClasses } from "@/components/ui/Button";
import { useAuth } from "@/lib/useAuth";
import { getBalance } from "@/lib/tokens";
import { useCountUp } from "@/hooks/useCountUp";

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

  // Badge QP: balance en vivo de la wallet (solo con sesión iniciada).
  const [qpBalance, setQpBalance] = useState<number | null>(null);
  const [qpError, setQpError] = useState(false);
  const animatedQp = useCountUp(qpBalance ?? 0);

  useEffect(() => {
    if (!user) return;
    let active = true;
    setQpError(false);
    (async () => {
      try {
        const b = await getBalance();
        if (active) setQpBalance(b.balance);
      } catch {
        if (active) setQpError(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [user]);

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
          // Sesión iniciada: navegación de app autenticada.
          <nav className="hidden items-center gap-5 md:flex">
            <Link
              href="/app"
              className="text-sm text-muted transition-colors hover:text-ink"
            >
              Dashboard
            </Link>
            <Link
              href="/app/tournaments"
              data-tour="tournaments-link"
              className="text-sm text-muted transition-colors hover:text-ink"
            >
              Torneos
            </Link>
            <Link
              href="/app/marketplace"
              className="text-sm text-muted transition-colors hover:text-ink"
            >
              Mercado
            </Link>
            <Link
              href="/app/rankings"
              className="text-sm text-muted transition-colors hover:text-ink"
            >
              Rankings
            </Link>
            <Link
              href="/app/api-keys"
              className="text-sm text-muted transition-colors hover:text-ink"
            >
              API
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
          {user && (
            <>
              {/* Badge QP: enlace a la wallet. Completo en sm+, solo ícono en móvil. */}
              <Link
                href="/app/wallet"
                aria-label="Mi wallet de QuantPoints"
                data-tour="qp-badge"
                className="ql-glass-hover hidden items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent transition-colors hover:border-accent/50 sm:flex"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-3.5 w-3.5"
                >
                  <path d="M6 3h12l3 9-9 9-9-9 3-9Z" />
                  <path d="M9 8h6" />
                </svg>
                {qpError ? "QP —" : qpBalance == null ? "QP …" : `QP ${animatedQp}`}
              </Link>
              {/* Variante móvil: ícono compacto para no romper el layout. */}
              <Link
                href="/app/wallet"
                aria-label="Mi wallet de QuantPoints"
                className="ql-glass-hover flex items-center rounded-full border border-accent/30 bg-accent/10 p-1.5 text-accent transition-colors hover:border-accent/50 sm:hidden"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-3.5 w-3.5"
                >
                  <path d="M6 3h12l3 9-9 9-9-9 3-9Z" />
                  <path d="M9 8h6" />
                </svg>
              </Link>
            </>
          )}
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
                Empieza gratis
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
