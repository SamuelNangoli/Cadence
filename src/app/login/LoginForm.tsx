"use client";

import { useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Lock } from "lucide-react";
import { Button, Input } from "@/components/ui";

export function LoginForm() {
  const params = useSearchParams();
  const next = params.get("next") || "/app";

  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !password) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        // Full navigation so the proxy re-runs with the new cookie.
        window.location.href = next;
        return;
      }
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Couldn't sign in.");
      setPassword("");
    } catch {
      setError("Can't reach the server. Is the app running?");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <Image
            src="/logo-mark.png"
            alt="Cadence"
            width={44}
            height={44}
            className="mb-3 rounded-xl"
            priority
          />
          <h1 className="text-lg font-bold tracking-tight">Cadence</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">One board for every client.</p>
        </div>

        <form
          onSubmit={submit}
          className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-sm"
        >
          <label htmlFor="password" className="mb-1.5 flex items-center gap-1.5 text-[12px] font-medium text-[var(--muted)]">
            <Lock size={12} /> Workspace password
          </label>
          <Input
            id="password"
            type="password"
            autoFocus
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Enter password"
          />

          {error && (
            <p role="alert" className="mt-2 rounded-md bg-red-500/10 px-2.5 py-1.5 text-[11px] font-medium text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          <Button type="submit" variant="primary" className="mt-3 w-full" disabled={busy || !password}>
            {busy ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="mt-4 text-center text-[11px] leading-relaxed text-[var(--muted)]">
          Clients don&apos;t need this — content review links work without an account.
        </p>
      </div>
    </main>
  );
}
