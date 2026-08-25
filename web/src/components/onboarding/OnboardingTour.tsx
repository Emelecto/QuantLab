"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type TourStep = {
  title: string;
  text: string;
  /**
   * Selector(es) del elemento a destacar, separados por coma = alternativas.
   * null = tooltip centrado sin target (bienvenida).
   */
  selector: string | null;
  /** Botón extra opcional dentro del tooltip que navega a href. */
  cta?: { label: string; href: string };
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
    // El badge completo está display:none en móvil; el link compacto lo cubre.
    selector: '[data-tour="qp-badge"], a[href="/app/wallet"]',
  },
  {
    title: "Envía tu primer modelo",
    text: "Cuando tu estrategia esté lista, envíala al round activo del torneo para recibir tu primer score oficial.",
    selector: null,
    cta: { label: "Crear mi primer modelo →", href: "/app/strategies/new" },
  },
];

type Rect = { top: number; left: number; width: number; height: number };

const STORAGE_KEY = "ql_onboarded";
export const TOUR_EVENT = "ql:start-tour";

/** Devuelve el primer elemento visible para los selectores dados. */
function findVisibleTarget(selector: string): HTMLElement | null {
  for (const sel of selector.split(",")) {
    const el = document.querySelector(sel.trim());
    if (!el) continue;
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return el as HTMLElement;
  }
  return null;
}

