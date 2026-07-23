"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui";
import { PasswordInput } from "@/components/PasswordInput";

export function ResetPasswordForm() {
  const token = useSearchParams().get("token") ?? "";

  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || password.length < 8) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (res.ok) {
        // Reset also signs you in — straight to the board.
        window.location.assign("/app");
        return;
      }
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Couldn't reset your password.");
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
          <h1 className="text-lg font-bold tracking-tight">Choose a new password</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">You&apos;ll be signed in right after.</p>
        </div>

        {!token ? (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 text-center text-sm text-[var(--muted)]">
            This page needs the link from your reset email.{" "}
            <Link href="/forgot-password" className="font-medium text-[var(--accent)] hover:underline">
              Request a new one
            </Link>
            .
          </div>
        ) : (
          <form onSubmit={submit} className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-sm">
            <label className="mb-1.5 block text-[12px] font-medium text-[var(--muted)]">New password</label>
            <PasswordInput
              autoFocus
              autoComplete="new-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(null);
              }}
              placeholder="At least 8 characters"
            />

            {error && (
              <p role="alert" className="mt-2 rounded-md bg-red-500/10 px-2.5 py-1.5 text-[11px] font-medium text-red-600 dark:text-red-400">
                {error}
              </p>
            )}

            <Button type="submit" variant="primary" className="mt-3.5 w-full" disabled={busy || password.length < 8}>
              {busy ? "Saving…" : "Set new password"}
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}
