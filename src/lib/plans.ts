/**
 * Plan definitions and helpers — no Stripe SDK import, so this is safe to use
 * from client components. Stripe access lives in ./billing (server only).
 */
export type PlanId = "free" | "freelancer" | "agency" | "studio";

export interface Plan {
  id: PlanId;
  name: string;
  priceLabel: string;
  monthly: number; // USD/month, 0 for free
  clientLimit: number; // max brands; Infinity for unlimited
  seats: number;
  blurb: string;
  priceEnv?: string; // env var holding the Stripe price id
}

export const PLANS: Record<PlanId, Plan> = {
  free: { id: "free", name: "Free", priceLabel: "$0", monthly: 0, clientLimit: 1, seats: 1, blurb: "Try it with one client." },
  freelancer: { id: "freelancer", name: "Freelancer", priceLabel: "$19", monthly: 19, clientLimit: 5, seats: 1, blurb: "For solo managers.", priceEnv: "STRIPE_PRICE_FREELANCER" },
  agency: { id: "agency", name: "Agency", priceLabel: "$59", monthly: 59, clientLimit: 15, seats: 3, blurb: "For growing agencies.", priceEnv: "STRIPE_PRICE_AGENCY" },
  studio: { id: "studio", name: "Studio", priceLabel: "$129", monthly: 129, clientLimit: Infinity, seats: 10, blurb: "Unlimited clients.", priceEnv: "STRIPE_PRICE_STUDIO" },
};

export const PAID_PLANS: Plan[] = [PLANS.freelancer, PLANS.agency, PLANS.studio];

export function planFor(id: string | null | undefined): Plan {
  return PLANS[(id as PlanId) ?? "free"] ?? PLANS.free;
}

/** The Stripe price id for a plan, or null if it isn't configured (server-only env). */
export function priceIdFor(plan: Plan): string | null {
  if (!plan.priceEnv) return null;
  return process.env[plan.priceEnv] ?? null;
}

/** Map a Stripe price id back to our plan, for webhook handling. */
export function planIdForPrice(priceId: string | null | undefined): PlanId | null {
  if (!priceId) return null;
  for (const plan of PAID_PLANS) {
    if (priceIdFor(plan) === priceId) return plan.id;
  }
  return null;
}
