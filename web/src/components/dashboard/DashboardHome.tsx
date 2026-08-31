"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/useAuth";
import "./dashboard.css";

type Role = "aprendiz" | "competidor" | "creador";

const ROLE_PANELS: Record<Role, { label: string; panels: PanelDef[] }> = {
  aprendiz: {
    label: "Tu ruta de aprendizaje",
    panels: [
      { h: "Próxima lección", big: "Módulo 3", sub: "Tu primera señal — media móvil y cruces." },
      { h: "Progreso del curso", big: "60%", sub: "3 de 5 módulos · racha 12 🔥", bar: 0.6 },
      { h: "Tu debut", big: "🏆 Torneo", sub: "Al terminar el curso entras a un torneo real." },
    ],
  },
  competidor: {
    label: "Tu mesa de competidor",
    panels: [
      { h: "Torneos abiertos", big: "3", sub: "Primavera '25 · Crypto Sprint · Macro Cup." },
      { h: "Tu ranking global", big: "#142", sub: "↑ 8 puestos esta semana", up: true },
      { h: "Win-rate (30d)", big: "58%", sub: "12 trades · +2.4% equity", up: true },
    ],
  },
  creador: {
    label: "Tu centro de creador",
    panels: [
      { h: "Estrategias publicadas", big: "2", sub: "SMA Cross · Mean-Reversion v2." },
      { h: "Copiado automático", big: "14", sub: "usuarios siguiendo tus estrategias." },
      { h: "Ingresos (marketplace)", big: "$86", sub: "este mes · 4 suscripciones", up: true },
    ],
  },
};

type PanelDef = { h: string; big: string; sub: string; bar?: number; up?: boolean };

type Widget = {
  id: string;
  title: string;
  render: (live: LiveState) => ReactNode;
};

type LiveState = {
  price: number;
  dirUp: boolean;
  pos: number;
  eq: number[];
};

const WIDGETS: Widget[] = [
  {
    id: "equity",
    title: "Curva de equity",
    render: (live) => (
      <>
        <span className={live.eq[live.eq.length - 1] >= live.eq[0] ? "ql-up" : "ql-down"}>
          {live.eq[live.eq.length - 1] >= live.eq[0] ? "+2.4%" : "-1.1%"}
        </span>
        <Sparkline data={live.eq} />
      </>
    ),
  },
  {
    id: "dataset",
    title: "Dataset que sigues",
    render: (live) => (
      <>
        <div className="ph">
          <span>Dataset que sigues</span>
          <span>BTC-1h</span>
        </div>
        <div className="big metric">${live.price.toLocaleString("en-US", { maximumFractionDigits: 0 })}</div>
        <div className={`hint ${live.dirUp ? "ql-up" : "ql-down"}`}>{live.dirUp ? "sube ▲" : "baja ▼"}</div>
      </>
    ),
  },
  {
    id: "position",
    title: "Tu posición en torneo",
    render: (live) => (
      <>
        <div className="ph">
          <span>Tu posición en torneo</span>
          <span>Primavera '25</span>
        </div>
        <div className="big metric">
          #{live.pos} <span style={{ fontSize: 14, color: "var(--ql-muted)" }}>/ 142</span>
        </div>
        <div className="hint ql-up">↑ 2 puestos</div>
      </>
    ),
  },
  {
    id: "kpis",
    title: "Tus KPIs",
    render: () => (
      <div className="kpi-row">
        <div className="kpi">Win-rate <b>58%</b></div>
        <div className="kpi">XP <b>1,240</b></div>
        <div className="kpi">Racha <b>12🔥</b></div>
      </div>
    ),
  },
];

