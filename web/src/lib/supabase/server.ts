import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente de Supabase para Server Components / Server Actions / Route Handlers.
 *
 * En Next.js 16 `cookies()` de `next/headers` es ASÍNCRONO, por eso la función
 * es async y hacemos `await cookies()` antes de crear el cliente.
 *
 * El bloque try/catch en `setAll` es necesario: cuando se escribe la cookie
 * desde un Server Component, Next lo impide; el middleware (si se añade) se
 * encarga de refrescar la sesión. Desde Server Actions/Route Handlers la
 * escritura sí está permitida.
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Faltan las variables NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Se llamó desde un Server Component; ignoramos. El refresh de
          // sesión lo gestiona el middleware si está presente.
        }
      },
    },
  });
}
