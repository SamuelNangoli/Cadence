"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { Plus } from "lucide-react";
import type { PostDTO, BrandDTO } from "@/lib/types";
import { PostCard } from "./PostCard";
import { Modal } from "./ui";
import { cn } from "@/lib/utils";

function DraggablePost({
  post,
  brand,
  density,
  onOpen,
}: {
  post: PostDTO;
  brand: BrandDTO;
  density: "compact" | "comfortable";
  onOpen: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: post.id });
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} className="touch-none">
      <PostCard
        post={post}
        brand={brand}
        density={density}
        context="month"
        dragging={isDragging}
        onClick={() => onOpen(post.id)}
      />
    </div>
  );
}

function DayCell({
  day,
  cursor,
  posts,
  brandById,
  density,
  onOpen,
  onQuickAdd,
  onShowAll,
}: {
  day: Date;
  cursor: Date;
  posts: PostDTO[];
  brandById: Map<string, BrandDTO>;
  density: "compact" | "comfortable";
  onOpen: (id: string) => void;
  onQuickAdd: (iso: string) => void;
  onShowAll: (day: Date) => void;
}) {
  const iso = format(day, "yyyy-MM-dd");
  const { setNodeRef, isOver } = useDroppable({ id: `day:${iso}` });
  const today = isSameDay(day, new Date());
  const inMonth = isSameMonth(day, cursor);
  const max = density === "compact" ? 4 : 2;
  const shown = posts.slice(0, max);
  const extra = posts.length - shown.length;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "group relative flex min-h-[7.5rem] flex-col gap-1 border-b border-r border-[var(--grid)] p-1.5 transition-colors",
        !inMonth && "bg-[var(--panel2)]/50 opacity-60",
        today && "bg-[var(--today)]",
        isOver && "bg-[var(--accent)]/10 ring-2 ring-inset ring-[var(--accent)]/40"
      )}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded-full text-[11px]",
            today ? "bg-[var(--accent)] font-semibold text-white" : "text-[var(--muted)]"
          )}
        >
          {format(day, "d")}
        </span>
        <button
          onClick={() => onQuickAdd(`${iso}T09:00`)}
          className="rounded p-0.5 text-[var(--muted)] opacity-0 transition-opacity hover:bg-[var(--panel2)] group-hover:opacity-100 cursor-pointer"
          aria-label={`Add post on ${iso}`}
        >
          <Plus size={13} />
        </button>
      </div>
      {shown.map((p) => {
        const brand = brandById.get(p.brandId);
        if (!brand) return null;
        return <DraggablePost key={p.id} post={p} brand={brand} density={density} onOpen={onOpen} />;
      })}
      {extra > 0 && (
        <button
          onClick={() => onShowAll(day)}
          className="rounded px-1.5 text-left text-[11px] font-medium text-[var(--accent)] hover:underline cursor-pointer"
        >
          +{extra} more
        </button>
      )}
    </div>
  );
}

export function MonthView({
  cursor,
  posts,
  brands,
  density,
  onOpen,
  onQuickAdd,
  onReschedule,
}: {
  cursor: Date;
  posts: PostDTO[];
  brands: BrandDTO[];
  density: "compact" | "comfortable";
  onOpen: (id: string) => void;
  onQuickAdd: (iso: string) => void;
  onReschedule: (id: string, newDate: Date) => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dayModal, setDayModal] = useState<Date | null>(null);

  const brandById = useMemo(() => new Map(brands.map((b) => [b.id, b])), [brands]);
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const byDay = useMemo(() => {
    const m = new Map<string, PostDTO[]>();
    for (const p of posts) {
      if (!p.scheduledAt) continue;
      const key = format(new Date(p.scheduledAt), "yyyy-MM-dd");
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(p);
    }
    for (const list of m.values()) {
      list.sort((a, b) => (a.scheduledAt! < b.scheduledAt! ? -1 : 1));
    }
    return m;
  }, [posts]);

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const over = e.over?.id as string | undefined;
    if (!over?.startsWith("day:")) return;
    const post = posts.find((p) => p.id === e.active.id);
    if (!post) return;
    const target = new Date(over.slice(4) + "T00:00");
    const old = post.scheduledAt ? new Date(post.scheduledAt) : new Date();
    target.setHours(old.getHours(), old.getMinutes(), 0, 0);
    onReschedule(post.id, target);
  }

  const activePost = activeId ? posts.find((p) => p.id === activeId) : null;
  const activeBrand = activePost ? brandById.get(activePost.brandId) : null;
  const dayModalPosts = dayModal ? byDay.get(format(dayModal, "yyyy-MM-dd")) ?? [] : [];

  // Keep the weekday header aligned with the scrolling grid by padding it to
  // match the vertical scrollbar's width (0 when the OS uses overlay scrollbars).
  const scrollRef = useRef<HTMLDivElement>(null);
  const [gutter, setGutter] = useState(0);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    // Fires immediately on observe, and again whenever the grid resizes or the
    // scrollbar appears/disappears as posts are added.
    const measure = () => setGutter(el.offsetWidth - el.clientWidth);
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={(e: DragStartEvent) => setActiveId(String(e.active.id))}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="flex h-full flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--panel)]">
        <div className="grid grid-cols-7 border-b border-[var(--grid)]" style={{ paddingRight: gutter }}>
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="border-r border-[var(--grid)] px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)] last:border-r-0">
              {d}
            </div>
          ))}
        </div>
        <div ref={scrollRef} className="grid flex-1 auto-rows-fr grid-cols-7 overflow-y-auto">
          {days.map((day) => (
            <DayCell
              key={day.toISOString()}
              day={day}
              cursor={cursor}
              posts={byDay.get(format(day, "yyyy-MM-dd")) ?? []}
              brandById={brandById}
              density={density}
              onOpen={onOpen}
              onQuickAdd={onQuickAdd}
              onShowAll={setDayModal}
            />
          ))}
        </div>
      </div>

      <DragOverlay>
        {activePost && activeBrand && (
          <div className="w-48 rotate-2 opacity-90 shadow-xl">
            <PostCard post={activePost} brand={activeBrand} density={density} context="month" />
          </div>
        )}
      </DragOverlay>

      <Modal open={!!dayModal} onClose={() => setDayModal(null)} title={dayModal ? format(dayModal, "EEEE, MMMM d") : ""}>
        <div className="flex flex-col gap-1.5">
          {dayModalPosts.map((p) => {
            const brand = brandById.get(p.brandId);
            if (!brand) return null;
            return (
              <PostCard
                key={p.id}
                post={p}
                brand={brand}
                density="comfortable"
                context="kanban"
                onClick={() => {
                  setDayModal(null);
                  onOpen(p.id);
                }}
              />
            );
          })}
        </div>
      </Modal>
    </DndContext>
  );
}