function Sparkline({ data }: { data: number[] }) {
  const w = 200;
  const h = 48;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const rng = max - min || 1;
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / rng) * h}`)
    .join(" ");
  return (
    <svg className="ql-spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <polyline fill="none" stroke="var(--ql-accent)" strokeWidth={2} points={pts} />
    </svg>
  );
}

function useLive(): LiveState {
  const [state, setState] = useState<LiveState>({
    price: 64210,
    dirUp: true,
    pos: 7,
    eq: Array.from({ length: 30 }, () => 40 + Math.random() * 6),
  });

  useEffect(() => {
    const t = setInterval(() => {
      setState((s) => {
        const price = s.price + (Math.random() - 0.5) * 120;
        const eq = [...s.eq.slice(1), s.eq[s.eq.length - 1] + (Math.random() - 0.48) * 3];
        return {
          price,
          dirUp: price >= 64210,
          pos: 7 + Math.round(Math.random() * 2),
          eq,
        };
      });
    }, 1500);
    return () => clearInterval(t);
  }, []);

  return state;
}

export function DashboardHome() {
  const { user } = useAuth();
  const role = useMemo<Role>(() => {
    const meta = (user?.user_metadata as { role?: string } | null)?.role;
    if (meta === "competidor" || meta === "creador") return meta;
    return "aprendiz";
  }, [user]);

  // Permite cambiar de rol en la UI para ver el grid por rol (demo del brief).
  const [roleView, setRoleView] = useState<Role>(role);
  useEffect(() => setRoleView(role), [role]);

  const live = useLive();

  // Orden de paneles por rol (reordenable) y de widgets (reordenable).
  const [panels, setPanels] = useState<PanelDef[]>(ROLE_PANELS[roleView].panels);
  const [widgets, setWidgets] = useState<Widget[]>(WIDGETS);
  useEffect(() => setPanels(ROLE_PANELS[roleView].panels), [roleView]);

  const dragPanel = useRef<number | null>(null);
  const dragWidget = useRef<number | null>(null);

  const reorder = <T,>(list: T[], from: number, to: number, set: (v: T[]) => void) => {
    if (from === to || from < 0 || to < 0) return;
    const next = [...list];
    const [m] = next.splice(from, 1);
    next.splice(to, 0, m);
    set(next);
  };

  return (
    <>
      <div className="ql-dash-topbar">
        <div>
          <h1>
            Hola, {user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? "Alex"}{" "}
            <span className="ql-gradient-text">👋</span>
          </h1>
          <div className="sub">Tu dashboard. Cambia el rol para ver cómo se reordena el Inicio.</div>
        </div>
        <div className="ql-dash-controls">
          {(["aprendiz", "competidor", "creador"] as Role[]).map((r) => (
            <button
              key={r}
              type="button"
              className={`ql-role-pill${roleView === r ? " on" : ""}`}
              onClick={() => setRoleView(r)}
            >
              {r[0].toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="ql-dash-content">
        <div className="ql-section-label">{ROLE_PANELS[roleView].label}</div>
        <div className="ql-dash-grid" id="role-panels">
          {panels.map((p, i) => (
            <div
              key={p.h}
              className="ql-panel ql-glass ql-elev-1"
              draggable
              onDragStart={() => (dragPanel.current = i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                reorder(panels, dragPanel.current ?? -1, i, setPanels);
                dragPanel.current = null;
              }}
            >
              <div className="ph">
                <span>{p.h}</span>
              </div>
              <div className="big">{p.big}</div>
              <div className="hint">{p.sub}</div>
              {p.bar !== undefined && (
                <div className="ql-bar">
                  <i style={{ width: `${p.bar * 100}%` }} />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="ql-section-label">Datos en vivo (polling 1.5s)</div>
        <div className="ql-dash-grid" id="live-widgets">
          {widgets.map((w, i) => (
            <div
              key={w.id}
              className="ql-panel ql-glass ql-elev-1"
              draggable
              onDragStart={() => (dragWidget.current = i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                reorder(widgets, dragWidget.current ?? -1, i, setWidgets);
                dragWidget.current = null;
              }}
            >
              <div className="ph">
                <span>{w.title}</span>
              </div>
              {w.render(live)}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
