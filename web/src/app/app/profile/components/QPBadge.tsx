"use client";

const tierColors: Record<string, string> = {
  free: "from-slate-500 to-slate-600",
  bronze: "from-amber-700 to-amber-800",
  plus: "from-teal-400 to-teal-500",
  silver: "from-slate-300 to-slate-400",
  pro: "from-emerald-400 to-emerald-500",
  gold: "from-yellow-400 to-yellow-500",
  legend: "from-amber-400 to-amber-500",
  platinum: "from-cyan-300 to-cyan-400",
  diamond: "from-sky-300 to-sky-400",
};

const tierLabels: Record<string, string> = {
  free: "Free",
  bronze: "Bronze",
  plus: "Plus",
  silver: "Silver",
  pro: "Pro",
  gold: "Gold",
  legend: "Legend",
  platinum: "Platinum",
  diamond: "Diamond",
};

export function QPBadge({
  amount,
  size = "md",
}: {
  amount: number;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-sm px-2 py-1",
    lg: "text-lg px-3 py-1.5",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md font-medium bg-accent/15 text-accent ${sizeClasses[size]}`}
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
      {amount.toLocaleString()} QP
    </span>
  );
}

export function QPTierBadge({
  tier,
}: {
  tier: string;
}) {
  const gradient = tierColors[tier] || tierColors.free;
  const label = tierLabels[tier] || tier;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded bg-gradient-to-r ${gradient} px-2 py-0.5 text-[11px] font-semibold text-white uppercase tracking-wide`}
    >
      {label}
    </span>
  );
}
