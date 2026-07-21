"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { planFor } from "@/lib/plans";
import { PricingCards } from "@/components/PricingCards";

export function BillingClient() {
  const [planId, setPlanId] = useState<string>("free");
  const [clientCount, setClientCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/bootstrap")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        setPlanId(d.workspace?.plan ?? "free");
        setClientCount(d.brands?.length ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const current = planFor(planId);

  return (
    <main className="mx-auto min-h-dvh max-w-4xl px-5 py-10">
      <Link href="/app" className="mb-6 inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--text)]">
        <ArrowLeft size={15} /> Back to board
      </Link>

      <h1 className="text-2xl font-bold tracking-tight">Plans &amp; pricing</h1>
      <p className="mt-1.5 text-sm text-[var(--muted)]">Pick the plan that fits how many clients you manage.</p>

      {loading ? (
        <div className="mt-10 flex items-center gap-2 text-sm text-[var(--muted)]">
          <Loader2 size={16} className="animate-spin" /> Loading…
        </div>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--panel)] px-4 py-3">
            <span className="text-sm">
              Current plan: <strong>{current.name}</strong>
            </span>
            <span className="text-sm text-[var(--muted)]">
              {clientCount} / {current.clientLimit === Infinity ? "∞" : current.clientLimit} clients used
            </span>
          </div>

          {notice && (
            <div className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--panel2)] px-4 py-2.5 text-sm text-[var(--muted)]">
              {notice}
            </div>
          )}

          <div className="mt-6">
            <PricingCards
              variant="app"
              currentPlan={current.id}
              ctaLabel="Upgrade"
              onChoose={() =>
                setNotice(
                  "Self-serve upgrades aren't live yet — we're setting up mobile-money and card payments for Uganda. Reach out and we'll move you onto a paid plan."
                )
              }
            />
          </div>

          <p className="mt-6 text-center text-[12px] text-[var(--muted)]">
            Prices shown per month. Switch between USD and UGX above.
          </p>
        </>
      )}
    </main>
  );
}
