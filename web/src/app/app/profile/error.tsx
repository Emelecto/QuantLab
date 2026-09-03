"use client";

import { useEffect } from "react";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";

export default function ProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Profile page error:", error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6">
      <h2 className="text-lg font-semibold text-ink">
        No se pudo cargar tu perfil
      </h2>
      <p className="text-sm text-muted">{String(error?.message || error)}</p>
      <p className="text-xs text-muted break-all max-w-lg">
        {String(error?.stack || "").split("\n").slice(0, 6).join("\n")}
      </p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={reset}
          className={buttonClasses("primary", "md")}
        >
          Reintentar
        </button>
        <Link href="/app" className={buttonClasses("secondary", "md")}>
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}