/** Espera a que el rect se estabilice tras un scroll suave (máx 1s). */
function waitStableRect(el: HTMLElement, timeoutMs = 1000): Promise<void> {
  return new Promise((resolve) => {
    let last = JSON.stringify(el.getBoundingClientRect());
    const start = performance.now();
    const tick = () => {
      const cur = JSON.stringify(el.getBoundingClientRect());
      if (cur === last) {
        resolve();
        return;
      }
      last = cur;
      if (performance.now() - start > timeoutMs) {
        resolve();
        return;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

export function OnboardingTour() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const rafRef = useRef<number | null>(null);

  const measure = useCallback(() => {
    const sel = STEPS[step]?.selector;
    if (!open || !sel) {
      setRect(null);
      return;
    }
    const el = findVisibleTarget(sel);
    if (!el) {
      setRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setRect({
      top: Math.round(r.top),
      left: Math.round(r.left),
      width: Math.round(r.width),
      height: Math.round(r.height),
    });
  }, [step, open]);

  // Al cambiar de paso: scroll al elemento (forzado), espera y mide.
  useEffect(() => {
    if (!open) return;
    const sel = STEPS[step]?.selector;
    if (!sel) {
      setRect(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const el = findVisibleTarget(sel);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
        await waitStableRect(el);
        if (!cancelled) measure();
      } else {
        setRect(null);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, open]);

  // Sigue al elemento en scroll/resize y re-mide ante cualquier cambio de layout.
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
    // El dashboard carga datos asíncronos que mueven el layout después de la
    // medición inicial: ResizeObserver re-mide en vivo mientras el tour esté abierto.
    const ro = new ResizeObserver(track);
    ro.observe(document.body);
    return () => {
      window.removeEventListener("scroll", track, true);
      window.removeEventListener("resize", track);
      ro.disconnect();
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

  // Auto-inicio en la primera visita, solo cuando el layout haya asentado:
  // window "load" + document.fonts.ready + 600 ms extra.
  useEffect(() => {
    let onboarded = false;
    try {
      onboarded = localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      /* noop */
    }
    if (onboarded) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const startCountdown = () => {
      document.fonts.ready
        .catch(() => undefined)
        .then(() => {
          timer = setTimeout(() => {
            if (!cancelled) setOpen(true);
          }, 600);
        });
    };

    if (document.readyState === "complete") {
      startCountdown();
    } else {
      window.addEventListener("load", startCountdown, { once: true });
    }

    return () => {
      cancelled = true;
      if (timer != null) clearTimeout(timer);
      window.removeEventListener("load", startCountdown);
    };
  }, []);

  useEffect(() => {
    const onStart = () => {
      setStep(0);
      setOpen(true);
    };
    window.addEventListener(TOUR_EVENT, onStart);
    return () => window.removeEventListener(TOUR_EVENT, onStart);
  }, []);

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
  const cta = current.cta;

  const next = () => (isLast ? finish() : setStep((s) => s + 1));
  const prev = () => setStep((s) => Math.max(0, s - 1));

  // Posicionamiento del tooltip: al lado con más espacio. Nunca tapa al target.
  let tooltipStyle: React.CSSProperties;
  let arrow: "top" | "bottom" | "left" | "right" | null = null;
  if (rect) {
    const TW = 320;
    const TH = 200;
    const GAP = 14;
    const M = 16;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const spaceRight = vw - (rect.left + rect.width);
    const spaceLeft = rect.left;
    const spaceBelow = vh - (rect.top + rect.height);
    const spaceAbove = rect.top;

    let top = 0;
    let left = 0;

    if (spaceRight >= TW + GAP * 2 && spaceRight >= spaceLeft) {
      left = Math.min(rect.left + rect.width + GAP, vw - TW - M);
      top = Math.min(Math.max(rect.top, M), Math.max(vh - TH - M, M));
      arrow = "left";
    } else if (spaceLeft >= TW + GAP * 2) {
      left = Math.max(rect.left - TW - GAP, M);
      top = Math.min(Math.max(rect.top, M), Math.max(vh - TH - M, M));
      arrow = "right";
    } else if (spaceBelow >= TH + GAP * 2 || spaceBelow >= spaceAbove) {
      left = Math.min(Math.max(rect.left + rect.width / 2 - TW / 2, M), vw - TW - M);
      top = Math.min(rect.top + rect.height + GAP, Math.max(vh - TH - M, M));
      arrow = "top";
    } else {
      left = Math.min(Math.max(rect.left + rect.width / 2 - TW / 2, M), vw - TW - M);
      top = Math.max(rect.top - TH - GAP, M);
      arrow = "bottom";
    }

    tooltipStyle = { position: "fixed", top, left, maxWidth: TW, width: TW };
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
      {/* Única animación permitida: opacidad al aparecer cada paso. La posición
          del spotlight NO se interpola, así sigue al elemento sin lag. */}
      <style>{`@keyframes ql-tour-fade { from { opacity: 0 } to { opacity: 1 } }`}</style>
      {/* Spotlight sobre el elemento objetivo (recorte + halo). */}
      {rect ? (
        <div
          key={step}
          className="pointer-events-auto fixed z-[90] rounded-xl"
          style={{
            animation: "ql-tour-fade 160ms ease-out",
            top: rect.top - 6,
            left: rect.left - 6,
            width: rect.width + 12,
            height: rect.height + 12,
            boxShadow: "0 0 0 9999px rgba(4,6,10,0.78)",
            outline: "2px solid rgba(248,250,252,0.6)",
            outlineOffset: "-1px",
          }}
          onClick={finish}
        />
      ) : (
        <div
          className="fixed inset-0 z-[90]"
          style={{ background: "rgba(4,6,10,0.78)" }}
          onClick={finish}
        />
      )}

      {/* Tooltip de vidrio con flecha apuntando al target. */}
      <div
        style={{ ...tooltipStyle, zIndex: 100 }}
        className="ql-glass ql-elev-2 rounded-xl border border-accent/25 bg-[#0d1017]/95 p-5"
      >
        {arrow === "left" && (
          <span className="absolute -left-2 top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 rounded-sm border-l border-b border-accent/25 bg-[#0d1017]" />
        )}
        {arrow === "right" && (
          <span className="absolute -right-2 top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 rounded-sm border-r border-t border-accent/25 bg-[#0d1017]" />
        )}
        {arrow === "top" && (
          <span className="absolute -top-2 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 rounded-sm border-l border-t border-accent/25 bg-[#0d1017]" />
        )}
        {arrow === "bottom" && (
          <span className="absolute -bottom-2 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 rounded-sm border-r border-b border-accent/25 bg-[#0d1017]" />
        )}

        <div className="flex items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-ink">{current.title}</h3>
          <span className="font-mono text-xs text-muted">
            {step + 1}/{STEPS.length}
          </span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted">{current.text}</p>
        {cta && (
          <button
            onClick={() => {
              // Navegar abandona el dashboard: marcar el tour como visto.
              finish();
              router.push(cta.href);
            }}
            className="mt-3 w-full rounded-md border border-accent/40 bg-accent/10 px-3 py-2 text-xs font-semibold text-accent transition-colors hover:bg-accent/20"
          >
            {cta.label}
          </button>
        )}
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
