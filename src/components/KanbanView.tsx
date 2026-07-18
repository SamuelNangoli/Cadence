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
import type { PostDTO, BrandDTO } from "@/lib/types";
import { STATUSES, STATUS_ORDER, type PostStatus } from "@/lib/platforms";
import { PostCard } from "./PostCard";
import { cn } from "@/lib/utils";

function DraggableCard({
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
      <PostCard post={post} brand={brand} density={density} context="kanban" dragging={isDragging} onClick={() => onOpen(post.id)} />
    </div>
  );
}

function Column({
  status,
  posts,
  brandById,
  density,
  onOpen,
}: {
  status: PostStatus;
  posts: PostDTO[];
  brandById: Map<string, BrandDTO>;
  density: "compact" | "comfortable";
  onOpen: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `status:${status}` });
  const meta = STATUSES[status];
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-64 shrink-0 flex-col rounded-xl border border-[var(--border)] bg-[var(--panel2)]/60",
        isOver && "ring-2 ring-[var(--accent)]/50"
      )}
    >
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: meta.color }} />
        <span className="text-xs font-semibold">{meta.label}</span>
        <span className="ml-auto rounded-full bg-[var(--panel)] px-1.5 text-[11px] text-[var(--muted)]">{posts.length}</span>
      </div>
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2">
        {posts.map((p) => {
          const brand = brandById.get(p.brandId);
          if (!brand) return null;
          return <DraggableCard key={p.id} post={p} brand={brand} density={density} onOpen={onOpen} />;
        })}
        {posts.length === 0 && (
          <div className="rounded-lg border border-dashed border-[var(--border)] p-3 text-center text-[11px] text-[var(--muted)]">
            Drop cards here
          </div>
        )}
      </div>
    </div>
  );
}

export function KanbanView({
  posts,
  brands,
  density,
  onOpen,
  onStatusChange,
}: {
  posts: PostDTO[];
  brands: BrandDTO[];
  density: "compact" | "comfortable";
  onOpen: (id: string) => void;
  onStatusChange: (id: string, status: PostStatus) => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const [activeId, setActiveId] = useState<string | null>(null);
  const brandById = useMemo(() => new Map(brands.map((b) => [b.id, b])), [brands]);

  const byStatus = useMemo(() => {
    const m = new Map<PostStatus, PostDTO[]>();
    for (const s of STATUS_ORDER) m.set(s, []);
    for (const p of posts) m.get(p.status)?.push(p);
    for (const list of m.values()) {
      list.sort((a, b) => (a.scheduledAt ?? "9999") < (b.scheduledAt ?? "9999") ? -1 : 1);
    }
    return m;
  }, [posts]);

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const over = e.over?.id as string | undefined;
    if (!over?.startsWith("status:")) return;
    const status = over.slice(7) as PostStatus;
    const post = posts.find((p) => p.id === e.active.id);
    if (!post || post.status === status) return;
    onStatusChange(post.id, status);
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
      <div className="flex h-full gap-3 overflow-x-auto pb-2">
        {STATUS_ORDER.map((s) => (
          <Column key={s} status={s} posts={byStatus.get(s) ?? []} brandById={brandById} density={density} onOpen={onOpen} />
        ))}
      </div>
      <DragOverlay>
        {activePost && activeBrand && (
          <div className="w-60 rotate-2 opacity-90 shadow-xl">
            <PostCard post={activePost} brand={activeBrand} density={density} context="kanban" />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
