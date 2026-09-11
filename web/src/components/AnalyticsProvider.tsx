"use client";

import Script from "next/script";

/**
 * Carga Plausible (privacy-first, sin cookies) solo cuando hay dominio
 * configurado. Sin `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` no se carga ningún
 * script de terceros — cero impacto en localhost.
 */
export function AnalyticsProvider() {
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN?.trim();
  if (!domain) return null;

  return (
    <Script
      id="plausible"
      strategy="afterInteractive"
      data-domain={domain}
      src="https://plausible.io/js/script.js"
    />
  );
}
