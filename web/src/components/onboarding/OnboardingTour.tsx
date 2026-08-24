"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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

type Rect = { top: number; left: number; width: number; height: number };

const STORAGE_KEY = "ql_onboarded";
export const TOUR_EVENT = "ql:start-tour";

export function OnboardingTour() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const rafRef = useRef<number | null>(null);

  /** Mide el elemento objetivo en coordenadas de viewport. */
  const measure = useCallback(() => {
    const sel = STEPS[step]?.selector;
    if (!open || !sel) {
      setRect(null);
      return;
    }
    const el = document.querySelector(sel);
    if (!el) {
      setRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    // Ignora elementos fuera del viewport (se medirá de nuevo tras el scroll).
    if (r.bottom < -40 || r.top > window.innerHeight + 40) {
      setRect(null);
      return;
    }
    setRect({
      top: Math.max(r.top - 8, 0),
      left: Math.max(r.left - 8, 0),
      width: Math.min(r.width + 16, window.innerWidth),
      height: r.height + 16,
    });
  }, [step, open]);

  // Al cambiar de paso: scroll suave al elemento y luego medir.
  useEffect(() => {
    if (!open) return;
    const sel = STEPS[step]?.selector;
    if (!sel) {
      setRect(null);
      return;
    }
    const el = document.querySelector(sel);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
      // Mide durante y después del scroll suave para seguir al elemento.
      const t1 = setTimeout(measure, 250);
      const t2 = setTimeout(measure, 500);
      const t3 = setTimeout(measure, 800);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
    setRect(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, open]);

  // Mientras está abierto, sigue al elemento ante scroll/resize (la "pantalla se mueve con el box").
  useEffect(() => {
    if (!open) return;
    const track = () => {
      if (rafRef.current != null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        measure();
      });
    };
    window.addEventListener("scroll", track, true);
    window.addEventListener("resize", track);
    return () => {
      window.removeEventListener("scroll", track, true);
      window.removeEventListener("resize", track);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [open, measure]);

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

  const next = () => (isLast ? finish() : setStep((s) => s + 1));
  const prev = () => setStep((s) => Math.max(0, s - 1));

  // Tooltip SIEMPRE dentro del viewport: lo posiciona respecto al rect pero clampeado.
  let tooltipStyle: React.CSSProperties;
  if (rect) {
    const estW = 320;
    const below = rect.top + rect.height + 12;
    const spaceBelow = window.innerHeight - below;
    let top: number;
    if (spaceBelow > 200) {
      top = below;
    } else {
      // Encima del target.
      top = Math.max(rect.top - 190, 12);
    }
    const left = Math.min(Math.max(rect.left, 12), window.innerWidth - estW - 12);
    tooltipStyle = { position: "fixed", top, left, maxWidth: estW };
  } else {
    tooltipStyle = {
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      maxWidth: 360,
      width: "90vw",
    };
  }

  return (
    <div role="dialog" aria-modal="true" aria-label="Tour de bienvenida">
      {/* Spotlight: recorte alrededor del target que lo SIGUE con scroll/resize. */}
      {rect ? (
        <div
          className="pointer-events-auto fixed z-[90] rounded-xl transition-[top,left,width,height] duration-100"
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            boxShadow: "0 0 0 9999px rgba(4,6,10,0.74)",
            outline: "2px solid rgba(94,234,212,0.5)",
            outlineOffset: "-2px",
          }}
          onClick={finish}
        />
      ) : (
        <div
          className="fixed inset-0 z-[90]"
          style={{ background: "rgba(4,6,10,0.74)" }}
          onClick={finish}
        />
      )}

      {/* Tooltip de vidrio */}
      <div
        style={{ ...tooltipStyle, zIndex: 100 }}
        className={`ql-glass ql-elev-2 rounded-xl border border-accent/25 bg-[#0d1017]/95 p-5 transition-all duration-150`}
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
              className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-bg transition-transform active:scale-[0.96] hover:bg-accent/90"
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
