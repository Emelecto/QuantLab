export const metadata = {
  title: "Legales — QuantLab",
};

export default function LegalPage() {
  return (
    <section className="mx-auto w-full max-w-3xl px-6 pt-16 pb-20">
      <h1 className="text-3xl font-semibold tracking-tight text-ink">
        Legales
      </h1>
      <div className="mt-6 flex flex-col gap-4 text-sm leading-relaxed text-muted">
        <p>
          QuantLab es una plataforma de investigación cuantitativa. El uso del
          servicio implica la aceptación de estos términos.
        </p>
        <p>
          Los resultados de backtest son simulaciones históricas. El desempeño
          pasado, incluso validado fuera de muestra, no garantiza resultados
          futuros.
        </p>
        <p>
          Cada usuario es responsable del código que publica y de las decisiones
          que toma a partir de los reportes generados.
        </p>
        <p className="metric text-[12px]">
          Documento preliminar · se completará antes del lanzamiento público.
        </p>
      </div>
    </section>
  );
}
