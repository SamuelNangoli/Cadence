"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { BootstrapDTO, BrandDTO, PostDTO, SlotDTO, ShareLinkDTO, IdeaSuggestion, CommentDTO } from "./types";
import type { Platform, PostStatus } from "./platforms";

export type ViewKind = "month" | "week" | "list" | "kanban" | "feed";

/* ---------------------------------- UI prefs ---------------------------------- */

interface UIState {
  view: ViewKind;
  density: "compact" | "comfortable";
  theme: "light" | "dark";
  railOpen: boolean;
  mode: "all" | "single";
  singleBrandId: string | null;
  brandFilter: string[]; // empty = all brands
  channelFilter: Platform[]; // empty = all channels
  statusFilter: PostStatus[]; // empty = all statuses
  feedPlatform: Platform | null;

  // transient (not persisted)
  cursor: string; // ISO date the calendar is centered on
  openPostId: string | null;
  composer: { open: boolean; date?: string; brandId?: string };
  ideasOpen: boolean;
  clientsOpen: boolean;
  helpOpen: boolean;
  mobileRailOpen: boolean;
  selection: string[];

  set: (p: Partial<UIState>) => void;
  toggleBrand: (id: string) => void;
  toggleChannel: (p: Platform) => void;
  toggleStatus: (s: PostStatus) => void;
  clearSelection: () => void;
  toggleSelect: (id: string) => void;
}

export const useUI = create<UIState>()(
  persist(
    (set, get) => ({
      view: "month",
      density: "compact",
      theme: "light",
      railOpen: true,
      mode: "all",
      singleBrandId: null,
      brandFilter: [],
      channelFilter: [],
      statusFilter: [],
      feedPlatform: null,

      cursor: new Date().toISOString(),
      openPostId: null,
      composer: { open: false },
      ideasOpen: false,
      clientsOpen: false,
      helpOpen: false,
      mobileRailOpen: false,
      selection: [],

      set: (p) => set(p),
      toggleBrand: (id) => {
        const f = get().brandFilter;
        set({ brandFilter: f.includes(id) ? f.filter((x) => x !== id) : [...f, id] });
      },
      toggleChannel: (p) => {
        const f = get().channelFilter;
        set({ channelFilter: f.includes(p) ? f.filter((x) => x !== p) : [...f, p] });
      },
      toggleStatus: (s) => {
        const f = get().statusFilter;
        set({ statusFilter: f.includes(s) ? f.filter((x) => x !== s) : [...f, s] });
      },
      clearSelection: () => set({ selection: [] }),
      toggleSelect: (id) => {
        const sel = get().selection;
        set({ selection: sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id] });
      },
    }),
    {
      name: "cadence-ui",
      partialize: (s) => ({
        view: s.view,
        density: s.density,
        theme: s.theme,
        railOpen: s.railOpen,
        mode: s.mode,
        singleBrandId: s.singleBrandId,
        brandFilter: s.brandFilter,
        channelFilter: s.channelFilter,
        statusFilter: s.statusFilter,
        feedPlatform: s.feedPlatform,
      }),
    }
  )
);

/* ---------------------------------- Data ---------------------------------- */

async function json<T>(res: Response): Promise<T> {
  // Session expired mid-session — send them back to sign in rather than
  // surfacing a confusing error on every subsequent action.
  if (res.status === 401 && typeof window !== "undefined") {
    window.location.href = `/login?next=${encodeURIComponent(location.pathname)}`;
    throw new Error("Session expired.");
  }
  if (!res.ok) {
    // Prefer the API's own { error } message; fall back to raw text, and never
    // surface a whole HTML error page as the message.
    const raw = await res.text();
    let message = raw;
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.error) message = parsed.error;
    } catch {
      if (raw.trimStart().startsWith("<")) message = `Server error (${res.status})`;
    }
    throw new Error(message || `Request failed (${res.status})`);
  }
  return res.json();
}

/** Turn a fetch/API failure into something a user can act on. */
export function describeError(err: unknown): string {
  // fetch() rejects with a TypeError when the server can't be reached at all.
  if (err instanceof TypeError) {
    return "Can't reach the server — is the app still running? (npm run dev)";
  }
  return err instanceof Error && err.message ? err.message : "Something went wrong.";
}

interface DataState {
  loaded: boolean;
  error: string | null;
  workspace: { id: string; name: string; plan?: string; subscriptionStatus?: string | null } | null;
  brands: BrandDTO[];
  posts: PostDTO[];
  slots: SlotDTO[];
  shareLinks: ShareLinkDTO[];

