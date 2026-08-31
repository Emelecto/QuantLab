"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import "./dashboard.css";

const NAV = [
  { href: "/app", label: "Inicio", icon: "🏠" },
  { href: "/app/tournaments", label: "Competencias", icon: "🏆" },
  { href: "/app/marketplace", label: "Marketplace", icon: "🛒" },
  { href: "/app/learn", label: "Aprende", icon: "🎓" },
  { href: "/app/library", label: "Datasets", icon: "📊" },
  { href: "/app/profile", label: "Perfil", icon: "👤" },
  { href: "/app/settings", label: "Config", icon: "⚙️" },
] as const;

const FAVORITES = [
  { label: "BTC-1h", icon: "🔖" },
  { label: "Torneo Primavera", icon: "🔖" },
  { label: "Mi SMA", icon: "🔖" },
] as const;

const COLLAPSE_KEY = "ql:sidebar-collapsed";

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = () => {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const isActive = (href: string) =>
    href === "/app" ? pathname === "/app" : pathname.startsWith(href);

  return (
    <aside className={`ql-sidebar${collapsed ? " collapsed" : ""}`}>
      <div className="ql-brand">
        <span className="brand-mark">⚡</span>
        <span>QuantLab</span>
      </div>

      {NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`ql-nav-item${isActive(item.href) ? " active" : ""}`}
          title={item.label}
        >
          <span className="ic">{item.icon}</span>
          <span>{item.label}</span>
        </Link>
      ))}

      <div className="ql-divider" />

      <div className="ql-fav-title">
        <span>Favoritos</span>
        <span>⭐</span>
      </div>
      {FAVORITES.map((f) => (
        <button key={f.label} className="ql-fav-item" type="button" title={f.label}>
          <span className="ic">{f.icon}</span>
          <span>{f.label}</span>
        </button>
      ))}

      <div className="ql-sidebar-spacer" />

      <button className="ql-collapse-btn" type="button" onClick={toggle} title="Colapsar">
        <span className="ic">⟨⟩</span>
        <span>Colapsar</span>
      </button>
    </aside>
  );
}
