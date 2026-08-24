/**
 * API Route: POST /api/stripe/webhook
 *
 * Webhook de Stripe que procesa eventos de suscripción.
 *
 * Eventos manejados:
 * - checkout.session.completed → acredita QP vía endpoint INTERNO del worker
 *   (/internal/tokens/grant, autenticado con X-Scheduler-Key). Un webhook
 *   nunca lleva JWT de usuario, por eso NO se usa /tokens/transaction.
 * - customer.subscription.deleted → solo se registra en metadata; el downgrade
 *   a 'free' queda pendiente (se resuelve desde el worker/scheduler).
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

  if (!userId || !plan || !Number.isFinite(qpAmount)) {
    console.error("[stripe/webhook] Session sin metadata completa:", session.id);
    return;
  }

  // Contrato interno del worker: un webhook nunca tiene JWT de usuario,
  // por eso se usa el endpoint /internal/* autenticado con X-Scheduler-Key.
  const schedulerKey = process.env.SCHEDULER_KEY;
  if (!schedulerKey) {
    console.error(
      "[stripe/webhook] SCHEDULER_KEY no configurado: no se puede acreditar QP (session:",
      session.id,
      ")",
    );
    return;
  }

  console.log(
    `[stripe/webhook] Acreditando ${qpAmount} QP a usuario ${userId} (plan: ${plan})`,
  );

  try {
    const res = await fetch(`${WORKER}/internal/tokens/grant`, {
      method: "POST",
      headers: {
        "X-Scheduler-Key": schedulerKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: userId,
        amount: qpAmount,
        memo: `Compra Stripe ${plan}`,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(
        `[stripe/webhook] Error del worker acreditando QP: ${res.status} ${text}`,
      );
    } else {
      console.log(`[stripe/webhook] ${qpAmount} QP acreditados a ${userId}`);
    }
  } catch (err) {
    console.error("[stripe/webhook] Falló la llamada a /internal/tokens/grant:", err);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.user_id;

  if (!userId) {
    console.error("[stripe/webhook] Subscription sin user_id:", subscription.id);
    return;
  }

  // El downgrade a 'free' queda PENDIENTE: los endpoints de usuario exigen JWT
  // (imposible desde un webhook) y aún no existe endpoint interno de tiers.
  // Registramos el evento y devolvemos 200 para que Stripe no reintente;
  // el worker/scheduler resolverá el tier verificando la suscripción en Stripe.
  console.log(
    `[stripe/webhook] Suscripción cancelada (downgrade pendiente) — user_id: ${userId}, subscription: ${subscription.id}`,
  );
}