  load: () => Promise<void>;
  createPost: (input: Record<string, unknown>) => Promise<PostDTO>;
  updatePost: (id: string, patch: Record<string, unknown>) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
  bulk: (ids: string[], action: "status" | "delete" | "shift", extra?: { status?: PostStatus; shiftDays?: number }) => Promise<void>;
  addComment: (postId: string, body: string, author?: string) => Promise<void>;
  publishNow: (postId: string) => Promise<void>;
  generateIdeas: (brandId: string, count?: number) => Promise<IdeaSuggestion[]>;
  createBrand: (input: Record<string, unknown>) => Promise<BrandDTO>;
  addSlot: (input: Record<string, unknown>) => Promise<void>;
  deleteSlot: (id: string) => Promise<void>;
  applySlots: (brandId: string) => Promise<number>;
}

export const useData = create<DataState>()((set, get) => ({
  loaded: false,
  error: null,
  workspace: null,
  brands: [],
  posts: [],
  slots: [],
  shareLinks: [],

  load: async () => {
    try {
      const data = await json<BootstrapDTO>(await fetch("/api/bootstrap"));
      set({ ...data, loaded: true, error: null });
    } catch (e) {
      set({ error: String(e), loaded: true });
    }
  },

  createPost: async (input) => {
    const post = await json<PostDTO>(
      await fetch("/api/posts", { method: "POST", body: JSON.stringify(input) })
    );
    set({ posts: [...get().posts, post] });
    return post;
  },

  updatePost: async (id, patch) => {
    // optimistic merge for the fields we can merge locally
    const prev = get().posts;
    set({
      posts: prev.map((p) => (p.id === id ? { ...p, ...(patch as Partial<PostDTO>) } : p)),
    });
    try {
      const post = await json<PostDTO>(
        await fetch(`/api/posts/${id}`, { method: "PATCH", body: JSON.stringify(patch) })
      );
      set({ posts: get().posts.map((p) => (p.id === id ? post : p)) });
    } catch (e) {
      set({ posts: prev, error: String(e) });
    }
  },

  deletePost: async (id) => {
    set({ posts: get().posts.filter((p) => p.id !== id) });
    await fetch(`/api/posts/${id}`, { method: "DELETE" });
  },

  bulk: async (ids, action, extra) => {
    await fetch("/api/posts/bulk", {
      method: "POST",
      body: JSON.stringify({ ids, action, ...extra }),
    });
    await get().load();
  },

  addComment: async (postId, body, author) => {
    const comment = await json<CommentDTO>(
      await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        body: JSON.stringify({ body, author: author ?? "You", authorType: "team" }),
      })
    );
    set({
      posts: get().posts.map((p) =>
        p.id === postId ? { ...p, comments: [...p.comments, comment] } : p
      ),
    });
  },

  publishNow: async (postId) => {
    const { post } = await json<{ post: PostDTO }>(
      await fetch(`/api/posts/${postId}/publish`, { method: "POST" })
    );
    set({ posts: get().posts.map((p) => (p.id === postId ? post : p)) });
  },

  generateIdeas: async (brandId, count = 6) => {
    const { ideas } = await json<{ ideas: IdeaSuggestion[] }>(
      await fetch("/api/ideas", { method: "POST", body: JSON.stringify({ brandId, count }) })
    );
    return ideas;
  },

  createBrand: async (input) => {
    const brand = await json<BrandDTO & { shareLinks?: ShareLinkDTO[] }>(
      await fetch("/api/brands", { method: "POST", body: JSON.stringify(input) })
    );
    // Surface the auto-created approval link right away so the new client's
    // "Copy approval link" button works without a reload.
    set({
      brands: [...get().brands, brand],
      shareLinks: [...get().shareLinks, ...(brand.shareLinks ?? [])],
    });
    return brand;
  },

  addSlot: async (input) => {
    const slot = await json<SlotDTO>(
      await fetch("/api/slots", { method: "POST", body: JSON.stringify(input) })
    );
    set({ slots: [...get().slots, slot] });
  },

  deleteSlot: async (id) => {
    set({ slots: get().slots.filter((s) => s.id !== id) });
    await fetch(`/api/slots/${id}`, { method: "DELETE" });
  },

  applySlots: async (brandId) => {
    const { created } = await json<{ created: number }>(
      await fetch("/api/slots/apply", { method: "POST", body: JSON.stringify({ brandId, weeks: 2 }) })
    );
    await get().load();
    return created;
  },
}));

/* ------------------------------ derived helpers ------------------------------ */

export function visiblePosts(
  posts: PostDTO[],
  ui: Pick<UIState, "mode" | "singleBrandId" | "brandFilter" | "channelFilter" | "statusFilter">
): PostDTO[] {
  return posts.filter((p) => {
    if (ui.mode === "single") {
      if (!ui.singleBrandId || p.brandId !== ui.singleBrandId) return false;
    } else if (ui.brandFilter.length > 0 && !ui.brandFilter.includes(p.brandId)) {
      return false;
    }
    if (ui.channelFilter.length > 0 && !p.variants.some((v) => ui.channelFilter.includes(v.platform))) {
      return false;
    }
    if (ui.statusFilter.length > 0 && !ui.statusFilter.includes(p.status)) return false;
    return true;
  });
}
