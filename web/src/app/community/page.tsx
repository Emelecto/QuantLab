import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";
import { MOCK_STRATEGIES } from "@/lib/mock";

export default function CommunityPage() {
  return (
    <>
      <section className="border-b border-line">
        <div className="mx-auto w-full max-w-6xl px-6 pt-16 pb-10">
          <h1 className="text-3xl font-semibold tracking-tight text-ink md:text-4xl">
            Comunidad
          </h1>
          <p className="mt-3 text-sm text-muted md:text-base">
            Estrategias compartidas por la comunidad
          </p>
        </div>
      </section>

      {/* BARRA DE FILTROS */}
      <div className="border-b border-line bg-surface/40">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-3 px-6 py-3">
          <select
            aria-label="Filtrar por activo"
            defaultValue="all"
            className="h-9 rounded-md border border-line bg-surface px-3 text-[13px] text-ink outline-none focus:border-[#2f3b4f]"
          >
            <option value="all">Activo ▾</option>
            <option value="BTC">BTC</option>
            <option value="ETH">ETH</option>
            <option value="SPY">SPY</option>
            <option value="AAPL">AAPL</option>
          </select>

          <select
            aria-label="Ordenar por"
            defaultValue="sharpe"
            className="h-9 rounded-md border border-line bg-surface px-3 text-[13px] text-ink outline-none focus:border-[#2f3b4f]"
          >
            <option value="sharpe">Orden ▾</option>
            <option value="recent">Más recientes</option>
            <option value="clones">Más clonadas</option>
          </select>

          <input
            type="search"
            placeholder="Buscar estrategia…"
            aria-label="Buscar estrategia"
            className="h-9 w-full max-w-xs rounded-md border border-line bg-surface px-3 text-[13px] text-ink placeholder:text-muted outline-none focus:border-[#2f3b4f]"
          />

          <span className="metric ml-auto text-[12px] text-muted">
            {MOCK_STRATEGIES.length} estrategias
          </span>
        </div>
      </div>

      {/* GRID DE ESTRATEGIAS (MOCK) */}
      <section>
        <div className="mx-auto w-full max-w-6xl px-6 py-10">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {MOCK_STRATEGIES.map((s) => (
              <article
                key={s.id}
                className="flex flex-col rounded-lg border border-line bg-surface transition-colors hover:border-[#2f3b4f]"
              >
                <div className="flex items-center gap-2.5 px-5 pt-5">
                  <span
                    aria-hidden
                    className="metric flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line bg-[#1a2131] text-[11px] text-muted"
                  >
                    {s.author.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="metric truncate text-[12px] text-muted">
                    @{s.author}
                  </span>
                </div>

                <div className="px-5 pt-3">
                  <h2 className="text-[15px] font-semibold text-ink">
                    {s.name}
                  </h2>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
                    {s.description}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 px-5 pt-4">
                  <Badge tone="neutral" mono>
                    {s.asset}
                  </Badge>
                  <Badge tone="long" mono>
                    Sharpe {s.sharpe.toFixed(1)}
                  </Badge>
                </div>

                <div className="mt-auto flex items-center gap-2 px-5 py-4">
                  <Link
                    href="/leaderboard"
                    className={buttonClasses("secondary", "sm")}
                  >
                    Ver
                  </Link>
                  <Link
                    href="/register"
                    className={buttonClasses("primary", "sm")}
                  >
                    Clonar
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
