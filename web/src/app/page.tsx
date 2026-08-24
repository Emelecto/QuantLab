import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { AuthAwareCTA } from "@/components/AuthAwareCTA";
import { HeroChart } from "@/components/charts/HeroChart";

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

/** Curva que se ve increíble en muestra y luego se desploma (sobreajuste). */
const OVERFIT_PATH =
  "M0,104 C40,96 62,74 92,52 C122,30 152,16 186,13 C222,11 244,52 272,92 C284,108 292,110 300,112";
/** Curva modesta y sostenida (validación walk-forward OOS). */
const OOS_PATH =
  "M0,104 C56,98 112,88 168,78 C222,69 266,63 300,58";

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* El header global (TopBar) lo aporta el layout. No duplicar aquí. */}

      {/* HERO (A1: demo en vivo) */}
      <section className="relative overflow-hidden border-b border-line">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 h-[28rem] w-[44rem] max-w-full -translate-x-1/2 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(closest-side, rgba(94,234,212,0.18), transparent)",
          }}
        />
        <div className="relative mx-auto w-full max-w-6xl px-6 py-20 md:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
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
                <Link
                  href="/community"
                  className={buttonClasses("secondary", "lg")}
                >
                  Explora la comunidad
                </Link>
              </div>
            </div>

            {/* Demo en vivo: equity curve animada estilo TradingView con métricas flotantes */}
            <HeroChart />
          </div>
        </div>
      </section>

      {/* BARRA DE CONFIANZA */}
      <div className="border-b border-line bg-surface/60">
        <div className="mx-auto w-full max-w-6xl overflow-x-auto px-6 py-3">
          <div className="flex min-w-max items-center gap-6 font-mono text-[11px] tracking-wide text-muted">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-1 w-1 rounded-full bg-accent" />
              Datos reales Binance
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-1 w-1 rounded-full bg-accent" />
              Yahoo Finance
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-1 w-1 rounded-full bg-accent" />
              Split OOS anti-overfitting
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-1 w-1 rounded-full bg-accent" />
              Sin simulación
            </span>
          </div>
        </div>
      </div>

      {/* FRANJA DISCLAIMER */}
      <div className="border-b border-line bg-surface/60">
        <div className="mx-auto w-full max-w-6xl px-6 py-3">
          <p className="metric text-[11px] tracking-wide text-muted uppercase">
            Herramienta de investigación · No es asesoría financiera.
          </p>
        </div>
      </div>

      {/* A2: POR QUÉ NO SOBREAJUSTES */}
      <section className="border-b border-line">
        <div className="mx-auto w-full max-w-6xl px-6 py-16">
          <span className="metric inline-flex items-center gap-2 rounded border border-line bg-surface px-2.5 py-1 text-[11px] text-muted">
            SIN OVERFITTING
          </span>
          <h2 className="mt-4 max-w-3xl text-2xl font-semibold tracking-tight text-ink md:text-3xl">
            Por qué no sobreajustes
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted md:text-base">
            Es fácil hacer que una estrategia se vea perfecta en el pasado: le das
            tantas vueltas a los parámetros que &ldquo;aprende de memoria&rdquo; el
            historial. Eso es sobreajuste (overfitting), y casi siempre falla en el
            futuro. Nosotros validamos con{" "}
            <span className="text-ink">walk-forward out-of-sample</span>: entrenamos
            en una parte de los datos y medimos de verdad en la parte que la
            estrategia nunca vio.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <Card className="p-5">
              <h3 className="text-[15px] font-semibold text-short">
                Curva sobreajustada (en muestra)
              </h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
                Sube sin parar en el histórico&hellip; y luego se desploma. Bonito en
                el reporte, desastroso en la vida real.
              </p>
              <svg
                viewBox="0 0 300 120"
                className="mt-4 h-28 w-full"
                preserveAspectRatio="none"
                role="img"
                aria-label="Curva sobreajustada que cae"
              >
                <path
                  d={OVERFIT_PATH}
                  fill="none"
                  stroke="var(--ql-short)"
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              </svg>
            </Card>

            <Card className="p-5">
              <h3 className="text-[15px] font-semibold text-long">
                Validación walk-forward (out-of-sample)
              </h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
                Más modesta, pero honesta: es lo que ocurre cuando la estrategia
                enfrenta datos nuevos. Lo que sobrevive, cuenta.
              </p>
              <svg
                viewBox="0 0 300 120"
                className="mt-4 h-28 w-full"
                preserveAspectRatio="none"
                role="img"
                aria-label="Curva de validación out-of-sample sostenida"
              >
                <path
                  d={OOS_PATH}
                  fill="none"
                  stroke="var(--ql-long)"
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              </svg>
            </Card>
          </div>

          <p className="metric mt-6 text-[12px] text-muted">
            Por eso el ranking solo puntúa el Sharpe desinflado OOS, no el ajuste al
            pasado.
          </p>
        </div>
      </section>

      {/* A3: VALIDACIÓN Y CONFIANZA */}
      <section className="border-b border-line bg-surface/40">
        <div className="mx-auto w-full max-w-6xl px-6 py-16">
          <span className="metric inline-flex items-center gap-2 rounded border border-line bg-surface px-2.5 py-1 text-[11px] text-muted">
            DATOS REALES
          </span>
          <h2 className="mt-4 max-w-3xl text-2xl font-semibold tracking-tight text-ink md:text-3xl">
            Datos reales, sin simulación
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted md:text-base">
            No inventamos precios ni rellenamos con ruido bonito. Los backtests
            corren sobre datos reales de mercado y la integridad fuera de muestra se
            verifica en cada corrida.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="ql-glass ql-elev-1 rounded-xl p-5">
              <div className="metric text-sm font-semibold text-ink">
                Binance
              </div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
                Cripto (BTC, ETH&hellip;) con cierres reales vía la API pública de
                Binance. Sin API key, sin simulación.
              </p>
            </div>
            <div className="ql-glass ql-elev-1 rounded-xl p-5">
              <div className="metric text-sm font-semibold text-ink">
                Yahoo Finance
              </div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
                Acciones y ETFs con series históricas reales de Yahoo Finance.
                Comisiones realistas incluidas.
              </p>
            </div>
            <div className="ql-glass ql-elev-1 rounded-xl p-5">
              <div className="metric text-sm font-semibold text-ink">
                Integridad OOS verificada
              </div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
                Cada corrida usa walk-forward: entrena y prueba en pliegues distintos
                para que el resultado sea creíble.
              </p>
            </div>
          </div>

          <figure className="ql-glass ql-elev-1 mt-6 flex flex-col gap-3 rounded-xl p-5 md:flex-row md:items-center">
            <span className="metric shrink-0 self-start rounded border border-accent/40 bg-accent/10 px-2 py-1 text-[11px] font-medium tracking-wide text-accent uppercase">
              Quién lo usa
            </span>
            <blockquote className="text-sm leading-relaxed text-ink">
              &ldquo;Por fin un lugar donde puedo clonar estrategias de otros y ver de
              inmediato si el número aguanta fuera de muestra, no solo en el
              gráfico bonito.&rdquo;
              <figcaption className="metric mt-2 text-[12px] text-muted">
                — Emilio, estudiante de data science
              </figcaption>
            </blockquote>
          </figure>
        </div>
      </section>

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
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.text}</p>
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
            <AuthAwareCTA
              loggedOutLabel="Empieza gratis"
              loggedOutHref="/register"
              loggedInLabel="Ir al dashboard"
              loggedInHref="/app"
              size="lg"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
