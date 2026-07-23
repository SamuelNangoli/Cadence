"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, CheckCircle2, Clock, Loader2, MessageSquare, Users } from "lucide-react";
import { STATUSES, STATUS_ORDER, type PostStatus } from "@/lib/platforms";
import type { BootstrapDTO, BrandDTO, PostDTO } from "@/lib/types";

/**
 * Work & results overview. Everything is computed client-side from the same
 * bootstrap payload the board uses — no extra API surface.
 *
 * Chart notes (per the dataviz method): status colors are state, not series
 * identity, and two of them are deliberately near-gray — so no stacked bar.
 * Each status gets its own labeled row; the label carries identity, the color
 * only reinforces it. Text stays in text tokens, never the mark color.
 */

function relTime(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return "";
  }
}

function StatTile({ label, value, icon, accent }: { label: string; value: number | string; icon?: React.ReactNode; accent?: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4">
      <div className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--muted)]">
        {icon}
        {label}
      </div>
      <div className="mt-1.5 text-2xl font-bold tabular-nums" style={accent ? { color: accent } : undefined}>
        {value}
      </div>
    </div>
  );
}

function Panel({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
        {title}
        {count !== undefined && (
          <span className="rounded-full bg-[var(--panel2)] px-2 py-0.5 text-[11px] font-semibold tabular-nums text-[var(--muted)]">
            {count}
          </span>
        )}
      </h2>
      {children}
    </section>
  );
}

/** One labeled row of the status breakdown: label + count carry identity; the bar reinforces. */
function StatusRow({ status, count, max }: { status: PostStatus; count: number; max: number }) {
  const meta = STATUSES[status];
  const pct = max === 0 ? 0 : Math.round((count / max) * 100);
  return (
    <div className="flex items-center gap-3">
      <span className="flex w-32 shrink-0 items-center gap-1.5 text-[12px] text-[var(--text)]">
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: meta.color }} />
        {meta.label}
      </span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--panel2)]">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: meta.color }} />
      </div>
      <span className="w-8 shrink-0 text-right text-[12px] font-semibold tabular-nums">{count}</span>
    </div>
  );
}

