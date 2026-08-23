"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { buttonClasses } from "@/components/ui/Button";
import { AuthShell, Field, inputClasses } from "@/components/ui/Form";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);

    try {
      const supabase = createBrowserSupabaseClient();
      const { data, error } = await supabase.auth.signUp({ email, password });

      if (error) {
        const msg = error.message.toLowerCase();
        if (error.code === "user_already_exists" || msg.includes("already registered")) {
          setError("El email ya está registrado");
        } else if (error.code === "weak_password" || msg.includes("password")) {
          setError("Contraseña muy corta (mín. 8)");
        } else {
          setError(error.message);
        }
        setLoading(false);
        return;
      }

      // Sesión presente => confirmación de email desactivada: entramos directo.
      if (data.session) {
        router.push("/app");
        router.refresh();
        return;
      }

      // Sin sesión => Supabase espera verificación por email.
      setInfo(
        "Te enviamos un enlace de confirmación a tu correo. Revísalo para activar tu cuenta.",
      );
      setLoading(false);
    } catch {
      setError("Ocurrió un error inesperado. Inténtalo de nuevo.");
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Crear cuenta"
      subtitle="Empieza a construir y validar tus estrategias fuera de muestra."
      footer={
        <>
          ¿Ya tienes cuenta?{" "}
          <Link
            href="/login"
            className="font-medium text-cyan transition-colors hover:text-ink"
          >
            Iniciar sesión
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
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 8 caracteres"
            className={inputClasses}
          />
        </Field>

        <Field id="confirmPassword" label="Confirmar contraseña">
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repite tu contraseña"
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

        {info && (
          <p
            role="status"
            className="rounded-md border border-long/30 bg-long/10 px-3 py-2 text-[13px] text-long"
          >
            {info}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className={buttonClasses("primary", "md", "mt-1 w-full")}
        >
          {loading ? "Creando cuenta…" : "Crear cuenta"}
        </button>

        <p className="text-[12px] leading-relaxed text-muted">
          Al crear una cuenta aceptas que QuantLab es una herramienta de
          investigación y no asesoría financiera.
        </p>
      </form>
    </AuthShell>
  );
}
