/**
 * Badge de tier (suscripción) del usuario: Free / Plus / Pro / Legend.
 * Paleta dark quant v2: usa tokens text-long/text-short/text-accent/border-line.
 */

const tierStyles: Record<string, string> = {
  free: "border border-line text-muted",
  plus: "border border-accent/30 text-accent",
  pro: "border border-accent/30 bg-accent/10 text-accent",
  legend: "border border-short/30 bg-short/10 text-short",
};

export function TierBadge({
  tier,
  className = "",
}: {
  tier?: string | null;
  className?: string;
}) {
  if (!tier) return null;
  const key = tier.toLowerCase();
  const style = tierStyles[key] ?? tierStyles.free;
  const label = key.charAt(0).toUpperCase() + key.slice(1);
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${style} ${className}`}
    >
      {label}
    </span>
  );
}