export function DashboardClient() {
  const [data, setData] = useState<BootstrapDTO | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/bootstrap")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then(setData)
      .catch(() => setError("Couldn't load your data."));
  }, []);

  const m = useMemo(() => {
    if (!data) return null;
    const { posts, brands } = data;
    const brandById = new Map(brands.map((b) => [b.id, b]));

    const byStatus = Object.fromEntries(STATUS_ORDER.map((s) => [s, 0])) as Record<PostStatus, number>;
    for (const p of posts) byStatus[p.status as PostStatus] = (byStatus[p.status as PostStatus] ?? 0) + 1;

    const awaiting = posts
      .filter((p) => p.status === "needs_approval")
      .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));

    const approved = posts
      .filter((p) => p.approvalState === "approved")
      .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));

    // Client feedback = comments left through review links.
    const clientComments = posts
      .flatMap((p) => p.comments.filter((c) => c.authorType === "client").map((c) => ({ post: p, comment: c })))
      .sort((a, b) => b.comment.createdAt.localeCompare(a.comment.createdAt));

    const perBrand = brands
      .map((b) => {
        const bp = posts.filter((p) => p.brandId === b.id);
        return {
          brand: b,
          total: bp.length,
          awaiting: bp.filter((p) => p.status === "needs_approval").length,
          approved: bp.filter((p) => p.approvalState === "approved").length,
          published: bp.filter((p) => p.status === "published").length,
        };
      })
      .sort((a, b) => b.total - a.total);

    const now = new Date();
    const in7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcoming = posts.filter((p) => {
      if (!p.scheduledAt || !["approved", "scheduled"].includes(p.status)) return false;
      const d = new Date(p.scheduledAt);
      return d >= now && d <= in7;
    }).length;

    return { byStatus, awaiting, approved, clientComments, perBrand, upcoming, brandById, total: posts.length };
  }, [data]);

  const BrandDot = ({ brand }: { brand: BrandDTO | undefined }) =>
    brand ? (
      <span className="flex min-w-0 items-center gap-1.5 text-[12px] text-[var(--muted)]">
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: brand.accentColor }} />
        <span className="truncate">{brand.name}</span>
      </span>
    ) : null;

  const PostLine = ({ post, right }: { post: PostDTO; right: React.ReactNode }) => (
    <li className="flex items-center justify-between gap-3 py-2">
      <div className="min-w-0">
        <div className="truncate text-[13px] font-medium">{post.title}</div>
        <BrandDot brand={m?.brandById.get(post.brandId)} />
      </div>
      <div className="shrink-0 text-right text-[11px] text-[var(--muted)]">{right}</div>
    </li>
  );

  return (
    <main className="mx-auto min-h-dvh max-w-5xl px-5 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/app" className="mb-2 inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--text)]">
            <ArrowLeft size={15} /> Back to board
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">Your work, and what clients have signed off.</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-600 dark:text-red-400">{error}</div>
      )}

      {!data && !error && (
        <div className="mt-10 flex items-center gap-2 text-sm text-[var(--muted)]">
          <Loader2 size={16} className="animate-spin" /> Loading…
        </div>
      )}

      {m && (
        <>
          {/* Headline numbers */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <StatTile label="Clients" value={data!.brands.length} icon={<Users size={13} />} />
            <StatTile
              label="Awaiting approval"
              value={m.awaiting.length}
              icon={<Clock size={13} />}
              accent={m.awaiting.length > 0 ? STATUSES.needs_approval.color : undefined}
            />
            <StatTile label="Client-approved" value={m.approved.length} icon={<CheckCircle2 size={13} />} accent={STATUSES.approved.color} />
            <StatTile label="Next 7 days" value={m.upcoming} />
            <StatTile label="Published" value={m.byStatus.published} />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {/* The core ask: what clients have approved */}
            <Panel title="Approved by clients" count={m.approved.length}>
              {m.approved.length === 0 ? (
                <p className="py-4 text-center text-[13px] text-[var(--muted)]">
                  Nothing approved yet — send a client their review link from a post&apos;s{" "}
                  <em>Request approval</em>.
                </p>
              ) : (
                <ul className="divide-y divide-[var(--border)]">
                  {m.approved.slice(0, 8).map((p) => (
                    <PostLine
                      key={p.id}
                      post={p}
                      right={
                        <span className="inline-flex items-center gap-1" style={{ color: STATUSES.approved.color }}>
                          <CheckCircle2 size={12} /> {relTime(p.updatedAt)}
                        </span>
                      }
                    />
                  ))}
                </ul>
              )}
            </Panel>

            {/* Waiting on clients */}
            <Panel title="Waiting on client review" count={m.awaiting.length}>
              {m.awaiting.length === 0 ? (
                <p className="py-4 text-center text-[13px] text-[var(--muted)]">Nothing is waiting on a client. All caught up.</p>
              ) : (
                <ul className="divide-y divide-[var(--border)]">
                  {m.awaiting.slice(0, 8).map((p) => (
                    <PostLine key={p.id} post={p} right={<span>sent {relTime(p.updatedAt)}</span>} />
                  ))}
                </ul>
              )}
            </Panel>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {/* Pipeline breakdown — labeled rows, not a stacked bar */}
            <Panel title="Pipeline" count={m.total}>
              <div className="space-y-2.5">
                {STATUS_ORDER.map((s) => (
                  <StatusRow key={s} status={s} count={m.byStatus[s]} max={Math.max(...STATUS_ORDER.map((x) => m.byStatus[x]), 1)} />
                ))}
              </div>
            </Panel>

            {/* Client change requests */}
            <Panel title="Client feedback" count={m.clientComments.length}>
              {m.clientComments.length === 0 ? (
                <p className="py-4 text-center text-[13px] text-[var(--muted)]">No client comments yet.</p>
              ) : (
                <ul className="divide-y divide-[var(--border)]">
                  {m.clientComments.slice(0, 6).map(({ post, comment }) => (
                    <li key={comment.id} className="py-2">
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex min-w-0 items-center gap-1.5 text-[12px] font-medium">
                          <MessageSquare size={12} className="shrink-0 text-[var(--muted)]" />
                          <span className="truncate">{comment.author}</span>
                          <span className="truncate font-normal text-[var(--muted)]">on {post.title}</span>
                        </span>
                        <span className="shrink-0 text-[11px] text-[var(--muted)]">{relTime(comment.createdAt)}</span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-[12.5px] text-[var(--muted)]">{comment.body}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>

          {/* Per-client table */}
          <div className="mt-4">
            <Panel title="By client">
              {m.perBrand.length === 0 ? (
                <p className="py-4 text-center text-[13px] text-[var(--muted)]">No clients yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="text-left text-[11px] uppercase tracking-wide text-[var(--muted)]">
                        <th className="pb-2 font-medium">Client</th>
                        <th className="pb-2 text-right font-medium">Posts</th>
                        <th className="pb-2 text-right font-medium">Awaiting</th>
                        <th className="pb-2 text-right font-medium">Approved</th>
                        <th className="pb-2 text-right font-medium">Published</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {m.perBrand.map(({ brand, total, awaiting, approved, published }) => (
                        <tr key={brand.id}>
                          <td className="py-2">
                            <BrandDot brand={brand} />
                          </td>
                          <td className="py-2 text-right tabular-nums">{total}</td>
                          <td className="py-2 text-right tabular-nums" style={awaiting ? { color: STATUSES.needs_approval.color } : undefined}>
                            {awaiting}
                          </td>
                          <td className="py-2 text-right tabular-nums" style={approved ? { color: STATUSES.approved.color } : undefined}>
                            {approved}
                          </td>
                          <td className="py-2 text-right tabular-nums">{published}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>
          </div>
        </>
      )}
    </main>
  );
}
