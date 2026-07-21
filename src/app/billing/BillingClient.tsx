"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { PAID_PLANS, PLANS, planFor, type PlanId } from "@/lib/plans";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

export function BillingClient() {
  const params = useSearchParams();
  const status = params.get("status");

  const [planId, setPlanId] = useState<string>("free");
  const [clientCount, setClientCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/bootstrap")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        setPlanId(d.workspace?.plan ?? "free");
        setClientCount(d.brands?.length ?? 0);
      })
      .catch(() => setError("Couldn't load your plan."))
      .finally(() => setLoading(false));
  }, []);

  const current = planFor(planId);
  const isPaid = current.id !== "free";

  async function checkout(plan: PlanId) {
    setBusy(plan);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.url) {
        window.location.assign(body.url);
        return;
      }
      setError(body.error ?? "Couldn't start checkout.");
    } catch {
      setError("Can't reach the server.");
    } finally {
      setBusy(null);
    }
  }

  async function manage() {
    setBusy("portal");
    setError(null);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.url) {
        window.location.assign(body.url);
        return;
      }
      setError(body.error ?? "Couldn't open the billing portal.");
    } catch {
      setError("Can't reach the server.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="mx-auto min-h-dvh max-w-4xl px-5 py-10">
      <Link href="/app" className="mb-6 inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--text)]">
        <ArrowLeft size={15} /> Back to board
      </Link>

      <h1 className="text-2xl font-bold tracking-tight">Plans &amp; billing</h1>
      <p className="mt-1.5 text-sm text-[var(--muted)]">Pick the plan that fits how many clients you manage.</p>

      {status === "success" && (
        <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-700 dark:text-emerald-400">
          You&apos;re subscribed — thanks! Your plan may take a few seconds to update.
        </div>
      )}
      {status === "cancelled" && (
        <div className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--panel2)] px-4 py-2.5 text-sm text-[var(--muted)]">
          Checkout cancelled — no changes made.
        </div>
      )}
      {error && (
        <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="mt-10 flex items-center gap-2 text-sm text-[var(--muted)]">
          <Loader2 size={16} className="animate-spin" /> Loading your plan…
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
            {isPaid && (
              <Button size="sm" variant="default" className="ml-auto" disabled={busy === "portal"} onClick={manage}>
                {busy === "portal" ? "Opening…" : "Manage billing"}
              </Button>
            )}
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {PAID_PLANS.map((plan) => {
              const isCurrent = plan.id === current.id;
              return (
                <div
                  key={plan.id}
                  className={cn(
                    "flex flex-col rounded-2xl border p-5",
                    isCurrent ? "border-[var(--accent)] ring-1 ring-[var(--accent)]" : "border-[var(--border)]"
                  )}
                >
                  <div className="text-sm font-semibold">{plan.name}</div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-2xl font-bold">{plan.priceLabel}</span>
                    <span className="text-[13px] text-[var(--muted)]">/mo</span>
                  </div>
                  <p className="mt-1 text-[13px] text-[var(--muted)]">{plan.blurb}</p>
                  <ul className="mt-3 flex-1 space-y-1.5 text-[13px]">
                    <li className="flex items-center gap-1.5">
                      <Check size={13} className="text-[var(--accent)]" />
                      {plan.clientLimit === Infinity ? "Unlimited" : plan.clientLimit} clients
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check size={13} className="text-[var(--accent)]" />
                      {plan.seats} team {plan.seats === 1 ? "seat" : "seats"}
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check size={13} className="text-[var(--accent)]" /> Client approval links
                    </li>
                  </ul>
                  <Button
                    variant={isCurrent ? "default" : "primary"}
                    className="mt-4 w-full"
                    disabled={isCurrent || busy === plan.id}
                    onClick={() => checkout(plan.id)}
                  >
                    {isCurrent ? "Current plan" : busy === plan.id ? "Starting…" : `Upgrade to ${plan.name}`}
                  </Button>
                </div>
              );
            })}
          </div>

          <p className="mt-6 text-center text-[12px] text-[var(--muted)]">
            The Free plan includes {PLANS.free.clientLimit} client. Cancel anytime from Manage billing.
          </p>
        </>
      )}
    </main>
  );
}
