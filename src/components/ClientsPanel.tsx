"use client";

import { useRef, useState } from "react";
import { CalendarClock, Link as LinkIcon, Plus, Repeat, Trash2, Users } from "lucide-react";
import { PLATFORM_ORDER, PLATFORMS, type Platform } from "@/lib/platforms";
import { PlatformIcon } from "./icons";
import { Button, Input, Modal, Select } from "./ui";
import { cn } from "@/lib/utils";
import { describeError, useData, useUI } from "@/lib/store";

const ACCENTS = ["#16a34a", "#ea580c", "#db2777", "#b45309", "#4f46e5", "#0891b2", "#7c3aed", "#dc2626"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function ClientsPanel() {
  const { brands, slots, shareLinks, createBrand, addSlot, deleteSlot, applySlots } = useData();
  const { clientsOpen, set } = useUI();

  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [accent, setAccent] = useState(ACCENTS[4]);
  const [platforms, setPlatforms] = useState<Platform[]>(["instagram"]);
  const [formError, setFormError] = useState<string | null>(null);
  const [savingBrand, setSavingBrand] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [applied, setApplied] = useState<Record<string, number>>({});

  // per-brand new-slot form state
  const [slotBrand, setSlotBrand] = useState<string | null>(null);
  const [slotDay, setSlotDay] = useState(2);
  const [slotHour, setSlotHour] = useState(9);
  const [slotLabel, setSlotLabel] = useState("");
  const [slotPlatform, setSlotPlatform] = useState<Platform>("instagram");

  /** Reset every field so the form never opens carrying stale state. */
  function openAddForm() {
    setName("");
    setIndustry("");
    setAccent(ACCENTS[4]);
    setPlatforms(["instagram"]);
    setFormError(null);
    setAdding(true);
    // The form sits at the bottom of a long scrollable list — bring the whole
    // thing (including its buttons) into view, or the user never sees it.
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
      nameRef.current?.focus();
    });
  }

  /** Show a validation reason and make sure it is actually on screen. */
  function failWith(message: string, focus?: HTMLElement | null) {
    setFormError(message);
    requestAnimationFrame(() => {
      (focus ?? errorRef.current)?.scrollIntoView({ block: "center", behavior: "smooth" });
      focus?.focus();
    });
  }

  function closeAddForm() {
    setAdding(false);
    setFormError(null);
  }

  async function submitBrand(e: React.FormEvent) {
    e.preventDefault();
    if (savingBrand) return;

    // Validate here rather than disabling the button: a dead button gives the
    // user no idea what's missing.
    if (!name.trim()) {
      failWith("Give the client a name.", nameRef.current);
      return;
    }
    if (platforms.length === 0) {
      failWith("Pick at least one channel — tap Instagram, TikTok, X, LinkedIn, Facebook, or YouTube above.");
      return;
    }

    setFormError(null);
    setSavingBrand(true);
    try {
      await createBrand({ name: name.trim(), industry, accentColor: accent, platforms });
      closeAddForm();
    } catch (err) {
      failWith(describeError(err));
    } finally {
      setSavingBrand(false);
    }
  }

  return (
    <Modal
      open={clientsOpen}
      onClose={() => set({ clientsOpen: false })}
      title={<span className="flex items-center gap-1.5"><Users size={14} /> Clients &amp; channels</span>}
      wide
    >
      <div className="max-h-[65vh] space-y-3 overflow-y-auto pr-1">
        {brands.map((b) => {
          const bSlots = slots.filter((s) => s.brandId === b.id);
          const link = shareLinks.find((l) => l.brandId === b.id);
          return (
            <div key={b.id} className="rounded-xl border border-[var(--border)] p-3">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ background: b.accentColor }} />
                <span className="text-sm font-semibold">{b.name}</span>
                <span className="text-[11px] text-[var(--muted)]">{b.industry}</span>
                <span className="ml-auto flex items-center gap-1.5">
                  {b.channels.map((c) => (
                    <span
                      key={c.id}
                      title={`${PLATFORMS[c.platform].label} — ${c.connected ? "connected" : "not connected"}`}
                      className={cn("rounded-md border border-[var(--border)] p-1", c.connected ? "text-[var(--text)]" : "opacity-40")}
                    >
                      <PlatformIcon platform={c.platform} size={12} />
                    </span>
                  ))}
                </span>
              </div>

              {/* client approval link */}
              {link && (
                <div className="mt-2 flex items-center gap-2 rounded-lg bg-[var(--panel2)]/70 px-2.5 py-1.5">
                  <LinkIcon size={12} className="text-[var(--muted)]" />
                  <code className="flex-1 truncate text-[11px] text-[var(--muted)]">/share/{link.token}</code>
                  <Button
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(`${location.origin}/share/${link.token}`);
                      setCopiedToken(link.token);
                      setTimeout(() => setCopiedToken(null), 1500);
                    }}
                  >
                    {copiedToken === link.token ? "Copied!" : "Copy approval link"}
                  </Button>
                </div>
              )}

              {/* recurring slots */}
              <div className="mt-2">
                <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                  <Repeat size={11} /> Recurring slots
                  {bSlots.length > 0 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="ml-auto h-6"
                      onClick={async () => setApplied({ ...applied, [b.id]: await applySlots(b.id) })}
                    >
                      <CalendarClock size={11} />
                      {applied[b.id] !== undefined ? `${applied[b.id]} drafts created` : "Fill next 2 weeks"}
                    </Button>
                  )}
                </div>
                {bSlots.map((s) => (
                  <div key={s.id} className="flex items-center gap-2 py-0.5 text-xs">
                    <PlatformIcon platform={s.platform} size={11} className="text-[var(--muted)]" />
                    <span className="font-medium">{s.label}</span>
                    <span className="text-[var(--muted)]">
                      every {WEEKDAYS[s.weekday]} {String(s.hour).padStart(2, "0")}:{String(s.minute).padStart(2, "0")}
                    </span>
                    <button
                      onClick={() => deleteSlot(s.id)}
                      className="ml-auto cursor-pointer rounded p-0.5 text-[var(--muted)] hover:text-red-500"
                      aria-label="Delete slot"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                ))}
                {slotBrand === b.id ? (
                  <form
                    className="mt-1.5 flex flex-wrap items-center gap-1.5"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!slotLabel.trim()) return;
                      await addSlot({
                        brandId: b.id,
                        weekday: slotDay,
                        hour: slotHour,
                        label: slotLabel.trim(),
                        platform: slotPlatform,
                      });
                      setSlotLabel("");
                      setSlotBrand(null);
                    }}
                  >
                    <Input
                      value={slotLabel}
                      onChange={(e) => setSlotLabel(e.target.value)}
                      placeholder='e.g. "Tip Tuesday"'
                      className="h-7 w-36 text-xs"
                      autoFocus
                    />
                    <Select value={slotDay} onChange={(e) => setSlotDay(Number(e.target.value))} className="h-7 text-xs">
                      {WEEKDAYS.map((d, i) => (
                        <option key={d} value={i}>
                          {d}
                        </option>
                      ))}
                    </Select>
                    <Select value={slotHour} onChange={(e) => setSlotHour(Number(e.target.value))} className="h-7 text-xs">
                      {Array.from({ length: 24 }, (_, h) => (
                        <option key={h} value={h}>
                          {String(h).padStart(2, "0")}:00
                        </option>
                      ))}
                    </Select>
                    <Select value={slotPlatform} onChange={(e) => setSlotPlatform(e.target.value as Platform)} className="h-7 text-xs">
                      {b.channels.map((c) => (
                        <option key={c.id} value={c.platform}>
                          {PLATFORMS[c.platform].label}
                        </option>
                      ))}
                    </Select>
                    <Button size="sm" type="submit" variant="primary">
                      Add
                    </Button>
                  </form>
                ) : (
                  <button
                    onClick={() => {
                      setSlotBrand(b.id);
                      setSlotPlatform(b.channels[0]?.platform ?? "instagram");
                    }}
                    className="mt-0.5 cursor-pointer text-[11px] font-medium text-[var(--accent)] hover:underline"
                  >
                    + add slot (e.g. post every Tue 9am)
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* add client */}
        {adding ? (
          <form ref={formRef} onSubmit={submitBrand} className="fade-up space-y-2.5 rounded-xl border-2 border-dashed border-[var(--accent)]/40 p-3">
            <div className="flex gap-2">
              <Input
                ref={nameRef}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (formError) setFormError(null);
                }}
                placeholder="Client name"
              />
              <Input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Industry" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="mr-1 text-[11px] font-medium text-[var(--muted)]">Accent:</span>
              {ACCENTS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setAccent(c)}
                  className={cn("h-5 w-5 cursor-pointer rounded-full transition-transform", accent === c && "scale-125 ring-2 ring-offset-1 ring-[var(--accent)]")}
                  style={{ background: c }}
                  aria-label={`Accent ${c}`}
                />
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-[11px] font-medium text-[var(--muted)]">Channels:</span>
              {PLATFORM_ORDER.map((p) => {
                const on = platforms.includes(p);
                return (
                  <button
                    type="button"
                    key={p}
                    onClick={() => {
                      setPlatforms(on ? platforms.filter((x) => x !== p) : [...platforms, p]);
                      if (formError) setFormError(null);
                    }}
                    className={cn(
                      "flex cursor-pointer items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium",
                      on ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]" : "border-[var(--border)] text-[var(--muted)]"
                    )}
                  >
                    <PlatformIcon platform={p} size={11} />
                    {PLATFORMS[p].label}
                  </button>
                );
              })}
            </div>
            {formError && (
              <p ref={errorRef} role="alert" className="rounded-md bg-red-500/10 px-2.5 py-1.5 text-[11px] font-medium text-red-600 dark:text-red-400">
                {formError}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={closeAddForm}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={savingBrand}>
                {savingBrand ? "Adding…" : "Add client"}
              </Button>
            </div>
          </form>
        ) : (
          <Button onClick={openAddForm} className="w-full border-dashed">
            <Plus size={14} /> Add a client
          </Button>
        )}
      </div>
    </Modal>
  );
}
