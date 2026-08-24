"use client";

import { useCallback, useEffect, useState } from "react";

type TourStep = {
  title: string;
  text: string;
  /** CSS selector del elemento a destacar. null = tooltip centrado sin target. */
  selector: string | null;
};

const STEPS: TourStep[] = [
  {
    title: "Bienvenido a QuantLab",
    text: "Este tour toma 30 segundos. Te mostramos los 3 lugares clave para empezar.",
    selector: null,
  },
  {
    title: "Crea tu primera estrategia",
    text: "Escribe o arma tu estrategia con datos reales y pruébala con rigor out-of-sample.",
    selector: '[data-tour="nueva-estrategia"]',
  },
  {
    title: "Compite en torneos",
    text: "Envía tu estrategia a torneos semanales, súbete en el ranking y gana QP.",
    selector: 'a[href="/app/tournaments"]',
  },
  {
    title: "Tu wallet de QuantPoints",
    text: "Aquí ves tu balance QP en vivo: gana en torneos, gástalos en el marketplace.",
    selector: '[data-tour="qp-badge"]',
  },
];

const STORAGE_KEY = "ql_onboarded";
export const TOUR_EVENT = "ql:start-tour";

/** Rect del target relativo al viewport, con padding. */
function getTargetRect(selector: string): { top: number; left: number; width: number; height: number } | null {
  const el = document.querySelector(selector);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { top: r.top - 6, left: r.left - 6, width: r.width + 12, height: r.height + 12 };
}

export function OnboardingTour() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  const finish = useCallback(() => {
    setOpen(false);
    setStep(0);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* noop */
    }
  }, []);

  // Auto-inicio en la primera visita.
  useEffect(() => {
    let onboarded = false;
    try {
      onboarded = localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      /* noop */
    }
    if (onboarded) return;
    const t = setTimeout(() => setOpen(true), 800);
    return () => clearTimeout(t);
  }, []);

  // Escucha manual start desde el checklist del dashboard.
  useEffect(() => {
    const onStart = () => {
      setStep(0);
      setOpen(true);
    };
    window.addEventListener(TOUR_EVENT, onStart);
    return () => window.removeEventListener(TOUR_EVENT, onStart);
  }, []);

  // Escape cierra.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, finish]);

  if (!open) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const rect = current.selector ? getTargetRect(current.selector) : null;

  const next = () => (isLast ? finish() : setStep((s) => s + 1));
  const prev = () => setStep((s) => Math.max(0, s - 1));

  // Posición del tooltip: debajo/derecha del target si cabe; si no, centrado.
  let tooltipStyle: React.CSSProperties;
  if (rect) {
    const below = rect.top + rect.height + 12;
    const spaceBelow = window.innerHeight - below;
    if (spaceBelow > 180) {
      tooltipStyle = { position: "fixed", top: below, left: Math.max(rect.left, 16), maxWidth: 320 };
    } else {
      tooltipStyle = { position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", maxWidth: 340 };
    }
  } else {
    tooltipStyle = {
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      maxWidth: 360,
    };
  }

  return (
    <div role="dialog" aria-modal="true" aria-label="Tour de bienvenida">
      {/* Overlay con recorte (box-shadow gigante alrededor del rect del target). */}
      <div
        className="fixed inset-0 z-[90] transition-all duration-200"
        style={{
          background: "rgba(4,6,10,0.72)",
          ...(rect
            ? {
                boxShadow: `0 0 0 9999px rgba(4,6,10,0.72)`,
                position: "fixed",
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height,
                borderRadius: 12,
                background: "transparent",
              }
            : {}),
        }}
        onClick={finish}
      />

      {/* Tooltip de vidrio */}
      <div
        style={{ ...tooltipStyle, zIndex: 100 }}
        className={`ql-glass ql-elev-2 rounded-xl border border-accent/25 bg-[#0d1017]/95 p-5 ${rect ? "" : "w-[90vw]"}`}
      >
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-ink">{current.title}</h3>
          <span className="font-mono text-xs text-muted">
            {step + 1}/{STEPS.length}
          </span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted">{current.text}</p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            onClick={finish}
            className="text-xs font-medium text-muted transition-colors hover:text-ink"
          >
            Saltar
          </button>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                onClick={prev}
                className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:text-ink"
              >
                Anterior
              </button>
            )}
            <button
              onClick={next}
              className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-bg transition-transform active:scale-95 hover:bg-accent/90"
            >
              {isLast ? "Listo" : "Siguiente"}
            </button>
          </div>
        </div>
        {/* Puntos de progreso */}
        <div className="mt-3 flex justify-center gap-1.5">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-1 rounded-full transition-all ${i === step ? "w-4 bg-accent" : "w-1.5 bg-white/20"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
