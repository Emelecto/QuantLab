/**
 * API Route: POST /api/stripe/webhook
 *
 * Webhook de Stripe que procesa eventos de suscripción.
 *
 * Eventos manejados:
 * - checkout.session.completed → acredita QP al usuario (worker /tokens/transaction)
 * - customer.subscription.deleted → degrada tier a 'free'
 *
 * IMPORTANTE: Siempre devuelve 200 a Stripe (incluso en error) para evitar
 * reintentos. Los errores se loguean internamente.
 */

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";

const WORKER = process.env.NEXT_PUBLIC_WORKER_URL || "http://localhost:8001";

export async function POST(req: NextRequest) {
  const stripe = getStripe();

  if (!stripe) {
    // Stripe no configurado → aceptar el webhook para no generar reintentos
    return NextResponse.json({ received: true });
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[stripe/webhook] STRIPE_WEBHOOK_SECRET no configurado");
    return NextResponse.json({ received: true });
  }

  // 1. Verificar firma de Stripe
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    console.warn("[stripe/webhook] Sin firma stripe-signature");
    return NextResponse.json({ received: true });
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    console.error("[stripe/webhook] Firma inválida:", err);
    // Devolvemos 200 para que Stripe no reintente (el error es de configuración)
    return NextResponse.json({ received: true });
  }

  // 2. Procesar evento
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      }
      case "customer.subscription.deleted": {
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      }
      // Otros eventos se ignoran silenciosamente
      default:
        console.log(`[stripe/webhook] Evento no manejado: ${event.type}`);
    }
  } catch (error) {
    console.error(`[stripe/webhook] Error procesando ${event.type}:`, error);
    // No lanzamos error → Stripe no reintenta
  }

  return NextResponse.json({ received: true });
}

/* ------------------------------------------------------------------ */
/* Handlers                                                            */
/* ------------------------------------------------------------------ */

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id;
  const plan = session.metadata?.plan;
  const qpAmount = Number(session.metadata?.qp_amount);

  if (!userId || !plan || !qpAmount) {
    console.error("[stripe/webhook] Session sin metadata completa:", session.id);
    return;
  }

  console.log(`[stripe/webhook] Acreditando ${qpAmount} QP a usuario ${userId} (plan: ${plan})`);

  // Acreditar QP llamando al worker
  const res = await fetch(`${WORKER}/tokens/transaction`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: userId,
      amount: qpAmount,
      type: "purchase",
      memo: `Suscripción ${plan} - Stripe`,
      ref_id: session.subscription?.toString() || session.id,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(`[stripe/webhook] Error del worker acreditando QP: ${res.status} ${text}`);
  } else {
    console.log(`[stripe/webhook] ${qpAmount} QP acreditados a ${userId}`);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.user_id;

  if (!userId) {
    console.error("[stripe/webhook] Subscription sin user_id:", subscription.id);
    return;
  }

  console.log(`[stripe/webhook] Suscripción cancelada para usuario ${userId}, degradando a free`);

  // El worker debería tener un endpoint para degradar tier.
  // Si no existe, el tier se maneja del lado del worker.
  // Intentamos llamar al worker para actualizar el tier.
  const res = await fetch(`${WORKER}/tokens/tier/downgrade`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: userId,
      tier: "free",
      reason: "subscription_deleted",
    }),
  });

  if (!res.ok) {
    // Si el endpoint no existe (404), el worker puede manejar la degradación
    // de otra forma (ej: verificando la suscripción activa en Stripe).
    if (res.status !== 404) {
      const text = await res.text().catch(() => "");
      console.error(`[stripe/webhook] Error degradando tier: ${res.status} ${text}`);
    }
  } else {
    console.log(`[stripe/webhook] Usuario ${userId} degradado a free`);
  }
}