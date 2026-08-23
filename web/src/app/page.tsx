import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";

const STEPS = [
  {
    n: "1",
    title: "Escribe tu idea",
    text: "En pocas líneas de código (o plantilla lista), sin instalar nada.",
  },
  {
    n: "2",
    title: "Pruébala de verdad",
    text: "La app la prueba en datos que nunca vio antes, para que sepas si funciona o fue suerte.",
  },
  {
    n: "3",
    title: "Comparte y aprende",
    text: "Clona estrategias de otros y mira qué funciona mejor en el ranking.",
  },
];

const FEATURES = [
  {
    title: "Crea en el navegador",
    text: "Editor listo para usar, sin entorno local ni dependencias que romper.",
  },
  {
    title: "Pruebas honestas (sin overfitting)",
    text: "Validación out-of-sample y Sharpe desinflado: los números que sobreviven.",
  },
  {
    title: "Métricas claras",
    text: "Retorno, drawdown, win rate y costos explicados en lenguaje humano.",
  },
  {
    title: "Comunidad y clonado",
    text: "Publica tu estrategia o clona la de otro y modifícala en un clic.",
  },
  {
    title: "Ranking justo",
    text: "Solo puntúa el desempeño fuera de muestra, no el ajuste al pasado.",
  },
  {
    title: "Cripto y acciones",
    text: "BTC, ETH y equities con datos históricos y comisiones realistas.",
  },
];

export default function Home() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-line">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 h-[28rem] w-[44rem] max-w-full -translate-x-1/2 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(closest-side, rgba(94,234,212,0.18), transparent)",
          }}
        />
        <div className="relative mx-auto w-full max-w-5xl px-6 py-24 md:py-28">
          <span className="metric mb-6 inline-flex items-center gap-2 rounded border border-line bg-surface px-2.5 py-1 text-[11px] text-muted">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
            FASE 1 · BACKTESTING OOS EN LA NUBE
          </span>
          <h1 className="max-w-3xl text-4xl leading-[1.1] font-semibold tracking-tight text-ink md:text-[56px]">
            Crea estrategias de trading que de verdad{" "}
            <span className="ql-gradient-text ql-glow-text">funcionan.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted md:text-lg">
            Prueba tus ideas en la nube y descubre si realmente ganarían o solo
            tuviste suerte. Sin instalar nada, sin saber estadística, y sin que
            el overfitting te engañe.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link href="/register" className={buttonClasses("primary", "lg")}>
              Crea tu estrategia
            </Link>
            <Link href="/community" className={buttonClasses("secondary", "lg")}>
              Explora la comunidad
            </Link>
          </div>
        </div>
      </section>

      {/* FRANJA DISCLAIMER */}
      <div className="border-b border-line bg-surface/60">
        <div className="mx-auto w-full max-w-6xl px-6 py-3">
          <p className="metric text-[11px] tracking-wide text-muted uppercase">
            Herramienta de investigación · No es asesoría financiera.
          </p>
        </div>
      </div>

      {/* CÓMO FUNCIONA */}
      <section className="border-b border-line">
        <div className="mx-auto w-full max-w-6xl px-6 py-16">
          <h2 className="text-2xl font-semibold tracking-tight text-ink">
            Cómo funciona
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {STEPS.map((s) => (
              <Card key={s.n} className="p-5">
                <span className="metric flex h-7 w-7 items-center justify-center rounded border border-accent/30 bg-accent/10 text-[13px] font-medium text-accent">
                  {s.n}
                </span>
                <h3 className="mt-4 text-[15px] font-semibold text-ink">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {s.text}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* BANDA DEEPFIN */}
      <section className="border-b border-line bg-surface/40">
        <div className="mx-auto w-full max-w-6xl px-6 py-10">
          <div className="flex flex-col gap-4 rounded-lg border border-long/25 bg-long/[0.06] p-5 md:flex-row md:items-center">
            <span className="metric shrink-0 self-start rounded border border-long/40 bg-long/15 px-2 py-1 text-[11px] font-medium tracking-wide text-long uppercase">
              Validado · DeepFin
            </span>
            <p className="text-sm leading-relaxed text-ink md:text-[15px]">
              Ya validamos una estrategia real en datos desconocidos: superó al
              mercado (BTC) con riesgo controlado y bajas comisiones.
            </p>
          </div>
        </div>
      </section>

      {/* GRID FEATURES */}
      <section className="border-b border-line">
        <div className="mx-auto w-full max-w-6xl px-6 py-16">
          <h2 className="text-2xl font-semibold tracking-tight text-ink">
            Todo lo que necesitas para investigar en serio
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="ql-perspective">
                <Card className="ql-tilt h-full">
                  <CardHeader>
                    <CardTitle>{f.title}</CardTitle>
                  </CardHeader>
                  <CardBody>{f.text}</CardBody>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section>
        <div className="mx-auto w-full max-w-6xl px-6 py-16">
          <h2 className="max-w-2xl text-2xl font-semibold tracking-tight text-ink md:text-3xl">
            Deja de adivinar si tu estrategia sirve.
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
            Crea tu cuenta, corre tu primer backtest out-of-sample y compara tu
            resultado con el de la comunidad.
          </p>
          <div className="mt-7">
            <Link href="/register" className={buttonClasses("primary", "lg")}>
              Empieza gratis
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
