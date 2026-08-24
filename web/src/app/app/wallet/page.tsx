"use client";

import { useEffect, useState } from "react";
import { getBalance, getLedger } from "@/lib/tokens";
import { QP_PRICES, TIER } from "@/lib/constants";
import type { TokenBalance, TokenLedgerEntry } from "@/lib/tournaments";

type PlanKey = "plus" | "pro" | "legend";

const PLAN_MAP: Record<number, PlanKey> = {
  100: "plus",
  300: "pro",
  1000: "legend",
};

export default function WalletPage() {
  const [balance, setBalance] = useState<TokenBalance | null>(null);
  const [ledger, setLedger] = useState<TokenLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<PlanKey | null>(null);
  const [stripeDisabled, setStripeDisabled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [b, l] = await Promise.all([getBalance(), getLedger()]);
        setBalance(b);
        setLedger(l);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleSubscribe(qpAmount: number) {
    const plan = PLAN_MAP[qpAmount];
    if (!plan) return;

    setSubscribing(plan);
    setError(null);
    setStripeDisabled(false);

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      const json = await res.json();

      if (res.ok && json.url) {
        window.location.href = json.url;
        return;
      }

      if (json.message === "Stripe no configurado") {
        setStripeDisabled(true);
        return;
      }

      setError(json.error || "No se pudo iniciar la suscripción");
    } catch (e) {
      console.error(e);
      setError("Error de conexión");
    } finally {
      setSubscribing(null);
    }
  }

  if (loading) return <div className="p-14 text-muted">Cargando...</div>;

  const tier = balance?.tier || "free";
  const tierInfo = TIER[tier as keyof typeof TIER] || TIER.free;

  return (
    <main className="flex min-h-screen flex-col">
      <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-14">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">
          Mi Wallet
        </h1>
        <p className="mt-2 text-sm text-muted">
          Gestiona tus QuantPoints (QP).
        </p>

        {/* Balance */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="ql-glass ql-elev-2 rounded-xl p-5">
            <p className="text-xs uppercase tracking-wide text-muted">Balance</p>
            <p className="mt-2 text-3xl font-semibold text-accent ql-glow-text">
              {balance?.balance ?? 0} QP
            </p>
          </div>
          <div className="ql-glass ql-elev-1 rounded-xl p-5">
            <p className="text-xs uppercase tracking-wide text-muted">Tier</p>
            <p className="mt-2 text-2xl font-semibold text-ink">
              {tierInfo.label}
            </p>
          </div>
          <div className="ql-glass ql-elev-1 rounded-xl p-5">
            <p className="text-xs uppercase tracking-wide text-muted">Ganados total</p>
            <p className="mt-2 text-2xl font-semibold text-long">
              {balance?.lifetime_earned ?? 0}
            </p>
          </div>
        </div>

        {/* Comprar QP */}
        <div className="mt-8 ql-glass ql-elev-1 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-ink">Comprar QP</h2>

          {/* Banner Stripe deshabilitado */}
          {stripeDisabled && (
            <div className="mt-4 rounded-lg border border-line bg-white/[0.02] px-4 py-3 text-center text-sm text-muted">
              <p className="font-medium text-ink">Compras próximamente</p>
              <p className="mt-1">El método de pago estará disponible pronto.</p>
            </div>
          )}

          {/* Banner de error */}
          {error && (
            <div className="mt-4 rounded-lg border border-short/30 bg-short/10 px-4 py-3 text-sm text-short">
              {error}
            </div>
          )}

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {QP_PRICES.map((p) => {
              const plan = PLAN_MAP[p.amount];
              const isSubscribing = subscribing === plan;
              return (
                <div key={p.usd} className="rounded-lg border border-line bg-white/[0.02] p-4 text-center">
                  <p className="text-2xl font-semibold text-ink">{p.amount} QP</p>
                  <p className="mt-1 text-sm text-muted">${p.usd}/mes</p>
                  {"popular" in p && (
                    <span className="mt-2 inline-block rounded bg-accent/15 px-2 py-0.5 text-[11px] font-medium text-accent">
                      Popular
                    </span>
                  )}
                  {"bonus" in p && (
                    <span className="mt-2 ml-1 inline-block rounded bg-long/15 px-2 py-0.5 text-[11px] font-medium text-long">
                      {"bonus" in p ? p.bonus : ""}
                    </span>
                  )}
                  <button
                    onClick={() => handleSubscribe(p.amount)}
                    disabled={isSubscribing || stripeDisabled}
                    className="mt-3 w-full rounded-md bg-accent px-3 py-2 text-sm font-medium text-bg hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubscribing ? "Procesando..." : "Suscribirse"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Historial */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-ink">Historial</h2>
          {ledger.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Sin transacciones aún.</p>
          ) : (
            <div className="mt-3 ql-glass ql-elev-1 overflow-hidden rounded-xl">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3">Memo</th>
                    <th className="px-4 py-3 text-right">Cantidad</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.map((e) => (
                    <tr key={e.id} className="border-b border-line/50">
                      <td className="px-4 py-3 text-muted">
                        {new Date(e.created_at).toLocaleDateString("es-ES")}
                      </td>
                      <td className="px-4 py-3 text-ink">{e.type}</td>
                      <td className="px-4 py-3 text-muted">{e.memo || "—"}</td>
                      <td className={`px-4 py-3 text-right font-mono ${e.amount >= 0 ? "text-long" : "text-short"}`}>
                        {e.amount >= 0 ? "+" : ""}{e.amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Aviso legal */}
        <p className="mt-8 text-[11px] text-muted">
          Los QuantPoints (QP) son puntos virtuales sin valor monetario. No se pueden retirar ni intercambiar por dinero.
          Su utilidad es exclusivamente dentro de la plataforma QuantLab.
        </p>
      </div>
    </main>
  );
}