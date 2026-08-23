import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente de Supabase para el navegador (Client Components).
 *
 * Se construye BAJO DEMANDA (dentro de handlers o useEffect), nunca a nivel de
 * módulo, para que `next build` no crashee cuando las variables de entorno
 * NEXT_PUBLIC_* aún no existan. En runtime el navegador siempre las tiene.
 */
export function createBrowserSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Faltan las variables NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
        "Copia .env.local.example a .env.local y completa los valores.",
    );
  }

  return createBrowserClient(url, anonKey);
}
