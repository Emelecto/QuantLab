import { Sidebar } from "@/components/dashboard/Sidebar";
import "@/components/learn/learn.css";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh", gap: 24 }}>
      <Sidebar />
      <div className="ql-dash-main">
        {children}
        <nav className="ql-dash-bottomnav" aria-label="Navegación móvil">
          <a href="/app" className="on">🏠</a>
          <a href="/app/tournaments">⚔️</a>
          <a href="/learn">🎓</a>
          <a href="/app/profile">👤</a>
        </nav>
      </div>
    </div>
  );
}
