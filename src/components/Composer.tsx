"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CONTENT_TYPES, PLATFORMS, type Platform } from "@/lib/platforms";
import { PlatformIcon } from "./icons";
import { Button, Input, Modal, Select, Textarea } from "./ui";
import { cn } from "@/lib/utils";
import { useData, useUI } from "@/lib/store";

const EMOJIS = ["📸", "🎬", "🧵", "📈", "🎉", "💡", "🔥", "🗓️", "✨", "🎯"];

export function Composer() {
  const { brands, createPost } = useData();
  const { composer, set } = useUI();

  // Seeded once per open — Board keys this component on the composer request,
  // so each open remounts with a fresh form rather than syncing via an effect.
  const initialBrand = composer.brandId ?? brands[0]?.id ?? "";
  const [brandId, setBrandId] = useState(initialBrand);
  const [title, setTitle] = useState("");
  const [when, setWhen] = useState(composer.date ?? format(new Date(), "yyyy-MM-dd'T'09:00"));
  const [contentType, setContentType] = useState("image");
  const [platforms, setPlatforms] = useState<Platform[]>(() => {
    const first = brands.find((x) => x.id === initialBrand)?.channels[0]?.platform;
    return first ? [first] : [];
  });
  const [copy, setCopy] = useState("");
  const [emoji, setEmoji] = useState("📸");
  const [saving, setSaving] = useState(false);

  const brand = brands.find((b) => b.id === brandId);

  function close() {
    set({ composer: { open: false } });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!brandId || !title.trim() || platforms.length === 0) return;
    setSaving(true);
    try {
      const copyMap: Record<string, string> = {};
      for (const p of platforms) copyMap[p] = copy;
      const post = await createPost({
        brandId,
        title: title.trim(),
        contentType,
        status: "draft",
        scheduledAt: when ? new Date(when).toISOString() : null,
        mediaEmoji: emoji,
        platforms,
        copy: copyMap,
      });
      close();
      set({ openPostId: post.id });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={composer.open} onClose={close} title="New post" wide>
      <form onSubmit={submit} className="space-y-3">
        <div className="flex gap-2">
          <Select value={brandId} onChange={(e) => setBrandId(e.target.value)} className="flex-1" aria-label="Client">
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
          <Input
            type="datetime-local"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            className="flex-1"
            aria-label="Schedule"
          />
          <Select value={contentType} onChange={(e) => setContentType(e.target.value)} aria-label="Content type">
            {CONTENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </div>

        <Input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder='Working title, e.g. "August launch teaser"'
        />

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[11px] font-medium text-[var(--muted)]">Channels:</span>
          {(brand?.channels ?? []).map((c) => {
            const on = platforms.includes(c.platform);
            return (
              <button
                type="button"
                key={c.id}
                onClick={() =>
                  setPlatforms(on ? platforms.filter((p) => p !== c.platform) : [...platforms, c.platform])
                }
                className={cn(
                  "flex cursor-pointer items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium transition-colors",
                  on
                    ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                    : "border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]"
                )}
              >
                <PlatformIcon platform={c.platform} size={11} />
                {PLATFORMS[c.platform].label}
              </button>
            );
          })}
        </div>

        <div>
          <Textarea
            rows={4}
            value={copy}
            onChange={(e) => setCopy(e.target.value)}
            placeholder="Base copy — applied to every selected channel; tailor per platform afterwards in the post drawer."
          />
          {platforms.includes("x") && (
            <div className={cn("text-right font-mono text-[11px]", copy.length > 280 ? "font-bold text-red-500" : "text-[var(--muted)]")}>
              X: {copy.length}/280
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          <span className="mr-1 text-[11px] font-medium text-[var(--muted)]">Tile:</span>
          {EMOJIS.map((e) => (
            <button
              type="button"
              key={e}
              onClick={() => setEmoji(e)}
              className={cn(
                "cursor-pointer rounded-md p-1 text-base transition-colors",
                emoji === e ? "bg-[var(--accent)]/15 ring-1 ring-[var(--accent)]" : "hover:bg-[var(--panel2)]"
              )}
            >
              {e}
            </button>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={saving || !title.trim() || platforms.length === 0}>
            {saving ? "Creating…" : "Create draft"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
