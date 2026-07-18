"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Send, Trash2, X, CheckCircle2, Rocket, Link as LinkIcon } from "lucide-react";
import type { PostDTO, BrandDTO } from "@/lib/types";
import { CONTENT_TYPES, PLATFORMS, STATUSES, STATUS_ORDER, type Platform, type PostStatus } from "@/lib/platforms";
import { PlatformIcon } from "./icons";
import { MediaTile } from "./PostCard";
import { Badge, Button, Input, Select, Textarea } from "./ui";
import { cn } from "@/lib/utils";
import { useData } from "@/lib/store";

/** Render @mentions in accent color. */
function CommentBody({ body }: { body: string }) {
  const parts = body.split(/(@[\w.]+)/g);
  return (
    <span>
      {parts.map((part, i) =>
        part.startsWith("@") ? (
          <span key={i} className="font-medium text-[var(--accent)]">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}

export function PostDrawer({
  post,
  brand,
  shareToken,
  onClose,
}: {
  post: PostDTO;
  brand: BrandDTO;
  shareToken: string | null;
  onClose: () => void;
}) {
  const { updatePost, deletePost, addComment, publishNow } = useData();

  const [title, setTitle] = useState(post.title);
  const [variants, setVariants] = useState(post.variants.map((v) => ({ platform: v.platform, copy: v.copy })));
  const [activeTab, setActiveTab] = useState<Platform | null>(post.variants[0]?.platform ?? null);
  const [comment, setComment] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [copied, setCopied] = useState(false);
  // Local editing state is seeded from the post above; the drawer is keyed by
  // post id at the call site so opening a different post remounts it fresh.

  const status = STATUSES[post.status];
  const dirty =
    title !== post.title ||
    JSON.stringify(variants) !== JSON.stringify(post.variants.map((v) => ({ platform: v.platform, copy: v.copy })));

  const activeVariant = variants.find((v) => v.platform === activeTab);
  const activeMeta = activeTab ? PLATFORMS[activeTab] : null;
  const brandPlatforms = brand.channels.map((c) => c.platform);

  function save() {
    updatePost(post.id, { title, variants });
  }

  function togglePlatform(p: Platform) {
    if (variants.some((v) => v.platform === p)) {
      const next = variants.filter((v) => v.platform !== p);
      setVariants(next);
      if (activeTab === p) setActiveTab(next[0]?.platform ?? null);
    } else {
      setVariants([...variants, { platform: p, copy: variants[0]?.copy ?? "" }]);
      setActiveTab(p);
    }
  }

  const scheduledLocal = useMemo(
    () => (post.scheduledAt ? format(new Date(post.scheduledAt), "yyyy-MM-dd'T'HH:mm") : ""),
    [post.scheduledAt]
  );

  return (
    <aside className="slide-in fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col border-l border-[var(--border)] bg-[var(--panel)] shadow-2xl">
      <header className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: brand.accentColor }} />
        <span className="text-xs font-medium text-[var(--muted)]">{brand.name}</span>
        <Badge color={status.color} bg={status.bg}>
          {status.label}
        </Badge>
        {post.approvalState === "pending" && (
          <Badge color="#d97706" bg="rgba(217,119,6,.12)">
            awaiting client
          </Badge>
        )}
        {post.approvalState === "approved" && (
          <Badge color="#059669" bg="rgba(5,150,105,.12)">
            client ✓
          </Badge>
        )}
        {post.approvalState === "changes_requested" && (
          <Badge color="#dc2626" bg="rgba(220,38,38,.12)">
            changes requested
          </Badge>
        )}
        <button onClick={onClose} className="ml-auto cursor-pointer rounded-md p-1 text-[var(--muted)] hover:bg-[var(--panel2)]" aria-label="Close">
          <X size={16} />
        </button>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} className="text-sm font-semibold" aria-label="Post title" />

        <div className="flex gap-3">
          <MediaTile brand={brand} emoji={post.mediaEmoji} className="h-20 w-20 shrink-0" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="flex gap-2">
              <Select
                value={post.status}
                onChange={(e) => {
                  const s = e.target.value as PostStatus;
                  updatePost(post.id, {
                    status: s,
                    ...(s === "needs_approval" ? { approvalState: "pending" } : {}),
                  });
                }}
                className="h-8 flex-1 text-xs"
                aria-label="Status"
              >
                {STATUS_ORDER.map((s) => (
                  <option key={s} value={s}>
                    {STATUSES[s].label}
                  </option>
                ))}
              </Select>
              <Select
                value={post.contentType}
                onChange={(e) => updatePost(post.id, { contentType: e.target.value })}
                className="h-8 flex-1 text-xs"
                aria-label="Content type"
              >
                {CONTENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </div>
            <Input
              type="datetime-local"
              value={scheduledLocal}
              onChange={(e) =>
                updatePost(post.id, { scheduledAt: e.target.value ? new Date(e.target.value).toISOString() : null })
              }
              className="h-8 text-xs"
              aria-label="Scheduled time"
            />
          </div>
        </div>

        {/* channel variants */}
        <section>
          <div className="mb-1.5 flex items-center justify-between">
            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">Channels</h3>
            <span className="text-[10px] text-[var(--muted)]">one idea, tailored per platform</span>
          </div>
          <div className="mb-2 flex flex-wrap gap-1">
            {brandPlatforms.map((p) => {
              const on = variants.some((v) => v.platform === p);
              return (
                <button
                  key={p}
                  onClick={() => togglePlatform(p)}
                  className={cn(
                    "flex cursor-pointer items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium transition-colors",
                    on
                      ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                      : "border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]"
                  )}
                >
                  <PlatformIcon platform={p} size={11} />
                  {PLATFORMS[p].label}
                </button>
              );
            })}
          </div>
          {variants.length > 0 && (
            <>
              <div className="flex gap-1 border-b border-[var(--border)]">
                {variants.map((v) => (
                  <button
                    key={v.platform}
                    onClick={() => setActiveTab(v.platform)}
                    className={cn(
                      "flex cursor-pointer items-center gap-1 border-b-2 px-2 py-1.5 text-[11px] font-medium",
                      activeTab === v.platform
                        ? "border-[var(--accent)] text-[var(--accent)]"
                        : "border-transparent text-[var(--muted)] hover:text-[var(--text)]"
                    )}
                  >
                    <PlatformIcon platform={v.platform} size={11} />
                    {PLATFORMS[v.platform].label}
                  </button>
                ))}
              </div>
              {activeVariant && activeMeta && (
                <div className="mt-2">
                  <Textarea
                    rows={5}
                    value={activeVariant.copy}
                    placeholder={`Write the ${activeMeta.label} ${activeMeta.charLabel}…`}
                    onChange={(e) =>
                      setVariants(variants.map((v) => (v.platform === activeTab ? { ...v, copy: e.target.value } : v)))
                    }
                  />
                  <div
                    className={cn(
                      "mt-0.5 text-right font-mono text-[11px]",
                      activeVariant.copy.length > activeMeta.charLimit ? "font-bold text-red-500" : "text-[var(--muted)]"
                    )}
                  >
                    {activeVariant.copy.length.toLocaleString()}/{activeMeta.charLimit.toLocaleString()}
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        {dirty && (
          <Button variant="primary" size="sm" onClick={save} className="w-full">
            Save changes
          </Button>
        )}

        {/* approval + publish actions */}
        <section className="flex flex-wrap gap-2">
          {post.status !== "needs_approval" && post.status !== "published" && (
            <Button
              size="sm"
              onClick={() => updatePost(post.id, { status: "needs_approval", approvalState: "pending" })}
            >
              <Send size={12} /> Request approval
            </Button>
          )}
          {post.status === "needs_approval" && (
            <Button size="sm" variant="success" onClick={() => updatePost(post.id, { status: "approved", approvalState: "approved" })}>
              <CheckCircle2 size={12} /> Mark approved
            </Button>
          )}
          {(post.status === "approved" || post.status === "scheduled") && (
            <>
              {post.status === "approved" && (
                <Button size="sm" onClick={() => updatePost(post.id, { status: "scheduled" })}>
                  Schedule
                </Button>
              )}
              <Button
                size="sm"
                variant="primary"
                disabled={publishing}
                onClick={async () => {
                  setPublishing(true);
                  try {
                    await publishNow(post.id);
                  } finally {
                    setPublishing(false);
                  }
                }}
              >
                <Rocket size={12} /> {publishing ? "Publishing…" : "Publish now"}
              </Button>
            </>
          )}
          {shareToken && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                navigator.clipboard.writeText(`${location.origin}/share/${shareToken}`);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
            >
              <LinkIcon size={12} /> {copied ? "Copied!" : "Copy client link"}
            </Button>
          )}
          <Button
            size="sm"
            variant="danger"
            className="ml-auto"
            onClick={() => {
              if (confirm("Delete this post?")) {
                deletePost(post.id);
                onClose();
              }
            }}
          >
            <Trash2 size={12} />
          </Button>
        </section>

        {/* comments */}
        <section>
          <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
            Comments ({post.comments.length})
          </h3>
          <div className="space-y-2">
            {post.comments.map((c) => (
              <div
                key={c.id}
                className={cn(
                  "rounded-lg border px-3 py-2 text-[12px]",
                  c.authorType === "client"
                    ? "border-amber-500/30 bg-amber-500/8"
                    : "border-[var(--border)] bg-[var(--panel2)]/60"
                )}
              >
                <div className="mb-0.5 flex items-center gap-1.5">
                  <span className="font-semibold">{c.author}</span>
                  {c.authorType === "client" && (
                    <span className="rounded bg-amber-500/20 px-1 text-[9px] font-semibold uppercase text-amber-600">client</span>
                  )}
                  <span className="ml-auto text-[10px] text-[var(--muted)]">{format(new Date(c.createdAt), "MMM d, HH:mm")}</span>
                </div>
                <CommentBody body={c.body} />
              </div>
            ))}
          </div>
          <form
            className="mt-2 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!comment.trim()) return;
              addComment(post.id, comment.trim());
              setComment("");
            }}
          >
            <Input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Comment — use @name to mention"
              className="h-8 text-xs"
            />
            <Button size="sm" type="submit" variant="primary">
              <Send size={12} />
            </Button>
          </form>
        </section>
      </div>
    </aside>
  );
}
