/**
 * Plan definitions and pricing. Display-only for now — there's no payment
 * processor wired up (Stripe isn't available to businesses in Uganda). Prices
 * are shown in both USD and UGX.
 *
 * UGX amounts are set explicitly (not live-converted) at roughly
 * 1 USD ≈ 3,800 UGX; adjust here if the rate drifts.
 */
export type PlanId = "free" | "freelancer" | "agency" | "studio";
export type Currency = "USD" | "UGX";

export interface Plan {
  id: PlanId;
  name: string;
  usd: number; // per month
  ugx: number; // per month
  clientLimit: number; // Infinity = unlimited
  seats: number;
  blurb: string;
}

export const PLANS: Record<PlanId, Plan> = {
  free: { id: "free", name: "Free", usd: 0, ugx: 0, clientLimit: 1, seats: 1, blurb: "Try it with one client." },
  freelancer: { id: "freelancer", name: "Freelancer", usd: 19, ugx: 70000, clientLimit: 5, seats: 1, blurb: "For solo managers." },
  agency: { id: "agency", name: "Agency", usd: 59, ugx: 220000, clientLimit: 15, seats: 3, blurb: "For growing agencies." },
  studio: { id: "studio", name: "Studio", usd: 129, ugx: 490000, clientLimit: Infinity, seats: 10, blurb: "Unlimited clients." },
};

export const PAID_PLANS: Plan[] = [PLANS.freelancer, PLANS.agency, PLANS.studio];

export function planFor(id: string | null | undefined): Plan {
  return PLANS[(id as PlanId) ?? "free"] ?? PLANS.free;
}

/** Formatted price for a plan in the chosen currency, e.g. "$19" or "UGX 70,000". */
export function formatPrice(plan: Plan, currency: Currency): string {
  if (plan.usd === 0) return currency === "USD" ? "$0" : "UGX 0";
  return currency === "USD"
    ? `$${plan.usd}`
    : `UGX ${plan.ugx.toLocaleString("en-US")}`;
}
