import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";

const NAV = [
  { href: "/features", label: "Producto" },
  { href: "/community", label: "Comunidad" },
  { href: "/leaderboard", label: "Ranking" },
  { href: "/pricing", label: "Precios" },
] as const;

export function TopBar() {
  return (
    <header className="sticky top-0 z-50 border-0 bg-[rgba(10,12,16,0.72)] backdrop-blur-[14px] relative">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-8 px-6">
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

        <nav className="hidden items-center gap-6 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-muted transition-colors hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-muted transition-colors hover:text-ink"
          >
            Iniciar sesión
          </Link>
          <Link href="/register" className={buttonClasses("primary", "sm")}>
            Crear cuenta
          </Link>
        </div>
      </div>
    </header>
  );
}
