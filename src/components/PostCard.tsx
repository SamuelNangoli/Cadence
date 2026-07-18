"use client";

import { cn } from "@/lib/utils";
import type { PostDTO, BrandDTO } from "@/lib/types";
import { PLATFORMS, STATUSES, type Platform } from "@/lib/platforms";
import { PlatformIcon } from "./icons";
import { MessageSquare, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { format } from "date-fns";

/** Gradient media tile derived from the brand accent — stands in for uploads. */
export function MediaTile({
  brand,
  emoji,
  className,
  ratio = "square",
}: {
  brand: BrandDTO;
  emoji: string;
  className?: string;
  ratio?: "square" | "vertical" | "wide";
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center overflow-hidden rounded-md",
        ratio === "square" && "aspect-square",
        ratio === "vertical" && "aspect-[9/16]",
        ratio === "wide" && "aspect-video",
        className
      )}
      style={{
        background: `linear-gradient(135deg, ${brand.accentColor}33, ${brand.accentColor}99)`,
      }}
    >
      <span className="select-none text-2xl">{emoji || "📄"}</span>
    </div>
  );
}

export function ApprovalDot({ post }: { post: PostDTO }) {
  if (post.approvalState === "approved")
    return <CheckCircle2 size={12} className="shrink-0 text-emerald-600" aria-label="Client approved" />;
  if (post.approvalState === "pending")
    return <Clock size={12} className="shrink-0 text-amber-500" aria-label="Waiting on client" />;
  if (post.approvalState === "changes_requested")
    return <AlertCircle size={12} className="shrink-0 text-red-500" aria-label="Changes requested" />;
  return null;
}

/**
 * Channel-adaptive card. Compact month cell chips stay one line; comfortable
 * density and kanban context show media (IG/TikTok/YouTube), text + char count
 * (X), etc.
 */
export function PostCard({
  post,
  brand,
  density,
  context,
  onClick,
  dragging,
}: {
  post: PostDTO;
  brand: BrandDTO;
  density: "compact" | "comfortable";
  context: "month" | "week" | "kanban";
  onClick?: () => void;
  dragging?: boolean;
}) {
  const primary = (post.variants[0]?.platform ?? "instagram") as Platform;
  const meta = PLATFORMS[primary];
  const status = STATUSES[post.status];
  const time = post.scheduledAt ? format(new Date(post.scheduledAt), "HH:mm") : "";
  const xVariant = post.variants.find((v) => v.platform === "x");

  if (context === "kanban") {
    return (
      <div
        onClick={onClick}
        className={cn(
          "cursor-pointer rounded-xl border border-[var(--border)] bg-[var(--panel)] p-2.5 shadow-sm transition-shadow hover:shadow-md",
          dragging && "opacity-60 rotate-1"
        )}
        style={{ borderLeft: `3px solid ${brand.accentColor}` }}
      >
        {meta.media !== "text" && (
          <MediaTile brand={brand} emoji={post.mediaEmoji} ratio="wide" className="mb-2" />
        )}
        <div className="mb-1 flex items-center gap-1.5 text-[11px] text-[var(--muted)]">
          <span className="h-2 w-2 rounded-full" style={{ background: brand.accentColor }} />
          <span className="truncate">{brand.name}</span>
          <span className="ml-auto flex items-center gap-1">
            {post.variants.map((v) => (
              <PlatformIcon key={v.id} platform={v.platform} size={11} />
            ))}
          </span>
        </div>
        <div className="text-[13px] font-medium leading-snug">{post.title}</div>
        {primary === "x" && xVariant && (
          <div className="mt-1 line-clamp-2 text-[11px] text-[var(--muted)]">{xVariant.copy}</div>
        )}
        <div className="mt-1.5 flex items-center gap-2 text-[11px] text-[var(--muted)]">
          {post.scheduledAt && <span>{format(new Date(post.scheduledAt), "MMM d, HH:mm")}</span>}
          {primary === "x" && xVariant && (
            <span className={cn(xVariant.copy.length > 280 && "text-red-500 font-semibold")}>
              {xVariant.copy.length}/280
            </span>
          )}
          <span className="ml-auto flex items-center gap-1.5">
            {post.comments.length > 0 && (
              <span className="flex items-center gap-0.5">
                <MessageSquare size={11} />
                {post.comments.length}
              </span>
            )}
            <ApprovalDot post={post} />
          </span>
        </div>
      </div>
    );
  }

  // month / week chip
  const compact = density === "compact" || context === "week";
  // In the dense compact month grid the title is worth more than an inline time
  // (chips are already sorted chronologically; exact time lives in the drawer).
  const showTime = context === "week" || density === "comfortable";
  return (
    <div
      onClick={onClick}
      title={`${brand.name} — ${post.title}`}
      className={cn(
        "group/card cursor-pointer rounded-md border border-transparent text-left transition-colors",
        compact ? "px-1.5 py-[3px]" : "p-1.5",
        dragging && "opacity-60"
      )}
      style={{ background: status.bg }}
    >
      <div className="flex min-w-0 items-center gap-1">
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: brand.accentColor }} />
        {showTime && time && <span className="shrink-0 font-mono text-[10px] leading-4 tabular-nums text-[var(--muted)]">{time}</span>}
        <span className="min-w-0 flex-1 truncate text-[11px] font-medium leading-4" style={{ color: status.color }}>
          {post.title}
        </span>
        <span className="flex shrink-0 items-center gap-0.5">
          <ApprovalDot post={post} />
          <PlatformIcon platform={primary} size={10} className="text-[var(--muted)]" />
        </span>
      </div>
      {!compact && meta.media === "square" && (
        <div className="mt-1 flex items-center gap-1.5">
          <MediaTile brand={brand} emoji={post.mediaEmoji} className="h-8 w-8 shrink-0 rounded" />
          <span className="line-clamp-2 text-[10px] leading-3.5 text-[var(--muted)]">
            {post.variants[0]?.copy || "No copy yet"}
          </span>
        </div>
      )}
      {!compact && primary === "x" && xVariant && (
        <div className="mt-0.5 text-[10px] text-[var(--muted)]">
          <span className="line-clamp-2">{xVariant.copy}</span>
          <span className={cn("font-mono", xVariant.copy.length > 280 && "text-red-500 font-semibold")}>
            {xVariant.copy.length}/280
          </span>
        </div>
      )}
    </div>
  );
}
