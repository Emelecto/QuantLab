import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Callback de autenticación (PKCE / enlaces de email).
 *
 * Supabase redirige aquí con `?code=...` tras confirmar el correo o iniciar
 * sesión por enlace. Intercambiamos el code por una sesión (cookie HttpOnly)
 * y enviamos al usuario a /app. Si no hay code, dejamos pasar a /app y el
 * AuthGuard decide.
 *
 * También captura errores que Supabase pueda inyectar en el hash (#error=...)
 * y los pasa como query legible a /login para mostrarlos con claridad.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/app";

  // Errores que Supabase a veces anexa en el hash (p.ej. otp_expired).
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  if (error) {
    const params = new URLSearchParams({ error, error_description: errorDescription ?? "" });
    return NextResponse.redirect(`${origin}/login?${params.toString()}`);
  }

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) {
      const params = new URLSearchParams({
        error: exchangeError.name,
        error_description: exchangeError.message,
      });
      return NextResponse.redirect(`${origin}/login?${params.toString()}`);
    }
    return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
