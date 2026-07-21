"use client";

import { useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Button, Input } from "@/components/ui";

type Mode = "signin" | "signup";

export function LoginForm({ initialMode = "signin" }: { initialMode?: Mode }) {
  const params = useSearchParams();
  const next = params.get("next") || "/app";

  const [mode, setMode] = useState<Mode>(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isSignup = mode === "signup";
  const canSubmit = email.trim() && password && (!isSignup || inviteCode.trim());

  function switchMode(m: Mode) {
    setMode(m);
    setError(null);
    setPassword("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(isSignup ? "/api/register" : "/api/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(
          isSignup ? { name, email, password, inviteCode } : { email, password }
        ),
      });
      if (res.ok) {
        // Full navigation so the proxy re-runs with the new cookie.
        window.location.href = next;
        return;
      }
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? (isSignup ? "Couldn't create your account." : "Couldn't sign in."));
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
          <Image src="/cadence-mark.png" alt="Cadence" width={44} height={44} className="mb-3" priority />
          <h1 className="text-lg font-bold tracking-tight">
            {isSignup ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {isSignup ? "Your own private board for every client." : "Sign in to your workspace."}
          </p>
        </div>

        <form onSubmit={submit} className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-sm">
          {isSignup && (
            <Field label="Your name" optional>
              <Input
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Rivera"
              />
            </Field>
          )}

          <Field label="Email">
            <Input
              type="email"
              autoFocus={!isSignup}
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null);
              }}
              placeholder="you@agency.com"
            />
          </Field>

          <Field label="Password">
            <Input
              type="password"
              autoComplete={isSignup ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(null);
              }}
              placeholder={isSignup ? "At least 8 characters" : "Enter your password"}
            />
          </Field>

          {isSignup && (
            <Field label="Invite code">
              <Input
                value={inviteCode}
                onChange={(e) => {
                  setInviteCode(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Required to sign up"
              />
            </Field>
          )}

          {error && (
            <p role="alert" className="mt-2 rounded-md bg-red-500/10 px-2.5 py-1.5 text-[11px] font-medium text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          <Button type="submit" variant="primary" className="mt-3.5 w-full" disabled={busy || !canSubmit}>
            {busy
              ? isSignup
                ? "Creating account…"
                : "Signing in…"
              : isSignup
                ? "Create account"
                : "Sign in"}
          </Button>
        </form>

        <p className="mt-4 text-center text-[13px] text-[var(--muted)]">
          {isSignup ? (
            <>
              Already have an account?{" "}
              <button onClick={() => switchMode("signin")} className="cursor-pointer font-medium text-[var(--accent)] hover:underline">
                Sign in
              </button>
            </>
          ) : (
            <>
              New here?{" "}
              <button onClick={() => switchMode("signup")} className="cursor-pointer font-medium text-[var(--accent)] hover:underline">
                Create an account
              </button>
            </>
          )}
        </p>

        <p className="mt-3 text-center text-[11px] leading-relaxed text-[var(--muted)]">
          Clients don&apos;t need an account — content review links work without signing in.
        </p>
      </div>
    </main>
  );
}

function Field({ label, optional, children }: { label: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <label className="mb-2.5 block">
      <span className="mb-1.5 flex items-center gap-1.5 text-[12px] font-medium text-[var(--muted)]">
        {label}
        {optional && <span className="text-[10px] opacity-70">optional</span>}
      </span>
      {children}
    </label>
  );
}
