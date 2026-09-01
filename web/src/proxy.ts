import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refresco de sesión en cada request (persistencia).
 *
 * NOTA Next 16: el convenio `middleware.ts` está DEPRECADO y se renombró a
 * `proxy.ts` (v16.0.0). La lógica es idéntica; solo cambia el nombre del
 * archivo y de la función exportada. Mantenerlo como `middleware.ts` compila,
 * pero emite un warning de deprecación en cada build.
 *
 * PROBLEMA QUE RESUELVE: sin este middleware la cookie de sesión de Supabase
 * nunca se renovaba en el servidor. Al expirar el access token (1 h por
 * defecto) el usuario "perdía" la sesión al volver a /app y el AuthGuard lo
 * mandaba a /login, aunque el refresh token siguiera siendo válido.
 *
 * `supabase.auth.getUser()` valida el token contra Supabase y, si hace falta,
 * lo rota usando el refresh token. Las cookies nuevas se escriben en la
 * respuesta mediante `setAll`, de modo que el navegador (y los Server
 * Components) siempre ven una sesión fresca.
 *
 * También protege la ruta /app/admin: solo usuarios con user_id en la lista
 * de admins pueden acceder. Los demás son redirigidos a /app.
 *
 * No redirige a propósito en /app: la protección de rutas la hace `AuthGuard`
 * en el cliente. Aquí solo mantenemos la cookie viva.
 */

// IDs de usuarios admin (puedes agregar más)
const ADMIN_USER_IDS = ["661b5d30-be6c-4b92-af69-ff084a65b461"];

export async function proxy(request: NextRequest) {
  // Respuesta que iremos reemplazando si Supabase decide setear cookies.
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Sin credenciales no hay nada que refrescar (p. ej. build o preview sin env).
  // Dejamos pasar el request en lugar de lanzar un 500.
  if (!url || !anonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // 1) Cookies visibles para el resto del pipeline de este request.
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        // 2) Recreamos la respuesta con el request ya actualizado…
        supabaseResponse = NextResponse.next({ request });

        // 3) …y devolvemos las cookies al navegador (Set-Cookie).
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  // IMPORTANTE: no quitar ni mover. Este await es el que dispara el refresh.
  const { data: { user } } = await supabase.auth.getUser();

  // Proteger ruta /app/admin: solo admins
  const { pathname } = request.nextUrl;
  if (pathname === "/app/admin" || pathname.startsWith("/app/admin/")) {
    if (!user || !ADMIN_USER_IDS.includes(user.id)) {
      return NextResponse.redirect(new URL("/app", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  /**
   * Corre en todo salvo estáticos, imágenes optimizadas y assets, para no
   * gastar invocaciones ni bloquear CSS/JS. Cubre /app/*, /login, /register
   * y /auth/*.
   */
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|css|js|woff|woff2|ttf)$).*)",
  ],
};
