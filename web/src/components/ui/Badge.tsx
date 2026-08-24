import { cn } from "@/lib/cn";

export type BadgeTone = "neutral" | "long" | "short" | "cyan";

const tones: Record<BadgeTone, string> = {
  neutral: "border-line bg-[#1a2131] text-muted",
  long: "border-long/30 bg-long/10 text-long",
  short: "border-short/30 bg-short/10 text-short",
  cyan: "border-cyan/30 bg-cyan/10 text-cyan",
};

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
  mono?: boolean;
};

export function Badge({
  tone = "neutral",
  mono = false,
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] font-medium tracking-wide ql-badge-qp",
        tones[tone],
        mono && "metric",
        className,
      )}
      {...props}
    />
  );
}
