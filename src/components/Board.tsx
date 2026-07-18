"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import { addDays, addMonths, addWeeks, format } from "date-fns";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Columns3,
  LayoutGrid,
  Lightbulb,
  List,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Rows3,
  Smartphone,
  Sun,
  X,
} from "lucide-react";
import { useData, useUI, visiblePosts, type ViewKind } from "@/lib/store";
import { PLATFORM_ORDER, PLATFORMS, STATUSES, STATUS_ORDER, type Platform, type PostStatus } from "@/lib/platforms";
import { PlatformIcon } from "./icons";
import { Button, Kbd, Modal, Spinner } from "./ui";
import { MonthView } from "./MonthView";
import { WeekView } from "./WeekView";
import { ListView } from "./ListView";
import { KanbanView } from "./KanbanView";
import { FeedView } from "./FeedView";
import { PostDrawer } from "./PostDrawer";
import { Composer } from "./Composer";
import { IdeasPanel } from "./IdeasPanel";
import { ClientsPanel } from "./ClientsPanel";
import { cn } from "@/lib/utils";

const VIEWS: { key: ViewKind; label: string; icon: React.ReactNode; kbd: string }[] = [
  { key: "month", label: "Month", icon: <LayoutGrid size={14} />, kbd: "1" },
  { key: "week", label: "Week", icon: <Columns3 size={14} />, kbd: "2" },
  { key: "list", label: "List", icon: <List size={14} />, kbd: "3" },
  { key: "kanban", label: "Board", icon: <Rows3 size={14} />, kbd: "4" },
  { key: "feed", label: "Feed", icon: <Smartphone size={14} />, kbd: "5" },
];

function Rail({ onNavigate }: { onNavigate?: () => void }) {
  const { brands, posts } = useData();
  const ui = useUI();

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of posts) m.set(p.brandId, (m.get(p.brandId) ?? 0) + 1);
    return m;
  }, [posts]);

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-3">
      {/* all / single toggle */}
      <div className="grid grid-cols-2 gap-1 rounded-lg bg-[var(--panel2)] p-1">
        {(["all", "single"] as const).map((m) => (
          <button
            key={m}
            onClick={() => ui.set({ mode: m, singleBrandId: m === "single" ? ui.singleBrandId ?? brands[0]?.id ?? null : ui.singleBrandId })}
            className={cn(
              "cursor-pointer rounded-md py-1 text-[11px] font-semibold transition-colors",
              ui.mode === m ? "bg-[var(--panel)] shadow-sm" : "text-[var(--muted)]"
            )}
          >
            {m === "all" ? "All clients" : "Single client"}
          </button>
        ))}
      </div>

      <section>
        <h3 className="mb-1.5 flex items-center justify-between px-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
          Clients
          <button
            onClick={() => {
              ui.set({ clientsOpen: true });
              onNavigate?.();
            }}
            className="cursor-pointer text-[var(--accent)] hover:underline"
          >
            manage
          </button>
        </h3>
        <div className="flex flex-col gap-0.5">
          {brands.map((b) => {
            const active =
              ui.mode === "single" ? ui.singleBrandId === b.id : ui.brandFilter.length === 0 || ui.brandFilter.includes(b.id);
            return (
              <button
                key={b.id}
                onClick={() => {
                  if (ui.mode === "single") ui.set({ singleBrandId: b.id });
                  else ui.toggleBrand(b.id);
                }}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[12px] font-medium transition-colors hover:bg-[var(--panel2)]",
                  !active && "opacity-40"
                )}
              >
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: b.accentColor }} />
                <span className="truncate">{b.name}</span>
                <span className="ml-auto text-[10px] text-[var(--muted)]">{counts.get(b.id) ?? 0}</span>
              </button>
            );
          })}
          {brands.length === 0 && <p className="px-2 text-[11px] text-[var(--muted)]">No clients yet.</p>}
        </div>
        {ui.mode === "all" && ui.brandFilter.length > 0 && (
          <button onClick={() => ui.set({ brandFilter: [] })} className="mt-1 cursor-pointer px-2 text-[11px] text-[var(--accent)] hover:underline">
            show all
          </button>
        )}
      </section>

      <section>
        <h3 className="mb-1.5 px-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">Channels</h3>
        <div className="flex flex-wrap gap-1 px-1">
          {PLATFORM_ORDER.map((p) => {
            const on = ui.channelFilter.length === 0 || ui.channelFilter.includes(p);
            return (
              <button
                key={p}
                onClick={() => ui.toggleChannel(p)}
                title={PLATFORMS[p].label}
                className={cn(
                  "cursor-pointer rounded-md border border-[var(--border)] p-1.5 transition-all hover:border-[var(--accent)]",
                  !on && "opacity-30"
                )}
              >
                <PlatformIcon platform={p} size={13} />
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h3 className="mb-1.5 px-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">Status</h3>
        <div className="flex flex-col gap-0.5">
          {STATUS_ORDER.map((s) => {
            const meta = STATUSES[s];
            const on = ui.statusFilter.length === 0 || ui.statusFilter.includes(s);
            return (
              <button
                key={s}
                onClick={() => ui.toggleStatus(s)}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 text-left text-[12px] transition-colors hover:bg-[var(--panel2)]",
                  !on && "opacity-35"
                )}
              >
                <span className="h-2 w-2 rounded-full" style={{ background: meta.color }} />
                {meta.label}
              </button>
            );
          })}
        </div>
      </section>

      <div className="mt-auto space-y-1 px-1 pb-1 text-[10px] text-[var(--muted)]">
        <p className="flex items-center gap-1">
          <Kbd>N</Kbd> new <Kbd>T</Kbd> today <Kbd>1-5</Kbd> views <Kbd>?</Kbd> help
        </p>
      </div>
    </div>
  );
}

