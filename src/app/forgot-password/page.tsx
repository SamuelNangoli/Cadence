"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button, Input } from "@/components/ui";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !email.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok) setSent(body.message ?? "Check your inbox for the reset link.");
      else setError(body.error ?? "Couldn't send the reset email.");
    } catch {
      setError("Can't reach the server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <Image src="/cadence-mark.png" alt="Cadence" width={44} height={44} className="mb-3" priority />
          <h1 className="text-lg font-bold tracking-tight">Reset your password</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Enter your account email and we&apos;ll send you a reset link.
          </p>
        </div>

        {sent ? (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center text-sm text-emerald-700 dark:text-emerald-400">
            {sent}
          </div>
        ) : (
          <form onSubmit={submit} className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-sm">
            <label className="mb-1.5 block text-[12px] font-medium text-[var(--muted)]">Email</label>
            <Input
              type="email"
              autoFocus
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null);
              }}
              placeholder="you@agency.com"
            />

            {error && (
              <p role="alert" className="mt-2 rounded-md bg-red-500/10 px-2.5 py-1.5 text-[11px] font-medium text-red-600 dark:text-red-400">
                {error}
              </p>
            )}

            <Button type="submit" variant="primary" className="mt-3.5 w-full" disabled={busy || !email.trim()}>
              {busy ? "Sending…" : "Send reset link"}
            </Button>
          </form>
        )}

        <p className="mt-4 text-center text-[13px] text-[var(--muted)]">
          Remembered it?{" "}
          <Link href="/login" className="font-medium text-[var(--accent)] hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
