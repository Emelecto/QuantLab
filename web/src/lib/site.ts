// URL canónica del sitio. NEXT_PUBLIC_SITE_URL en prod; falla explícito
// en producción si falta en vez de usar VERCEL_URL en silencio.
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (explicit) return explicit;
  // Durante `next build` (prerender estático) NODE_ENV ya es "production"
  // pero la env de runtime puede no estar presente; no romper la
  // recolección de páginas: el error explícito salta en runtime.
  const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";
  if (process.env.NODE_ENV === "production" && !isBuildPhase) {
    throw new Error(
      "NEXT_PUBLIC_SITE_URL no está definida en producción. " +
        "Configúrala al dominio canónico (p. ej. https://quantlab.app).",
    );
  }
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

export const SITE_NAME = "QuantLab";
export const SITE_LOCALE = "es_ES";
