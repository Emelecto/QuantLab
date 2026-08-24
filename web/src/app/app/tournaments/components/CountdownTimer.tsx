"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

interface CountdownTimerProps {
  deadline: string;
  className?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
}

function calcTimeLeft(deadline: string): TimeLeft {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  }
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    expired: false,
  };
}

export function CountdownTimer({ deadline, className }: CountdownTimerProps) {
  const [time, setTime] = useState<TimeLeft>(() => calcTimeLeft(deadline));
  const ref = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    ref.current = setInterval(() => {
      setTime(calcTimeLeft(deadline));
    }, 1000);
    return () => clearInterval(ref.current);
  }, [deadline]);

  const Cell = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <span className="metric text-lg font-semibold tabular-nums text-ink">
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-[10px] uppercase tracking-wider text-muted">
        {label}
      </span>
    </div>
  );

  if (time.expired) {
    return (
      <span className="metric text-short text-sm font-medium">Cerrado</span>
    );
  }

  return (
    <div className={cn("flex gap-3", className)}>
      <Cell value={time.days} label="días" />
      <span className="metric text-muted self-start mt-1">:</span>
      <Cell value={time.hours} label="hrs" />
      <span className="metric text-muted self-start mt-1">:</span>
      <Cell value={time.minutes} label="min" />
      <span className="metric text-muted self-start mt-1">:</span>
      <Cell value={time.seconds} label="seg" />
    </div>
  );
}