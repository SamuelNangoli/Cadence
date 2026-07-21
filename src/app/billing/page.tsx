import { Suspense } from "react";
import { BillingClient } from "./BillingClient";

export const metadata = { title: "Billing — Cadence" };

export default function BillingPage() {
  return (
    <Suspense>
      <BillingClient />
    </Suspense>
  );
}
