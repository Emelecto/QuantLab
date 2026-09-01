"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback } from "react";
import { Icon } from "./Sidebar";

const ITEMS = [
  { href: "/app", label: "Inicio", icon: "home" },
  { href: "/app/tournaments", label: "Competencias", icon: "trophy" },
  { href: "/app/learn", label: "Aprende", icon: "book" },
  { href: "/app/profile", label: "Perfil", icon: "user" },
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();
  const active = (href: string) => href === "/app" ? pathname === "/app" : pathname.startsWith(href);

  const showBackArrow = pathname !== "/app";

  const handleBack = useCallback(() => {
    if (window.history.length > 1) {
      window.history.back();
    }
  }, []);

  return (
    <nav className="ql-dash-bottomnav" aria-label="Navegación móvil">
      {showBackArrow && (
        <button
          type="button"
          className="ql-back-nav-button"
          onClick={handleBack}
          title="Volver atrás"
          aria-label="Volver atrás"
        >
          <Icon name="arrow-left" size={18} />
        </button>
      )}
      {ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={active(item.href) ? "on" : ""}
          aria-label={item.label}
          aria-current={active(item.href) ? "page" : undefined}
        >
          <Icon name={item.icon} size={18} />
        </Link>
      ))}
    </nav>
  );
}