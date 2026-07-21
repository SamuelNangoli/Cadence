"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { PAID_PLANS, formatPrice, type Currency } from "@/lib/plans";
import { cn } from "@/lib/utils";

/** Toggle between USD and UGX. */
function CurrencyToggle({ value, onChange }: { value: Currency; onChange: (c: Currency) => void }) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-lg border border-current/15 p-0.5 text-current/70">
      {(["USD", "UGX"] as Currency[]).map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          className={cn(
            "cursor-pointer rounded-md px-3 py-1 text-xs font-semibold transition-colors",
            value === c ? "bg-current/15 text-current" : "hover:text-current"
          )}
        >
          {c}
        </button>
      ))}
    </div>
  );
}

/**
 * Pricing cards with a currency switcher. `variant` tweaks styling for the dark
 * landing page vs the in-app (theme-aware) plans page. `currentPlan` highlights
 * the caller's active plan; `onChoose` wires the button (falls back to a link).
 */
export function PricingCards({
  variant = "app",
  currentPlan,
  onChoose,
  ctaLabel = "Choose plan",
}: {
  variant?: "landing" | "app";
  currentPlan?: string;
  onChoose?: (planId: string) => void;
  ctaLabel?: string;
}) {
  const [currency, setCurrency] = useState<Currency>("USD");
  const landing = variant === "landing";

  return (
    <div>
      <div className="mb-6 flex justify-center">
        <CurrencyToggle value={currency} onChange={setCurrency} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {PAID_PLANS.map((plan) => {
          const isCurrent = plan.id === currentPlan;
          const featured = plan.id === "agency";
          return (
            <div
              key={plan.id}
              className={cn(
                "flex flex-col rounded-2xl border p-5",
                landing
                  ? featured
                    ? "border-[#08C8DC]/40 bg-gradient-to-b from-[#08C8DC]/[0.07] to-transparent"
                    : "border-white/10 bg-[#0d1f35]"
                  : isCurrent
                    ? "border-[var(--accent)] ring-1 ring-[var(--accent)]"
                    : "border-[var(--border)] bg-[var(--panel)]"
              )}
            >
              <div className="flex items-center gap-2">
                <span className={cn("text-sm font-semibold", landing && "text-white")}>{plan.name}</span>
                {featured && (
                  <span className="rounded-full bg-[#08C8DC]/15 px-2 py-0.5 text-[10px] font-semibold text-[#08C8DC]">
                    Popular
                  </span>
                )}
              </div>

              <div className="mt-2 flex items-baseline gap-1">
                <span className={cn("text-2xl font-bold", landing && "text-white")}>
                  {formatPrice(plan, currency)}
                </span>
                <span className={cn("text-[13px]", landing ? "text-slate-400" : "text-[var(--muted)]")}>/mo</span>
              </div>

              <p className={cn("mt-1 text-[13px]", landing ? "text-slate-400" : "text-[var(--muted)]")}>{plan.blurb}</p>

              <ul className="mt-3 flex-1 space-y-1.5 text-[13px]">
                {[
                  `${plan.clientLimit === Infinity ? "Unlimited" : plan.clientLimit} clients`,
                  `${plan.seats} team ${plan.seats === 1 ? "seat" : "seats"}`,
                  "Client approval links",
                  "All calendar views",
                ].map((f) => (
                  <li key={f} className={cn("flex items-center gap-1.5", landing ? "text-slate-200" : "text-[var(--text)]")}>
                    <Check size={13} className={landing ? "text-[#08C8DC]" : "text-[var(--accent)]"} />
                    {f}
                  </li>
                ))}
              </ul>

              {onChoose ? (
                <button
                  onClick={() => onChoose(plan.id)}
                  disabled={isCurrent}
                  className={cn(
                    "mt-4 w-full cursor-pointer rounded-lg px-3 py-2 text-sm font-semibold transition-opacity disabled:cursor-default disabled:opacity-60",
                    landing
                      ? "bg-gradient-to-r from-[#08C8DC] to-[#1691D3] text-[#06263a] hover:opacity-90"
                      : "bg-[var(--accent)] text-white hover:opacity-90"
                  )}
                >
                  {isCurrent ? "Current plan" : ctaLabel}
                </button>
              ) : (
                <a
                  href="/register"
                  className={cn(
                    "mt-4 w-full rounded-lg px-3 py-2 text-center text-sm font-semibold transition-opacity",
                    landing
                      ? "bg-gradient-to-r from-[#08C8DC] to-[#1691D3] text-[#06263a] hover:opacity-90"
                      : "bg-[var(--accent)] text-white hover:opacity-90"
                  )}
                >
                  {ctaLabel}
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
