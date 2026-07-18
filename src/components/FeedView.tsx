"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import type { PostDTO, BrandDTO } from "@/lib/types";
import { PLATFORMS, type Platform } from "@/lib/platforms";
import { PlatformIcon } from "./icons";
import { MediaTile } from "./PostCard";
import { cn } from "@/lib/utils";
import { Heart, MessageCircle, Repeat2, ThumbsUp } from "lucide-react";

/**
 * Per-channel feed preview: how the brand's grid/feed will actually look,
 * combining published and upcoming posts (upcoming are labeled).
 */
export function FeedView({
  posts,
  brands,
  initialBrandId,
  feedPlatform,
  onPlatformChange,
  onOpen,
}: {
  posts: PostDTO[];
  brands: BrandDTO[];
  initialBrandId: string | null;
  feedPlatform: Platform | null;
  onPlatformChange: (p: Platform) => void;
  onOpen: (id: string) => void;
}) {
  const [brandId, setBrandId] = useState<string | null>(initialBrandId ?? brands[0]?.id ?? null);
  const brand = brands.find((b) => b.id === brandId) ?? brands[0];

  const platforms = useMemo(
    () => (brand ? brand.channels.map((c) => c.platform) : []),
    [brand]
  );
  const platform: Platform | null = platforms.includes(feedPlatform as Platform)
    ? (feedPlatform as Platform)
    : platforms[0] ?? null;

  const feedPosts = useMemo(() => {
    if (!brand || !platform) return [];
    return posts
      .filter((p) => p.brandId === brand.id && p.variants.some((v) => v.platform === platform) && p.scheduledAt)
      .sort((a, b) => (a.scheduledAt! > b.scheduledAt! ? -1 : 1));
  }, [posts, brand, platform]);

  if (!brand) return null;
  const meta = platform ? PLATFORMS[platform] : null;

  function copyFor(p: PostDTO) {
    return p.variants.find((v) => v.platform === platform)?.copy ?? "";
  }

  const upcoming = (p: PostDTO) => p.status !== "published";

  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden">
      <div className="flex flex-wrap items-center gap-2">
        {brands.map((b) => (
          <button
            key={b.id}
            onClick={() => setBrandId(b.id)}
            className={cn(
              "flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              b.id === brand.id
                ? "border-transparent text-white"
                : "border-[var(--border)] bg-[var(--panel)] text-[var(--muted)] hover:text-[var(--text)]"
            )}
            style={b.id === brand.id ? { background: b.accentColor } : undefined}
          >
            <span className="h-2 w-2 rounded-full" style={{ background: b.id === brand.id ? "white" : b.accentColor }} />
            {b.name}
          </button>
        ))}
        <div className="mx-2 h-5 w-px bg-[var(--border)] max-sm:hidden" />
        {platforms.map((p) => (
          <button
            key={p}
            onClick={() => onPlatformChange(p)}
            className={cn(
              "flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
              p === platform
                ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                : "border-[var(--border)] bg-[var(--panel)] text-[var(--muted)] hover:text-[var(--text)]"
            )}
          >
            <PlatformIcon platform={p} size={12} />
            {PLATFORMS[p].label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4">
        {!platform || feedPosts.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-[var(--muted)]">
            Nothing scheduled for this channel yet.
          </div>
        ) : meta!.media === "square" || meta!.media === "vertical" ? (
          // Instagram / TikTok grid
          <div className="mx-auto grid max-w-md grid-cols-3 gap-1">
            {feedPosts.map((p) => (
              <button key={p.id} onClick={() => onOpen(p.id)} className="group relative cursor-pointer">
                <MediaTile brand={brand} emoji={p.mediaEmoji} ratio={meta!.media === "vertical" ? "vertical" : "square"} className="rounded-sm" />
                {upcoming(p) && (
                  <span className="absolute left-1 top-1 rounded bg-black/60 px-1 py-px text-[9px] font-semibold uppercase text-white">
                    {format(new Date(p.scheduledAt!), "MMM d")}
                  </span>
                )}
                <span className="absolute inset-0 flex items-end bg-black/0 p-1.5 opacity-0 transition-opacity group-hover:bg-black/40 group-hover:opacity-100">
                  <span className="line-clamp-2 text-left text-[10px] font-medium text-white">{p.title}</span>
                </span>
              </button>
            ))}
          </div>
        ) : meta!.media === "wide" ? (
          // YouTube / Facebook
          <div className="mx-auto flex max-w-lg flex-col gap-4">
            {feedPosts.map((p) => (
              <button key={p.id} onClick={() => onOpen(p.id)} className="cursor-pointer text-left">
                <MediaTile brand={brand} emoji={p.mediaEmoji} ratio="wide" />
                <div className="mt-1.5 flex items-start gap-2">
                  <span
                    className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                    style={{ background: brand.accentColor }}
                  >
                    {brand.name.slice(0, 1)}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-semibold">{p.title}</div>
                    <div className="text-[11px] text-[var(--muted)]">
                      {brand.name} · {upcoming(p) ? `scheduled ${format(new Date(p.scheduledAt!), "MMM d")}` : format(new Date(p.scheduledAt!), "MMM d")}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          // X / LinkedIn text feed
          <div className="mx-auto flex max-w-lg flex-col">
            {feedPosts.map((p) => (
              <button
                key={p.id}
                onClick={() => onOpen(p.id)}
                className="cursor-pointer border-b border-[var(--border)] py-3 text-left last:border-b-0"
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ background: brand.accentColor }}
                  >
                    {brand.name.slice(0, 1)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-[13px]">
                      <span className="font-semibold">{brand.name}</span>
                      <span className="text-[var(--muted)]">
                        {brand.handle} · {upcoming(p) ? `📅 ${format(new Date(p.scheduledAt!), "MMM d, HH:mm")}` : format(new Date(p.scheduledAt!), "MMM d")}
                      </span>
                    </div>
                    <div className="mt-0.5 whitespace-pre-wrap text-[13px] leading-snug">{copyFor(p) || p.title}</div>
                    <div className="mt-2 flex max-w-56 items-center justify-between text-[var(--muted)]">
                      <MessageCircle size={13} />
                      {platform === "x" ? <Repeat2 size={14} /> : <ThumbsUp size={13} />}
                      <Heart size={13} />
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
