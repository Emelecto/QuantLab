"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Puente ligero para la Biblioteca: cuando el SPA (iframe) pide volver a Aprende
// vía postMessage, navegamos a /learn en el padre.
type BridgeMsg = { source: string; type: string; route?: string };

export function LibraryBridge() {
  const router = useRouter();
  useEffect(() => {
    function onMessage(e: MessageEvent<BridgeMsg>) {
      const msg = e.data;
      if (msg && msg.source === "ruta-aprendiz" && msg.type === "navigate" && msg.route) {
        router.push(`/${msg.route}`);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [router]);

  return null;
}
