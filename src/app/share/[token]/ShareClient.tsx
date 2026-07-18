"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { format } from "date-fns";
import { CheckCircle2, MessageSquareText, Clock } from "lucide-react";
import type { PostDTO, BrandDTO } from "@/lib/types";
import { PLATFORMS } from "@/lib/platforms";
import { PlatformIcon } from "@/components/icons";
import { MediaTile } from "@/components/PostCard";
import { Button, Input, Spinner, Textarea } from "@/components/ui";
import { cn } from "@/lib/utils";

interface SharePayload {
  brand: BrandDTO;
  posts: PostDTO[];
}

/**
 * Client review page — read-only + comment/approve, reachable by link alone.
 * No account, no login: the token IS the access.
 */
export function ShareClient({ token }: { token: string }) {
  const [data, setData] = useState<SharePayload | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [drafting, setDrafting] = useState<string | null>(null); // postId with open change-request box
  const [changeText, setChangeText] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  // Remembered name from a previous visit: "" on the server, the stored value
  // once mounted. A local edit takes precedence over the stored value.
  const storedName = useSyncExternalStore(
    () => () => {},
    () => localStorage.getItem("cadence-client-name") ?? "",
    () => ""
  );
  const [typedName, setTypedName] = useState<string | null>(null);
  const name = typedName ?? storedName;
  const setName = setTypedName;

  useEffect(() => {
    fetch(`/api/share/${token}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setNotFound(true));
  }, [token]);

  const groups = useMemo(() => {
    if (!data) return { review: [], upcoming: [] as PostDTO[] };
    return {
      review: data.posts.filter((p) => p.status === "needs_approval"),
      upcoming: data.posts.filter((p) => p.status !== "needs_approval"),
    };
  }, [data]);

  async function decide(postId: string, decision: "approve" | "request_changes", comment?: string) {
    setBusy(postId);
    try {
      if (name) localStorage.setItem("cadence-client-name", name);
      const res = await fetch(`/api/share/${token}/decision`, {
        method: "POST",
        body: JSON.stringify({ postId, decision, comment, author: name || "Client" }),
      });
      const updated: PostDTO = await res.json();
      setData((d) =>
        d ? { ...d, posts: d.posts.map((p) => (p.id === postId ? updated : p)) } : d
      );
      setDrafting(null);
      setChangeText("");
    } finally {
      setBusy(null);
    }
  }

  if (notFound) {
    return (
      <div className="flex h-dvh items-center justify-center p-6 text-center">
        <div>
          <div className="text-3xl">🔗</div>
          <h1 className="mt-2 text-lg font-bold">This review link isn&apos;t valid</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">Ask your social media manager for a fresh link.</p>
        </div>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="flex h-dvh items-center justify-center gap-3">
        <Spinner /> <span className="text-sm text-[var(--muted)]">Loading review board…</span>
      </div>
    );
  }

  const { brand } = data;

  function PostBlock({ post, reviewable }: { post: PostDTO; reviewable: boolean }) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <MediaTile brand={brand} emoji={post.mediaEmoji} className="h-16 w-16 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold">{post.title}</h3>
              {post.approvalState === "approved" && (
                <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600">
                  <CheckCircle2 size={11} /> Approved
                </span>
              )}
              {post.approvalState === "changes_requested" && (
                <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] font-medium text-red-500">Changes requested</span>
              )}
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-[11px] text-[var(--muted)]">
              {post.scheduledAt && (
                <span className="flex items-center gap-1">
                  <Clock size={10} /> {format(new Date(post.scheduledAt), "EEE, MMM d 'at' HH:mm")}
                </span>
              )}
              <span className="capitalize">{post.contentType}</span>
            </div>
          </div>
        </div>

        {/* per-channel copy */}
        <div className="mt-3 space-y-2">
          {post.variants.map((v) => (
            <div key={v.id} className="rounded-lg bg-[var(--panel2)]/70 p-2.5">
              <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-[var(--muted)]">
                <PlatformIcon platform={v.platform} size={11} />
                {PLATFORMS[v.platform].label}
              </div>
              <p className="whitespace-pre-wrap text-[12px] leading-relaxed">{v.copy || <em className="text-[var(--muted)]">Copy coming soon</em>}</p>
            </div>
          ))}
        </div>

        {reviewable && post.approvalState === "pending" && (
          <div className="mt-3">
            {drafting === post.id ? (
              <div className="space-y-2">
                <Textarea
                  rows={2}
                  autoFocus
                  value={changeText}
                  onChange={(e) => setChangeText(e.target.value)}
                  placeholder="What should change?"
                />
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setDrafting(null)}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    disabled={!changeText.trim() || busy === post.id}
                    onClick={() => decide(post.id, "request_changes", changeText.trim())}
                  >
                    Send request
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button size="sm" variant="success" className="flex-1" disabled={busy === post.id} onClick={() => decide(post.id, "approve")}>
                  <CheckCircle2 size={13} /> {busy === post.id ? "Saving…" : "Approve"}
                </Button>
                <Button size="sm" className="flex-1" onClick={() => setDrafting(post.id)}>
                  <MessageSquareText size={13} /> Request changes
                </Button>
              </div>
            )}
          </div>
        )}

        {post.comments.length > 0 && (
          <div className="mt-3 border-t border-[var(--border)] pt-2">
            {post.comments.map((c) => (
              <div key={c.id} className="py-1 text-[11px]">
                <span className="font-semibold">{c.author}:</span>{" "}
                <span className="text-[var(--muted)]">{c.body}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-dvh" style={{ background: `linear-gradient(180deg, ${brand.accentColor}14, transparent 240px)` }}>
      <div className="mx-auto max-w-xl px-4 py-8">
        <header className="mb-6 text-center">
          <span
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-bold text-white"
            style={{ background: brand.accentColor }}
          >
            {brand.name.slice(0, 1)}
          </span>
          <h1 className="mt-3 text-xl font-bold">{brand.name} — content review</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Review upcoming posts below. Approve them or request changes — no account needed.
          </p>
          <div className="mx-auto mt-3 max-w-56">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name (for comments)" className="h-8 text-center text-xs" />
          </div>
        </header>

        {groups.review.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-2 text-[12px] font-bold uppercase tracking-wide text-amber-600">
              Waiting for your review ({groups.review.length})
            </h2>
            <div className="space-y-3">
              {groups.review.map((p) => (
                <PostBlock key={p.id} post={p} reviewable />
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="mb-2 text-[12px] font-bold uppercase tracking-wide text-[var(--muted)]">
            Coming up ({groups.upcoming.length})
          </h2>
          <div className="space-y-3">
            {groups.upcoming.map((p) => (
              <PostBlock key={p.id} post={p} reviewable={false} />
            ))}
            {groups.upcoming.length === 0 && (
              <p className={cn("rounded-xl border border-dashed border-[var(--border)] p-6 text-center text-sm text-[var(--muted)]")}>
                Nothing else scheduled yet.
              </p>
            )}
          </div>
        </section>

        <footer className="mt-10 text-center text-[11px] text-[var(--muted)]">
          Powered by <span className="font-semibold">Cadence</span> — one board for every client.
        </footer>
      </div>
    </div>
  );
}
