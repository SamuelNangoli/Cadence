import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/db";
import { getStripe, planIdForPrice } from "@/lib/billing";

/**
 * Stripe webhook — the source of truth for subscription state. Public (Stripe
 * calls it with no session) but authenticated by the signature, so the proxy
 * exempts it. Keep the raw body for signature verification.
 */
export async function POST(req: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return NextResponse.json({ error: "Billing not configured." }, { status: 503 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature." }, { status: 400 });

  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(raw, signature, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "invalid";
    return NextResponse.json({ error: `Signature verification failed: ${message}` }, { status: 400 });
  }

  async function applySubscription(sub: Stripe.Subscription) {
    const workspaceId = sub.metadata?.workspaceId;
    const priceId = sub.items.data[0]?.price.id;
    const active = sub.status === "active" || sub.status === "trialing";
    const plan = active ? planIdForPrice(priceId) ?? "free" : "free";

    const periodEnd = (sub as unknown as { current_period_end?: number }).current_period_end;
    const data = {
      plan,
      stripeSubscriptionId: sub.id,
      subscriptionStatus: sub.status,
      currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
    };

    // Prefer the workspace id in metadata; fall back to the Stripe customer id.
    if (workspaceId) {
      await prisma.workspace.updateMany({ where: { id: workspaceId }, data });
    } else if (typeof sub.customer === "string") {
      await prisma.workspace.updateMany({ where: { stripeCustomerId: sub.customer }, data });
    }
  }

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await applySubscription(event.data.object as Stripe.Subscription);
      break;
    case "checkout.session.completed": {
      const s = event.data.object as Stripe.Checkout.Session;
      if (s.subscription && typeof s.subscription === "string") {
        const sub = await stripe.subscriptions.retrieve(s.subscription);
        await applySubscription(sub);
      }
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
