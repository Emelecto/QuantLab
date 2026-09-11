import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileBottomNav } from "@/components/dashboard/MobileBottomNav";
import { CommandPalette } from "@/components/command-palette";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="ql-app-shell">
      <Sidebar />
      <div className="ql-dash-main">
        {children}
        <MobileBottomNav />
        <CommandPalette />
      </div>
    </div>
  );
}
