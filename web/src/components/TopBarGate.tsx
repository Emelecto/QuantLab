"use client";

import { usePathname } from "next/navigation";
import { TopBar } from "@/components/TopBar";
import { Footer } from "@/components/Footer";

/**
 * En rutas /app (post-login) el header es el Sidebar del dashboard, no el
 * TopBar público. Este gate oculta TopBar + Footer en /app y los mantiene
 * en el resto del sitio.
 */
export function TopBarGate() {
  const pathname = usePathname();
  const inApp = pathname.startsWith("/app");
  if (inApp) return null;
  return (
    <>
      <TopBar />
      <Footer />
    </>
  );
}
