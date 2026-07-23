import { Suspense } from "react";
import { DashboardClient } from "./DashboardClient";

export const metadata = { title: "Dashboard — Cadence" };

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardClient />
    </Suspense>
  );
}
