import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { appUrl, getStripe } from "@/lib/billing";

/** Open the Stripe customer portal so a workspace can manage/cancel its plan. */
export async function POST() {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Billing is not configured on this server." }, { status: 503 });
  }

  const workspace = await prisma.workspace.findUnique({ where: { id: session.wid } });
  if (!workspace?.stripeCustomerId) {
    return NextResponse.json({ error: "No billing account yet — subscribe to a plan first." }, { status: 400 });
  }

  const portal = await stripe.billingPortal.sessions.create({
    customer: workspace.stripeCustomerId,
    return_url: `${appUrl()}/billing`,
  });

  return NextResponse.json({ url: portal.url });
}
