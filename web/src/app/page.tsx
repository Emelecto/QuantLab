import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { AuthAwareCTA } from "@/components/AuthAwareCTA";
import { HeroChart } from "@/components/charts/HeroChart";
import { SpotlightCard } from "@/components/SpotlightCard";
import { OverfitMiniChart, OosMiniChart } from "@/components/charts/MiniCharts";

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
    <div className="flex flex-col">
      {/* HERO (A1: demo en vivo) — sin kicker, sin gradient text (craft-floor) */}
      <section className="relative overflow-hidden border-b border-line">
        {/* Aurora animada: blobs blancos/grises sutiles que derivan */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div
            className="ql-aurora-blob ql-aurora-1 left-[8%] top-[-30%] h-[26rem] w-[36rem]"
            style={{ background: "rgba(248,250,252,0.06)" }}
          />
          <div
            className="ql-aurora-blob ql-aurora-2 right-[4%] top-[-20%] h-[22rem] w-[30rem]"
            style={{ background: "rgba(203,213,225,0.05)" }}
          />
          <div
            className="ql-aurora-blob ql-aurora-3 left-[38%] top-[10%] h-[18rem] w-[26rem]"
            style={{ background: "rgba(148,163,184,0.04)" }}
          />
        </div>
        <div className="relative mx-auto w-full max-w-6xl px-6 py-20 md:py-28">
          <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <h1 className="max-w-3xl text-4xl leading-[1.08] font-semibold tracking-tight text-ink md:text-[56px]">
                Comunidad de trading{" "}
                <span className="text-accent">cuantitativo.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted md:text-lg">
                Pon a prueba tus ideas de trading contra las de toda la comunidad.
                Backtests con datos reales, torneos semanales y un ranking donde gana
                quien mejor estrategias construye.
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

      {/* A2: POR QUÉ NO SOBREAJUSTES */}
      <section className="border-b border-line">
        <div className="mx-auto w-full max-w-6xl px-6 py-16">
          <h2 className="max-w-3xl text-2xl font-semibold tracking-tight text-ink md:text-3xl">
            Por qué no overfitting
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted md:text-base">
            Sobreajustar es aprender de memoria el pasado. Si tu estrategia solo gana
            con los datos con los que calibraste, no es edge: es recuerdo. El
            walk-forward OOS mide sobre datos nuevos y esa curva no se puede maquillar.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <Card className="p-5">
              <h3 className="text-[15px] font-semibold text-short">
                Curva overfitted (en muestra)
              </h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
                Sube sin parar en el histórico&hellip; y luego se desploma. Bonito en
                el reporte, desastroso en la vida real.
              </p>
              <div className="mt-4 overflow-hidden rounded-lg border border-line">
                <OverfitMiniChart />
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="text-[15px] font-semibold text-long">
                Validación walk-forward (out-of-sample)
              </h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
                Más modesta, pero honesta: es lo que ocurre cuando la estrategia
                enfrenta datos nuevos. Lo que sobrevive, cuenta.
              </p>
              <div className="mt-4 overflow-hidden rounded-lg border border-line">
                <OosMiniChart />
              </div>
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
          <h2 className="max-w-3xl text-2xl font-semibold tracking-tight text-ink md:text-3xl">
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

      {/* GRID FEATURES — lista editorial con separadores (anti-cards-uniformes) */}
      <section className="border-b border-line">
        <div className="mx-auto w-full max-w-6xl px-6 py-16">
          <h2 className="max-w-2xl text-2xl font-semibold tracking-tight text-ink md:text-3xl">
            Todo lo que necesitas para investigar en serio
          </h2>
          <ul className="mt-10 grid gap-x-12 gap-y-8 md:grid-cols-2">
            {FEATURES.map((f) => (
              <SpotlightCard key={f.title} className="border-t border-line pt-5">
                <h3 className="text-[15px] font-semibold text-ink">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{f.text}</p>
              </SpotlightCard>
            ))}
          </ul>
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
          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2">
            <AuthAwareCTA
              loggedOutLabel="Empieza gratis"
              loggedOutHref="/register"
              loggedInLabel="Ir al dashboard"
              loggedInHref="/app"
              size="lg"
            />
            <Link
              href={`/app/strategies/new?demo=1`}
              className="text-sm text-muted underline-offset-4 transition-colors hover:text-accent hover:underline"
            >
              Pruébala en 60 segundos — sin escribir código →
            </Link>
          </div>
        </div>
      </section>

      {/* Nota legal mínima al pie */}
      <div className="border-t border-line">
        <div className="mx-auto w-full max-w-6xl px-6 py-4">
          <p className="text-[12px] text-muted">No es asesoría financiera.</p>
        </div>
      </div>
    </div>
  );
}
