"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";
import { addDays, format, isSameDay, startOfWeek } from "date-fns";
import type { PostDTO, BrandDTO } from "@/lib/types";
import { PostCard } from "./PostCard";
import { cn } from "@/lib/utils";

const HOURS = Array.from({ length: 16 }, (_, i) => i + 6); // 06:00–21:00

function DraggablePost({
  post,
  brand,
  onOpen,
}: {
  post: PostDTO;
  brand: BrandDTO;
  onOpen: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: post.id });
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} className="touch-none">
      <PostCard post={post} brand={brand} density="compact" context="week" dragging={isDragging} onClick={() => onOpen(post.id)} />
    </div>
  );
}

function HourCell({
  day,
  hour,
  posts,
  brandById,
  onOpen,
  onQuickAdd,
}: {
  day: Date;
  hour: number;
  posts: PostDTO[];
  brandById: Map<string, BrandDTO>;
  onOpen: (id: string) => void;
  onQuickAdd: (iso: string) => void;
}) {
  const iso = format(day, "yyyy-MM-dd");
  const { setNodeRef, isOver } = useDroppable({ id: `slot:${iso}:${hour}` });
  return (
    <div
      ref={setNodeRef}
      onDoubleClick={() => onQuickAdd(`${iso}T${String(hour).padStart(2, "0")}:00`)}
      className={cn(
        "min-h-9 border-b border-r border-[var(--grid)] p-0.5",
        isOver && "bg-[var(--accent)]/10 ring-2 ring-inset ring-[var(--accent)]/40"
      )}
    >
      {posts.map((p) => {
        const brand = brandById.get(p.brandId);
        if (!brand) return null;
        return <DraggablePost key={p.id} post={p} brand={brand} onOpen={onOpen} />;
      })}
    </div>
  );
}

export function WeekView({
  cursor,
  posts,
  brands,
  onOpen,
  onQuickAdd,
  onReschedule,
}: {
  cursor: Date;
  posts: PostDTO[];
  brands: BrandDTO[];
  onOpen: (id: string) => void;
  onQuickAdd: (iso: string) => void;
  onReschedule: (id: string, newDate: Date) => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const [activeId, setActiveId] = useState<string | null>(null);
  const brandById = useMemo(() => new Map(brands.map((b) => [b.id, b])), [brands]);
  const days = useMemo(() => {
    const start = startOfWeek(cursor, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [cursor]);

  const cellPosts = useMemo(() => {
    const m = new Map<string, PostDTO[]>();
    for (const p of posts) {
      if (!p.scheduledAt) continue;
      const d = new Date(p.scheduledAt);
      const key = `${format(d, "yyyy-MM-dd")}:${d.getHours()}`;
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(p);
    }
    return m;
  }, [posts]);

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const over = e.over?.id as string | undefined;
    if (!over?.startsWith("slot:")) return;
    const [, iso, hourStr] = over.split(":");
    const post = posts.find((p) => p.id === e.active.id);
    if (!post) return;
    const target = new Date(iso + "T00:00");
    const old = post.scheduledAt ? new Date(post.scheduledAt) : null;
    target.setHours(Number(hourStr), old?.getMinutes() ?? 0, 0, 0);
    onReschedule(post.id, target);
  }

  const activePost = activeId ? posts.find((p) => p.id === activeId) : null;
  const activeBrand = activePost ? brandById.get(activePost.brandId) : null;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={(e) => setActiveId(String(e.active.id))}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="flex h-full flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--panel)]">
        <div className="grid shrink-0 grid-cols-[3rem_repeat(7,1fr)] border-b border-[var(--grid)]">
          <div className="border-r border-[var(--grid)]" />
          {days.map((d) => (
            <div
              key={d.toISOString()}
              className={cn(
                "border-r border-[var(--grid)] px-2 py-1.5 text-center text-[11px] font-semibold last:border-r-0",
                isSameDay(d, new Date()) ? "text-[var(--accent)]" : "text-[var(--muted)]"
              )}
            >
              {format(d, "EEE d")}
            </div>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-[3rem_repeat(7,1fr)]">
            {HOURS.map((h) => (
              <div key={h} className="contents">
                <div className="border-b border-r border-[var(--grid)] px-1 py-0.5 text-right font-mono text-[10px] text-[var(--muted)]">
                  {String(h).padStart(2, "0")}:00
                </div>
                {days.map((d) => (
                  <HourCell
                    key={`${d.toISOString()}-${h}`}
                    day={d}
                    hour={h}
                    posts={cellPosts.get(`${format(d, "yyyy-MM-dd")}:${h}`) ?? []}
                    brandById={brandById}
                    onOpen={onOpen}
                    onQuickAdd={onQuickAdd}
                  />
                ))}
              </div>
            ))}
          </div>
          <p className="px-3 py-2 text-[11px] text-[var(--muted)]">Double-click a cell to create a post there. Drag cards to reschedule.</p>
        </div>
      </div>
      <DragOverlay>
        {activePost && activeBrand && (
          <div className="w-44 rotate-2 opacity-90 shadow-xl">
            <PostCard post={activePost} brand={activeBrand} density="compact" context="week" />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
