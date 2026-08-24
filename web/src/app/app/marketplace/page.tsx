"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getMarketplaceStrategies, type MarketplaceStrategy } from "@/lib/tokens";
import { MarketplaceCard } from "../components/MarketplaceCard";

function StarIcon({ active }: { active: boolean }) {
  return (
    <span className={`text-sm ${active ? "text-accent" : "text-line"}`}>★</span>
  );
}

export default function MarketplacePage() {
  const router = useRouter();
  const [strategies, setStrategies] = useState<MarketplaceStrategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [assetFilter, setAssetFilter] = useState("all");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [minRating, setMinRating] = useState(0);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let active = true;
    getMarketplaceStrategies()
      .then((rows) => {
        if (!active) return;
        setStrategies(rows);
        setError(null);
      })
      .catch((e) => {
        if (!active) return;
        setError(e instanceof Error ? e.message : "Error al cargar marketplace");
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const visible = useMemo(() => {
    let rows = strategies.slice();

    if (assetFilter !== "all") {
      rows = rows.filter((s) => s.asset_type === assetFilter);
    }

    rows = rows.filter(
      (s) => s.price_qp >= priceRange[0] && s.price_qp <= priceRange[1],
    );

    if (minRating > 0) {
      rows = rows.filter((s) => (s.rating ?? 0) >= minRating);
    }

    const q = query.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.symbol.toLowerCase().includes(q) ||
          (s.author ?? "").toLowerCase().includes(q),
      );
    }

    return rows;
  }, [strategies, assetFilter, priceRange, minRating, query]);

  return (
    <main className="flex min-h-screen flex-col">
      <section className="border-b border-line">
        <div className="mx-auto w-full max-w-6xl px-6 pt-16 pb-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-ink md:text-4xl">
                Marketplace
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted md:text-base">
                Suscríbete a estrategias de la comunidad y recibe señales en
                paper trading.
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push("/app/marketplace/my-subscriptions")}
              className="ql-btn-secondary h-9 rounded-md px-3 text-[13px]"
            >
              Mis suscripciones
            </button>
          </div>
        </div>
      </section>

      {/* Filtros */}
      <div className="border-b border-line bg-surface/40">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-3 px-6 py-3">
          <select
            aria-label="Filtrar por activo"
            value={assetFilter}
            onChange={(e) => setAssetFilter(e.target.value)}
            className="ql-input h-9 rounded-md px-3 text-[13px]"
          >
            <option value="all">Todos los activos</option>
            <option value="crypto">Cripto</option>
            <option value="stock">Acciones</option>
          </select>

          <select
            aria-label="Rango de precio"
            value={`${priceRange[0]}-${priceRange[1]}`}
            onChange={(e) => {
              const [min, max] = e.target.value.split("-").map(Number);
              setPriceRange([min, max]);
            }}
            className="ql-input h-9 rounded-md px-3 text-[13px]"
          >
            <option value="0-10000">Cualquier precio</option>
            <option value="0-50">Hasta 50 QP/sem</option>
            <option value="50-200">50 — 200 QP/sem</option>
            <option value="200-10000">200+ QP/sem</option>
          </select>

          {/* Rating mínimo */}
          <div className="flex items-center gap-1">
            <span className="metric text-[11px] text-muted">Rating ≥</span>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setMinRating(minRating === n ? 0 : n)}
                  aria-label={`${n} estrellas`}
                >
                  <StarIcon active={n <= minRating} />
                </button>
              ))}
            </div>
          </div>

          <input
            type="search"
            placeholder="Buscar estrategia…"
            aria-label="Buscar estrategia"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="ql-input h-9 min-w-[160px] flex-1 rounded-md px-3 text-[13px]"
          />

          <span className="metric ml-auto text-[12px] text-muted">
            {visible.length} de {strategies.length}
          </span>
        </div>
      </div>

      {/* Grid */}
      <section>
        <div className="mx-auto w-full max-w-6xl px-6 py-10">
          {loading ? (
            <p className="metric text-sm text-muted">Cargando marketplace…</p>
          ) : error ? (
            <div className="rounded-lg border border-short/40 bg-short/[0.08] px-4 py-3 text-sm text-short">
              {error}
            </div>
          ) : visible.length === 0 ? (
            <div className="ql-glass ql-elev-1 flex flex-col items-center gap-3 rounded-xl px-6 py-16 text-center">
              <p className="text-lg font-semibold text-ink">
                Sin resultados
              </p>
              <p className="max-w-md text-sm text-muted">
                No hay estrategias que coincidan con los filtros seleccionados.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {visible.map((s) => (
                <MarketplaceCard key={s.id} strategy={s} />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}