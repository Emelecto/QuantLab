import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";

const FEATURES = [
  {
    title: "Crea en el navegador",
    text: "Escribe tu estrategia en un editor que ya viene configurado: sin Python local, sin entornos virtuales ni librerías que se rompen. Empiezas desde una plantilla y la ajustas hasta que refleje tu idea.",
  },
  {
    title: "Pruebas honestas (sin overfitting)",
    text: "Separamos los datos por ti: tú optimizas en un tramo y la evaluación final ocurre en un tramo que tu estrategia nunca vio. Si el resultado solo existía en el pasado ajustado, aquí se cae — y eso es exactamente lo que quieres saber antes de arriesgar dinero.",
  },
  {
    title: "Métricas claras",
    text: "Sharpe desinflado, máxima caída, win rate, número de operaciones y costos, todos explicados en lenguaje humano. Penalizamos el exceso de pruebas: cada combinación que intentas encarece la evidencia que necesitas.",
  },
  {
    title: "Comunidad y clonado",
    text: "Publica tu estrategia con su reporte out-of-sample completo o clona la de alguien más y modifícala en un clic. Aprender de un backtest verificado ajeno es más rápido que empezar de cero.",
  },
  {
    title: "Ranking justo",
    text: "El leaderboard solo ordena por desempeño fuera de muestra desinflado, nunca por la curva bonita del entrenamiento. No se puede escalar el ranking probando mil variantes hasta que una acierte por azar.",
  },
  {
    title: "Cripto y acciones",
    text: "BTC, ETH y equities con datos históricos, comisiones y slippage realistas. Un backtest sin costos es una fantasía, así que los incluimos desde el primer run.",
  },
];

export default function FeaturesPage() {
  return (
    <>
      <section className="border-b border-line">
        <div className="mx-auto w-full max-w-6xl px-6 pt-16 pb-12">
          <h1 className="text-3xl font-semibold tracking-tight text-ink md:text-4xl">
            Qué hace QuantLab
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted md:text-base">
            Una plataforma de investigación cuantitativa pensada para que la
            evidencia sea difícil de falsear: pruebas fuera de muestra, métricas
            desinfladas y todo el proceso a la vista.
          </p>
        </div>
      </section>

      <section className="border-b border-line">
        <div className="mx-auto w-full max-w-6xl px-6 py-12">
          <div className="grid gap-4 md:grid-cols-2">
            {FEATURES.map((f, i) => (
              <article
                key={f.title}
                className="rounded-lg border border-line bg-surface p-6 transition-colors hover:border-[#2f3b4f]"
              >
                <span className="metric text-[11px] tracking-widest text-muted">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h2 className="mt-3 text-base font-semibold text-ink">
                  {f.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {f.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-3 px-6 py-14">
          <Link href="/register" className={buttonClasses("primary", "lg")}>
            Crea tu estrategia
          </Link>
          <Link href="/leaderboard" className={buttonClasses("secondary", "lg")}>
            Ver el ranking OOS
          </Link>
        </div>
      </section>
    </>
  );
}
