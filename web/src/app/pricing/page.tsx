import { AuthAwareCTA } from "@/components/AuthAwareCTA";
import { cn } from "@/lib/cn";

type Tier = {
  name: string;
  price: string;
  period?: string;
  tagline: string;
  featured?: boolean;
  cta: string;
  features: { label: string; included: boolean }[];
};

const TIERS: Tier[] = [
  {
    name: "Gratis",
    price: "$0",
    period: "/mes",
    tagline: "Para probar tu primera idea y entender si tiene algo real.",
    cta: "Empieza gratis",
    features: [
      { label: "3 estrategias privadas", included: true },
      { label: "10 backtests OOS por mes", included: true },
      { label: "Datos diarios de cripto y acciones", included: true },
      { label: "Publicar en la comunidad", included: true },
      { label: "Datos intradía (1h / 4h)", included: false },
      { label: "Walk-forward multi-ventana", included: false },
      { label: "Ejecución prioritaria en la cola", included: false },
      { label: "Espacios de equipo", included: false },
    ],
  },
  {
    name: "Pro",
    price: "$19",
    period: "/mes",
    tagline: "Para investigar en serio, con datos finos y validación completa.",
    featured: true,
    cta: "Elegir Pro",
    features: [
      { label: "Estrategias ilimitadas", included: true },
      { label: "500 backtests OOS por mes", included: true },
      { label: "Datos diarios de cripto y acciones", included: true },
      { label: "Publicar en la comunidad", included: true },
      { label: "Datos intradía (1h / 4h)", included: true },
      { label: "Walk-forward multi-ventana", included: true },
      { label: "Ejecución prioritaria en la cola", included: true },
      { label: "Espacios de equipo", included: false },
    ],
  },
  {
    name: "Equipo",
    price: "$79",
    period: "/mes",
    tagline: "Para varios investigadores compartiendo datos y resultados.",
    cta: "Hablar con nosotros",
    features: [
      { label: "Estrategias ilimitadas", included: true },
      { label: "Backtests OOS ilimitados", included: true },
      { label: "Datos diarios de cripto y acciones", included: true },
      { label: "Publicar en la comunidad", included: true },
      { label: "Datos intradía (1h / 4h)", included: true },
      { label: "Walk-forward multi-ventana", included: true },
      { label: "Ejecución prioritaria en la cola", included: true },
      { label: "Espacios de equipo (hasta 10)", included: true },
    ],
  },
];

export default function PricingPage() {
  return (
    <>
      <section className="border-b border-line">
        <div className="mx-auto w-full max-w-6xl px-6 pt-16 pb-12">
          <h1 className="text-3xl font-semibold tracking-tight text-ink md:text-4xl">
            Precios
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted md:text-base">
            Empieza gratis y sube de plan solo cuando necesites más datos, más
            corridas o trabajar en equipo.
          </p>
        </div>
      </section>

      <section className="border-b border-line">
        <div className="mx-auto w-full max-w-6xl px-6 py-12">
          <div className="grid gap-4 lg:grid-cols-3">
            {TIERS.map((tier) => (
              <div
                key={tier.name}
                className={cn(
                  "flex flex-col ql-glass p-6",
                  tier.featured && "ql-tier-featured",
                )}
              >
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-ink">
                    {tier.name}
                  </h2>
                  {tier.featured && (
                    <span className="metric rounded border border-accent/40 bg-accent/10 px-1.5 py-0.5 text-[10px] tracking-wide text-accent uppercase">
                      Recomendado
                    </span>
                  )}
                </div>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="metric text-3xl font-semibold text-ink">
                    {tier.price}
                  </span>
                  {tier.period && (
                    <span className="metric text-[13px] text-muted">
                      {tier.period}
                    </span>
                  )}
                </div>

                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {tier.tagline}
                </p>

                <ul className="mt-6 flex flex-1 flex-col gap-2.5 border-t border-line pt-5">
                  {tier.features.map((f) => (
                    <li
                      key={f.label}
                      className="flex items-start gap-2.5 text-[13px]"
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "metric mt-px w-3 shrink-0 text-center",
                          f.included ? "text-long" : "text-muted",
                        )}
                      >
                        {f.included ? "✓" : "—"}
                      </span>
                      <span
                        className={f.included ? "text-ink" : "text-muted"}
                      >
                        {f.label}
                      </span>
                    </li>
                  ))}
                </ul>

                <AuthAwareCTA
                  loggedOutLabel={tier.cta}
                  loggedOutHref="/register"
                  loggedInLabel={tier.name === "Gratis" ? "Ir al dashboard" : `Ir a ${tier.name}`}
                  loggedInHref="/app"
                  size="md"
                  className="mt-6 w-full"
                />
              </div>
            ))}
          </div>

          <p className="metric mt-8 text-[12px] text-muted">
            Los precios se activan en Fase 3 (monetización).
          </p>
        </div>
      </section>
    </>
  );
}
