import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { appUrl, getStripe, PLANS, priceIdFor, type PlanId } from "@/lib/billing";

/** Start a Stripe Checkout session to subscribe the caller's workspace to a plan. */
export async function POST(req: Request) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Billing is not configured on this server." }, { status: 503 });
  }

  const { plan } = (await req.json()) as { plan?: PlanId };
  const target = plan ? PLANS[plan] : undefined;
  if (!target || target.id === "free") {
    return NextResponse.json({ error: "Choose a paid plan." }, { status: 400 });
  }

  const priceId = priceIdFor(target);
  if (!priceId) {
    return NextResponse.json({ error: `Price for the ${target.name} plan is not configured.` }, { status: 503 });
  }

  const workspace = await prisma.workspace.findUnique({ where: { id: session.wid } });
  if (!workspace) return NextResponse.json({ error: "Workspace not found." }, { status: 404 });

  const user = await prisma.user.findUnique({ where: { id: session.uid } });

  // Reuse an existing Stripe customer so a workspace never ends up with two.
  let customerId = workspace.stripeCustomerId ?? undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user?.email,
      metadata: { workspaceId: workspace.id },
    });
    customerId = customer.id;
    await prisma.workspace.update({ where: { id: workspace.id }, data: { stripeCustomerId: customerId } });
  }

  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl()}/billing?status=success`,
    cancel_url: `${appUrl()}/billing?status=cancelled`,
    // So the webhook can attribute the subscription even if the customer id race-lags.
    subscription_data: { metadata: { workspaceId: workspace.id } },
    allow_promotion_codes: true,
  });

  return NextResponse.json({ url: checkout.url });
}
