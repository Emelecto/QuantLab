import Link from "next/link";
import { MOCK_LEADERBOARD } from "@/lib/mock";

export default function LeaderboardPage() {
  return (
    <>
      <section className="border-b border-line">
        <div className="mx-auto w-full max-w-6xl px-6 pt-16 pb-10">
          <h1 className="text-3xl font-semibold tracking-tight text-ink md:text-4xl">
            Ranking OOS
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted md:text-base">
            Rankeado por Sharpe desinflado out-of-sample — la métrica que no
            premia el overfitting.
          </p>
        </div>
      </section>

      <section>
        <div className="mx-auto w-full max-w-6xl px-6 py-10">
          <div className="ql-glass overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-left">
              <thead>
                <tr className="border-b border-line">
                  <th className="metric px-4 py-3 text-[11px] font-medium tracking-wider text-muted uppercase">
                    #
                  </th>
                  <th className="px-4 py-3 text-[11px] font-medium tracking-wider text-muted uppercase">
                    Estrategia
                  </th>
                  <th className="px-4 py-3 text-[11px] font-medium tracking-wider text-muted uppercase">
                    Autor
                  </th>
                  <th className="px-4 py-3 text-[11px] font-medium tracking-wider text-muted uppercase">
                    Activo
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-medium tracking-wider text-muted uppercase">
                    Deflated Sharpe OOS
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-medium tracking-wider text-muted uppercase">
                    MaxDD
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-medium tracking-wider text-muted uppercase">
                    Win%
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-medium tracking-wider text-muted uppercase">
                    <span className="sr-only">Abrir</span>↗
                  </th>
                </tr>
              </thead>
              <tbody>
                {MOCK_LEADERBOARD.map((row) => (
                  <tr
                    key={row.rank}
                    className="ql-row border-b border-line last:border-0 transition-colors"
                  >
                    <td className="metric px-4 py-3 text-[13px] text-muted">
                      {row.rank}
                    </td>
                    <td className="px-4 py-3 text-[13px] font-medium text-ink">
                      {row.name}
                    </td>
                    <td className="metric px-4 py-3 text-[13px] text-muted">
                      @{row.author}
                    </td>
                    <td className="px-4 py-3">
                      <span className="metric rounded border border-line bg-[#1a2131] px-1.5 py-0.5 text-[11px] text-muted">
                        {row.asset}
                      </span>
                    </td>
                    <td className="metric px-4 py-3 text-right text-[13px] font-medium text-long">
                      {row.deflatedSharpeOos.toFixed(2)}
                    </td>
                    <td className="metric px-4 py-3 text-right text-[13px] text-short">
                      {row.maxDd.toFixed(1)}%
                    </td>
                    <td className="metric px-4 py-3 text-right text-[13px] text-ink">
                      {row.winRate.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href="/community"
                        aria-label={`Abrir ${row.name}`}
                        className="metric inline-flex h-6 w-6 items-center justify-center rounded border border-line text-muted transition-colors hover:border-[#2f3b4f] hover:text-ink"
                      >
                        ↗
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="metric mt-4 text-[12px] text-muted">
            Datos de demostración · el ranking real se calcula sobre corridas
            verificadas fuera de muestra.
          </p>
        </div>
      </section>
    </>
  );
}
