import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileBottomNav } from "@/components/dashboard/MobileBottomNav";
import "@/components/learn/learn.css";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="ql-app-shell">
      <Sidebar />
      <div className="ql-dash-main">
        {children}
        <MobileBottomNav />
      </div>
    </div>
  );
}
