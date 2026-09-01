"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { getBalance } from "@/lib/tokens";
import { NotificationBell } from "@/components/dashboard/NotificationBell";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import "./dashboard.css";

const ADMIN_USER_IDS = ["2ca7b197-86f5-4605-9789-266bf8a0df01"];

const NAV = [
  { href: "/app", label: "Inicio", icon: "home" },
  { href: "/app/tournaments", label: "Competencias", icon: "trophy" },
  { href: "/app/marketplace", label: "Marketplace", icon: "store" },
  { href: "/app/learn", label: "Aprende", icon: "book" },
  { href: "/app/library", label: "Datasets", icon: "database" },
  { href: "/app/api-keys", label: "API Keys", icon: "key" },
  { href: "/app/profile", label: "Perfil", icon: "user" },
  { href: "/app/profile/referrals", label: "Referidos", icon: "gift" },
  { href: "/app/profile/badges", label: "Logros", icon: "star" },
] as const;

const COLLAPSE_KEY = "ql:sidebar-collapsed";
const WIDTH_KEY = "ql:sidebar-width";
const MIN_WIDTH = 200;
const MAX_WIDTH = 360;
const COLLAPSED_WIDTH = 72;

const ADMIN_NAV = [
  { href: "/app/admin", label: "Admin", icon: "shield" },
] as const;

