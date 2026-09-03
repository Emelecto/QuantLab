"use client";

/**
 * Avatar: foto de perfil circular con fallback a iniciales sobre un fondo
 * degradado (estilo Instagram/TikTok). Reutilizado en el sidebar y el perfil.
 */
function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({
  src,
  name,
  size = 40,
  className = "",
}: {
  src?: string | null;
  name: string | null | undefined;
  size?: number;
  className?: string;
}) {
  const initials = getInitials(name);

  if (src) {
    return (
      <span
        className={`inline-block overflow-hidden rounded-full bg-surface flex-shrink-0 ${className}`}
        style={{ width: size, height: size }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={name || "Avatar"}
          width={size}
          height={size}
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full select-none flex-shrink-0 ${
        size >= 48 ? "font-semibold" : "font-semibold"
      }`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        background: "linear-gradient(135deg, #5eead4 0%, #38bdf8 100%)",
        color: "rgba(10,12,16,0.9)",
      }}
      aria-label={name || "Avatar"}
    >
      {initials}
    </span>
  );
}