/**
 * Stripe access — server only (imports the Stripe SDK). Plan config that the
 * client also needs lives in ./plans.
 *
 * Everything degrades gracefully when Stripe isn't configured yet: the app
 * runs, everyone is on the free plan, and the billing UI shows a setup notice.
 */
import Stripe from "stripe";

export * from "./plans";

let _stripe: Stripe | null | undefined;

/** Stripe client, or null when STRIPE_SECRET_KEY isn't set. */
export function getStripe(): Stripe | null {
  if (_stripe !== undefined) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  _stripe = key ? new Stripe(key) : null;
  return _stripe;
}

export function billingConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

/** Absolute base URL for Stripe redirect targets. */
export function appUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
