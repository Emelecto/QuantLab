"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { buttonClasses } from "@/components/ui/Button";
import { AuthShell, Field, inputClasses } from "@/components/ui/Form";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        if (error.code === "invalid_credentials") {
          setError("Credenciales inválidas");
        } else if (
          error.message.toLowerCase().includes("invalid") ||
          error.message.toLowerCase().includes("credential")
        ) {
          setError("Credenciales inválidas");
        } else {
          setError(error.message);
        }
        setLoading(false);
        return;
      }

      router.push("/app");
      router.refresh();
    } catch {
      setError("Ocurrió un error inesperado. Inténtalo de nuevo.");
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Iniciar sesión"
      subtitle="Accede a tu panel de estrategias y corridas fuera de muestra."
      footer={
        <>
          ¿No tienes cuenta?{" "}
          <Link
            href="/register"
            className="font-medium text-cyan transition-colors hover:text-ink"
          >
            Crear cuenta
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field id="email" label="Correo electrónico">
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@correo.com"
            className={inputClasses}
          />
        </Field>

        <Field id="password" label="Contraseña">
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className={inputClasses}
          />
        </Field>

        {error && (
          <p
            role="alert"
            className="rounded-md border border-short/30 bg-short/10 px-3 py-2 text-[13px] text-short"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className={buttonClasses("primary", "md", "mt-1 w-full")}
        >
          {loading ? "Entrando…" : "Iniciar sesión"}
        </button>
      </form>
    </AuthShell>
  );
}