export function Board() {
  const data = useData();
  const ui = useUI();
  // false during SSR / first paint, true once mounted on the client — lets the
  // persisted UI store settle before we render view preferences.
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  useEffect(() => {
    data.load();
    // Small screens default to list view unless the user saved a preference.
    if (window.innerWidth < 768 && !localStorage.getItem("cadence-ui")) {
      useUI.getState().set({ view: "list", railOpen: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // theme side-effect
  useEffect(() => {
    document.documentElement.classList.toggle("dark", ui.theme === "dark");
  }, [ui.theme]);

  // keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // Guard: a keydown can originate from document/window, which has no closest().
      const target = e.target instanceof Element ? e.target : null;
      if (target?.closest("input, textarea, select, [contenteditable]")) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const s = useUI.getState();
      switch (e.key) {
        case "n":
        case "N":
          e.preventDefault();
          s.set({ composer: { open: true } });
          break;
        case "t":
        case "T":
          s.set({ cursor: new Date().toISOString() });
          break;
        case "1": case "2": case "3": case "4": case "5":
          s.set({ view: VIEWS[Number(e.key) - 1].key });
          break;
        case "ArrowLeft": case "[":
          navigate(-1, s.view, s.cursor, s.set);
          break;
        case "ArrowRight": case "]":
          navigate(1, s.view, s.cursor, s.set);
          break;
        case "d": case "D":
          s.set({ density: s.density === "compact" ? "comfortable" : "compact" });
          break;
        case "?":
          s.set({ helpOpen: !s.helpOpen });
          break;
        case "Escape":
          s.set({ openPostId: null, helpOpen: false, mobileRailOpen: false });
          break;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function navigate(dir: 1 | -1, view: ViewKind, cursorISO: string, set: (p: { cursor: string }) => void) {
    const c = new Date(cursorISO);
    const next = view === "month" ? addMonths(c, dir) : view === "week" ? addWeeks(c, dir) : addDays(c, 7 * dir);
    set({ cursor: next.toISOString() });
  }

  const cursor = useMemo(() => new Date(ui.cursor), [ui.cursor]);
  const filtered = useMemo(() => visiblePosts(data.posts, ui), [data.posts, ui]);
  const openPost = data.posts.find((p) => p.id === ui.openPostId) ?? null;
  const openBrand = openPost ? data.brands.find((b) => b.id === openPost.brandId) ?? null : null;
  const openShareToken = openPost ? data.shareLinks.find((l) => l.brandId === openPost.brandId)?.token ?? null : null;

  if (!hydrated || !data.loaded) {
    return (
      <div className="flex h-dvh items-center justify-center gap-3">
        <Spinner /> <span className="text-sm text-[var(--muted)]">Loading your board…</span>
      </div>
    );
  }

  const periodLabel =
    ui.view === "week"
      ? `Week of ${format(cursor, "MMM d, yyyy")}`
      : format(cursor, "MMMM yyyy");

  /* First-run empty state: walk a new manager through adding their first client. */
  if (data.brands.length === 0) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="text-4xl">🗓️</div>
        <h1 className="text-xl font-bold">One board for every client.</h1>
        <p className="max-w-sm text-sm text-[var(--muted)]">
          Add your first client brand, connect their channels, and Cadence turns the chaos of spreadsheets and
          WhatsApp approvals into one calendar.
        </p>
        <Button variant="primary" onClick={() => ui.set({ clientsOpen: true })}>
          <Plus size={14} /> Add your first client
        </Button>
        <ClientsPanel />
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col">
      {/* topbar */}
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-[var(--border)] bg-[var(--panel)] px-3">
        <button
          className="cursor-pointer rounded-md p-1.5 hover:bg-[var(--panel2)] md:hidden"
          onClick={() => ui.set({ mobileRailOpen: true })}
          aria-label="Open filters"
        >
          <Menu size={16} />
        </button>
        <button
          className="hidden cursor-pointer rounded-md p-1.5 text-[var(--muted)] hover:bg-[var(--panel2)] md:block"
          onClick={() => ui.set({ railOpen: !ui.railOpen })}
          aria-label="Toggle sidebar"
        >
          {ui.railOpen ? <PanelLeftClose size={15} /> : <PanelLeftOpen size={15} />}
        </button>

        <div className="flex items-center gap-1.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[var(--accent)] text-[13px] font-bold text-white">C</span>
          <span className="text-sm font-bold tracking-tight max-sm:hidden">Cadence</span>
        </div>

        {ui.view !== "kanban" && ui.view !== "feed" && (
          <div className="ml-2 flex items-center gap-0.5">
            <button onClick={() => navigate(-1, ui.view, ui.cursor, ui.set)} className="cursor-pointer rounded-md p-1 hover:bg-[var(--panel2)]" aria-label="Previous">
              <ChevronLeft size={15} />
            </button>
            <button
              onClick={() => ui.set({ cursor: new Date().toISOString() })}
              className="cursor-pointer rounded-md px-2 py-0.5 text-xs font-medium hover:bg-[var(--panel2)]"
            >
              Today
            </button>
            <button onClick={() => navigate(1, ui.view, ui.cursor, ui.set)} className="cursor-pointer rounded-md p-1 hover:bg-[var(--panel2)]" aria-label="Next">
              <ChevronRight size={15} />
            </button>
            <span className="ml-1 text-[13px] font-semibold max-sm:hidden">{periodLabel}</span>
          </div>
        )}

        {/* view switcher */}
        <div className="ml-auto flex items-center gap-0.5 rounded-lg bg-[var(--panel2)] p-0.5">
          {VIEWS.map((v) => (
            <button
              key={v.key}
              onClick={() => ui.set({ view: v.key })}
              title={`${v.label} (${v.kbd})`}
              className={cn(
                "flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
                ui.view === v.key ? "bg-[var(--panel)] shadow-sm" : "text-[var(--muted)] hover:text-[var(--text)]"
              )}
            >
              {v.icon}
              <span className="max-lg:hidden">{v.label}</span>
            </button>
          ))}
        </div>

        <button
          onClick={() => ui.set({ density: ui.density === "compact" ? "comfortable" : "compact" })}
          title={`Density: ${ui.density} (D)`}
          className="cursor-pointer rounded-md p-1.5 text-[var(--muted)] hover:bg-[var(--panel2)] max-sm:hidden"
        >
          {ui.density === "compact" ? <Rows3 size={14} /> : <CalendarDays size={14} />}
        </button>
        <button
          onClick={() => ui.set({ theme: ui.theme === "dark" ? "light" : "dark" })}
          title="Toggle theme"
          className="cursor-pointer rounded-md p-1.5 text-[var(--muted)] hover:bg-[var(--panel2)]"
        >
          {ui.theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
        </button>
        <Button size="sm" variant="ghost" onClick={() => ui.set({ ideasOpen: true })} className="max-sm:hidden">
          <Lightbulb size={13} /> Ideas
        </Button>
        <Button size="sm" variant="primary" onClick={() => ui.set({ composer: { open: true } })}>
          <Plus size={13} /> <span className="max-sm:hidden">New post</span>
        </Button>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* desktop rail */}
        {ui.railOpen && (
          <aside className="hidden w-56 shrink-0 border-r border-[var(--border)] bg-[var(--panel)] md:block">
            <Rail />
          </aside>
        )}

        {/* mobile bottom sheet */}
        {ui.mobileRailOpen && (
          <div className="fixed inset-0 z-40 md:hidden" onClick={() => ui.set({ mobileRailOpen: false })}>
            <div className="absolute inset-0 bg-black/40" />
            <div
              className="fade-up absolute inset-x-0 bottom-0 max-h-[75vh] rounded-t-2xl border-t border-[var(--border)] bg-[var(--panel)] pb-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 pt-3">
                <span className="text-sm font-semibold">Filters</span>
                <button onClick={() => ui.set({ mobileRailOpen: false })} className="cursor-pointer rounded-md p-1 hover:bg-[var(--panel2)]">
                  <X size={16} />
                </button>
              </div>
              <div className="max-h-[60vh] overflow-y-auto">
                <Rail onNavigate={() => ui.set({ mobileRailOpen: false })} />
              </div>
            </div>
          </div>
        )}

        {/* main view */}
        <main className="min-w-0 flex-1 p-3">
          {ui.view === "month" && (
            <MonthView
              cursor={cursor}
              posts={filtered}
              brands={data.brands}
              density={ui.density}
              onOpen={(id) => ui.set({ openPostId: id })}
              onQuickAdd={(date) => ui.set({ composer: { open: true, date } })}
              onReschedule={(id, d) => data.updatePost(id, { scheduledAt: d.toISOString() })}
            />
          )}
          {ui.view === "week" && (
            <WeekView
              cursor={cursor}
              posts={filtered}
              brands={data.brands}
              onOpen={(id) => ui.set({ openPostId: id })}
              onQuickAdd={(date) => ui.set({ composer: { open: true, date } })}
              onReschedule={(id, d) => data.updatePost(id, { scheduledAt: d.toISOString() })}
            />
          )}
          {ui.view === "list" && (
            <ListView
              posts={filtered}
              brands={data.brands}
              selection={ui.selection}
              onToggleSelect={ui.toggleSelect}
              onSelectMany={(ids) => ui.set({ selection: ids })}
              onClearSelection={ui.clearSelection}
              onOpen={(id) => ui.set({ openPostId: id })}
              onBulk={(ids, action, extra) => {
                data.bulk(ids, action, extra as { status?: PostStatus; shiftDays?: number });
                ui.clearSelection();
              }}
            />
          )}
          {ui.view === "kanban" && (
            <KanbanView
              posts={filtered}
              brands={data.brands}
              density={ui.density}
              onOpen={(id) => ui.set({ openPostId: id })}
              onStatusChange={(id, status) =>
                data.updatePost(id, { status, ...(status === "needs_approval" ? { approvalState: "pending" } : {}) })
              }
            />
          )}
          {ui.view === "feed" && (
            <FeedView
              posts={data.posts}
              brands={data.brands}
              initialBrandId={ui.mode === "single" ? ui.singleBrandId : null}
              feedPlatform={ui.feedPlatform}
              onPlatformChange={(p: Platform) => ui.set({ feedPlatform: p })}
              onOpen={(id) => ui.set({ openPostId: id })}
            />
          )}
        </main>
      </div>

      {/* overlays */}
      {openPost && openBrand && (
        <PostDrawer
          key={openPost.id}
          post={openPost}
          brand={openBrand}
          shareToken={openShareToken}
          onClose={() => ui.set({ openPostId: null })}
        />
      )}
      <Composer key={ui.composer.open ? `${ui.composer.date ?? ""}|${ui.composer.brandId ?? ""}` : "closed"} />
      <IdeasPanel />
      <ClientsPanel />

      <Modal open={ui.helpOpen} onClose={() => ui.set({ helpOpen: false })} title="Keyboard shortcuts">
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
          {[
            ["N", "New post"],
            ["T", "Jump to today"],
            ["1–5", "Month / Week / List / Board / Feed"],
            ["← →", "Previous / next period"],
            ["D", "Toggle density"],
            ["Esc", "Close panels"],
            ["?", "This help"],
          ].map(([k, label]) => (
            <div key={k} className="flex items-center justify-between gap-2">
              <span className="text-[var(--muted)]">{label}</span>
              <Kbd>{k}</Kbd>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