export function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "home":
      return (
        <svg {...common}>
          <path d="M3 12l9-9 9 9" />
          <path d="M5 10v10h14V10" />
        </svg>
      );
    case "trophy":
      return (
        <svg {...common}>
          <path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 01-10 0V4z" />
          <path d="M17 4h3v2a3 3 0 01-3 3M7 4H4v2a3 3 0 003 3" />
        </svg>
      );
    case "store":
      return (
        <svg {...common}>
          <path d="M3 9l1-5h16l1 5" />
          <path d="M4 9v11h16V9" />
          <path d="M8 14h8" />
        </svg>
      );
    case "book":
      return (
        <svg {...common}>
          <path d="M4 4h7a4 4 0 014 4v12H8a4 4 0 01-4-4V4z" />
          <path d="M15 4h5v12h-5" />
        </svg>
      );
    case "database":
      return (
        <svg {...common}>
          <ellipse cx="12" cy="6" rx="8" ry="3" />
          <path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6" />
          <path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" />
        </svg>
      );
    case "user":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c0-4 4-7 8-7s8 3 8 7" />
        </svg>
      );
    case "plus":
      return (
        <svg {...common}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case "key":
      return (
        <svg {...common}>
          <circle cx="8" cy="14" r="3" />
          <path d="M11 13l9-9" />
          <path d="M17 7l3 3" />
          <path d="M14 10l3 3" />
        </svg>
      );
    case "chevrons-left":
      return (
        <svg {...common}>
          <path d="M11 17l-5-5 5-5" />
          <path d="M18 17l-5-5 5-5" />
        </svg>
      );
    case "chevrons-right":
      return (
        <svg {...common}>
          <path d="M13 17l5-5-5-5" />
          <path d="M6 17l5-5-5-5" />
        </svg>
      );
    case "strategies":
      return (
        <svg {...common}>
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <path d="M14 2v6h6M9 12h6M9 16h6M9 8h1" />
        </svg>
      );
    case "gift":
      return (
        <svg {...common}>
          <path d="M12 6V22M12 6H8a2 2 0 010-4h4a2 2 0 014 0h-4M12 6H16a2 2 0 000-4h-4a2 2 0 00-4 0h4" />
          <path d="M5 12h14v4H5z" />
          <path d="M12 12v10" />
        </svg>
      );
    case "star":
      return (
        <svg {...common}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      );
    case "shield":
      return (
        <svg {...common}>
          <path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      );
    case "arrow-left":
      return (
        <svg {...common}>
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      );
    default:
      return null;
  }
}

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [width, setWidth] = useState(248);
  const [dragging, setDragging] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const widthRef = useRef(width);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const c = localStorage.getItem(COLLAPSE_KEY);
        if (c === "1") setCollapsed(true);
        const w = localStorage.getItem(WIDTH_KEY);
        if (w) {
          const parsed = parseInt(w, 10);
          if (parsed >= MIN_WIDTH && parsed <= MAX_WIDTH) {
            widthRef.current = parsed;
            setWidth(parsed);
          }
        }
      } catch {
        /* ignore */
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  // Verificar si el usuario es admin
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const supabase = createBrowserSupabaseClient();
        const { data } = await supabase.auth.getUser();
        if (data.user && ADMIN_USER_IDS.includes(data.user.id)) {
          setIsAdmin(true);
        }
      } catch {
        /* ignore */
      }
    };
    checkAdmin();
  }, []);

  useEffect(() => {
    if (collapsed) return;
    let active = true;
    (async () => {
      try {
        const b = await getBalance();
        if (active) setBalance(b.balance);
      } catch {
        /* ignore */
      }
    })();
    return () => { active = false; };
  }, [collapsed]);

  const toggle = useCallback(() => {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (collapsed) return;
    e.preventDefault();
    setDragging(true);
    const startX = e.clientX;
    const startWidth = width;

    const onMouseMove = (ev: MouseEvent) => {
      const delta = ev.clientX - startX;
      const next = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth + delta));
      widthRef.current = next;
      setWidth(next);
      if (sidebarRef.current) {
        sidebarRef.current.style.width = `${next}px`;
        sidebarRef.current.style.flexBasis = `${next}px`;
      }
    };
    const onMouseUp = () => {
      setDragging(false);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      try {
        localStorage.setItem(WIDTH_KEY, String(widthRef.current));
      } catch {
        /* ignore */
      }
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, [width, collapsed]);

  const isActive = (href: string) =>
    href === "/app" ? pathname === "/app" : pathname.startsWith(href);

  // Determine if we should show the back arrow (not on the main dashboard)
  const showBackArrow = pathname !== "/app";

  const handleBack = useCallback(() => {
    if (window.history.length > 1) {
      window.history.back();
    }
  }, []);

  return (
    <aside
      ref={sidebarRef}
      className={`ql-sidebar${collapsed ? " collapsed" : ""}`}
      style={{ width: collapsed ? COLLAPSED_WIDTH : width, flexBasis: collapsed ? COLLAPSED_WIDTH : width }}
    >
      {/* Brand + Collapse toggle (top row) */}
      <div className="ql-sidebar-top">
        <Link href="/" className="ql-brand" title="Volver al landing">
          <span className="ql-glow-box inline-block h-2.5 w-2.5 rounded-sm bg-accent" />
          {!collapsed && (
            <span className="ql-brand-text">
              <span>QuantLab</span>
              {balance != null && (
                <span className="ql-sidebar-balance">{balance.toLocaleString()} QP</span>
              )}
            </span>
          )}
        </Link>
        <div className="flex items-center gap-1">
          {!collapsed && <NotificationBell />}
          <button className="ql-collapse-toggle" type="button" onClick={toggle} title={collapsed ? "Expandir" : "Colapsar"} aria-label={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}>
            <Icon name={collapsed ? "chevrons-right" : "chevrons-left"} size={16} />
          </button>
        </div>
      </div>

      {/* Back arrow button */}
      {showBackArrow && (
        <button
          type="button"
          className="ql-back-button"
          onClick={handleBack}
          title="Volver atrás"
          aria-label="Volver atrás"
        >
          <Icon name="arrow-left" size={16} />
        </button>
      )}

      {/* Nav items */}
      {NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`ql-nav-item${isActive(item.href) ? " active" : ""}`}
          title={collapsed ? item.label : undefined}
        >
          <span className="ic">
            <Icon name={item.icon} />
          </span>
          {!collapsed && <span>{item.label}</span>}
        </Link>
      ))}

      {/* Admin nav (solo para admins) */}
      {isAdmin && ADMIN_NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`ql-nav-item${isActive(item.href) ? " active" : ""}`}
          title={collapsed ? item.label : undefined}
        >
          <span className="ic">
            <Icon name={item.icon} />
          </span>
          {!collapsed && <span>{item.label}</span>}
        </Link>
      ))}

      <div className="ql-sidebar-spacer" />

      {/* Resize handle */}
      {!collapsed && (
        <div
          onMouseDown={onMouseDown}
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 8,
            height: "100%",
            cursor: "col-resize",
            zIndex: 40,
            background: dragging ? "var(--ql-accent)" : "var(--ql-line)",
            opacity: dragging ? 0.7 : 0.25,
            transition: "opacity 0.15s",
          }}
          className="ql-sidebar-resize"
        />
      )}
    </aside>
  );
}