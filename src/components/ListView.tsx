"use client";

import { useMemo } from "react";
import { format, isToday, isTomorrow } from "date-fns";
import type { PostDTO, BrandDTO } from "@/lib/types";
import { STATUSES, STATUS_ORDER, type PostStatus } from "@/lib/platforms";
import { PlatformIcon } from "./icons";
import { ApprovalDot } from "./PostCard";
import { Badge, Button, Select } from "./ui";
import { MessageSquare, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

function dayLabel(d: Date) {
  if (isToday(d)) return "Today";
  if (isTomorrow(d)) return "Tomorrow";
  return format(d, "EEEE, MMM d");
}

export function ListView({
  posts,
  brands,
  selection,
  onToggleSelect,
  onSelectMany,
  onClearSelection,
  onOpen,
  onBulk,
}: {
  posts: PostDTO[];
  brands: BrandDTO[];
  selection: string[];
  onToggleSelect: (id: string) => void;
  onSelectMany: (ids: string[]) => void;
  onClearSelection: () => void;
  onOpen: (id: string) => void;
  onBulk: (ids: string[], action: "status" | "delete" | "shift", extra?: { status?: PostStatus; shiftDays?: number }) => void;
}) {
  const brandById = useMemo(() => new Map(brands.map((b) => [b.id, b])), [brands]);

  const groups = useMemo(() => {
    const scheduled = posts
      .filter((p) => p.scheduledAt)
      .sort((a, b) => (a.scheduledAt! < b.scheduledAt! ? -1 : 1));
    const unscheduled = posts.filter((p) => !p.scheduledAt);
    const m = new Map<string, PostDTO[]>();
    for (const p of scheduled) {
      const key = format(new Date(p.scheduledAt!), "yyyy-MM-dd");
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(p);
    }
    return { byDay: m, unscheduled };
  }, [posts]);

  const allIds = posts.map((p) => p.id);
  const allSelected = selection.length > 0 && selection.length === allIds.length;

  function Row({ post }: { post: PostDTO }) {
    const brand = brandById.get(post.brandId);
    if (!brand) return null;
    const status = STATUSES[post.status];
    const checked = selection.includes(post.id);
    return (
      <div
        className={cn(
          "flex cursor-pointer items-center gap-3 border-b border-[var(--border)] px-3 py-2 transition-colors hover:bg-[var(--panel2)]/70",
          checked && "bg-[var(--accent)]/8"
        )}
        onClick={() => onOpen(post.id)}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={() => onToggleSelect(post.id)}
          onClick={(e) => e.stopPropagation()}
          className="h-3.5 w-3.5 shrink-0 cursor-pointer accent-[var(--accent)]"
          aria-label={`Select ${post.title}`}
        />
        <span className="w-11 shrink-0 font-mono text-[11px] text-[var(--muted)]">
          {post.scheduledAt ? format(new Date(post.scheduledAt), "HH:mm") : "—"}
        </span>
        <span className="flex w-32 shrink-0 items-center gap-1.5 truncate text-xs" title={brand.name}>
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: brand.accentColor }} />
          <span className="truncate text-[var(--muted)]">{brand.name}</span>
        </span>
        <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{post.title}</span>
        <span className="hidden items-center gap-1 text-[var(--muted)] sm:flex">
          {post.variants.map((v) => (
            <PlatformIcon key={v.id} platform={v.platform} size={12} />
          ))}
        </span>
        {post.comments.length > 0 && (
          <span className="hidden items-center gap-0.5 text-[11px] text-[var(--muted)] sm:flex">
            <MessageSquare size={11} />
            {post.comments.length}
          </span>
        )}
        <ApprovalDot post={post} />
        <Badge color={status.color} bg={status.bg} className="w-28 justify-center max-sm:hidden">
          {status.label}
        </Badge>
      </div>
    );
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--panel)]">
      <div className="flex items-center gap-3 border-b border-[var(--border)] bg-[var(--panel2)]/60 px-3 py-2">
        <input
          type="checkbox"
          checked={allSelected}
          onChange={() => (allSelected ? onClearSelection() : onSelectMany(allIds))}
          className="h-3.5 w-3.5 cursor-pointer accent-[var(--accent)]"
          aria-label="Select all"
        />
        <span className="text-[11px] font-medium text-[var(--muted)]">
          {selection.length > 0 ? `${selection.length} selected` : `${posts.length} posts`}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto pb-16">
        {[...groups.byDay.entries()].map(([key, list]) => (
          <div key={key}>
            <div className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--panel2)] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
              {dayLabel(new Date(key + "T00:00"))}
            </div>
            {list.map((p) => (
              <Row key={p.id} post={p} />
            ))}
          </div>
        ))}
        {groups.unscheduled.length > 0 && (
          <div>
            <div className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--panel2)] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
              Unscheduled
            </div>
            {groups.unscheduled.map((p) => (
              <Row key={p.id} post={p} />
            ))}
          </div>
        )}
        {posts.length === 0 && (
          <div className="p-8 text-center text-sm text-[var(--muted)]">No posts match the current filters.</div>
        )}
      </div>

      {selection.length > 0 && (
        <div className="fade-up absolute inset-x-3 bottom-3 z-20 flex flex-wrap items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3 py-2 shadow-xl">
          <span className="text-xs font-semibold">{selection.length} selected</span>
          <Select
            className="h-7 text-xs"
            defaultValue=""
            onChange={(e) => {
              if (!e.target.value) return;
              onBulk(selection, "status", { status: e.target.value as PostStatus });
              e.target.value = "";
            }}
            aria-label="Set status"
          >
            <option value="" disabled>
              Set status…
            </option>
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {STATUSES[s].label}
              </option>
            ))}
          </Select>
          <Button size="sm" onClick={() => onBulk(selection, "shift", { shiftDays: 1 })}>
            +1 day
          </Button>
          <Button size="sm" onClick={() => onBulk(selection, "shift", { shiftDays: 7 })}>
            +1 week
          </Button>
          <Button size="sm" onClick={() => onBulk(selection, "shift", { shiftDays: -1 })}>
            −1 day
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => {
              if (confirm(`Delete ${selection.length} post(s)?`)) onBulk(selection, "delete");
            }}
          >
            <Trash2 size={12} /> Delete
          </Button>
          <Button size="sm" variant="ghost" className="ml-auto" onClick={onClearSelection}>
            Clear
          </Button>
        </div>
      )}
    </div>
  );
}
