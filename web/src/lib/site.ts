// URL canónica del sitio. NEXT_PUBLIC_SITE_URL en prod, fallback Vercel/localhost.
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (explicit) return explicit;
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

export const SITE_NAME = "QuantLab";
export const SITE_LOCALE = "es_ES";
