"use client";

import { useState } from "react";
import { addDays } from "date-fns";
import { Lightbulb, Plus, Sparkles } from "lucide-react";
import type { IdeaSuggestion } from "@/lib/types";
import { PLATFORMS } from "@/lib/platforms";
import { PlatformIcon } from "./icons";
import { Button, Modal, Select, Spinner } from "./ui";
import { useData, useUI } from "@/lib/store";

/** AI idea generator — suggestions drop into the calendar as draft cards. */
export function IdeasPanel() {
  const { brands, generateIdeas, createPost } = useData();
  const { ideasOpen, set } = useUI();

  const [brandId, setBrandId] = useState("");
  const [ideas, setIdeas] = useState<IdeaSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [addedIdx, setAddedIdx] = useState<number[]>([]);

  const effectiveBrand = brandId || brands[0]?.id || "";

  async function generate() {
    if (!effectiveBrand) return;
    setLoading(true);
    setAddedIdx([]);
    try {
      setIdeas(await generateIdeas(effectiveBrand, 6));
    } finally {
      setLoading(false);
    }
  }

  async function addIdea(idea: IdeaSuggestion, idx: number) {
    // Land drafts on upcoming mornings so they're immediately visible.
    const date = addDays(new Date(), 1 + idx);
    date.setHours(10, 0, 0, 0);
    const copyMap: Record<string, string> = {};
    for (const p of idea.platforms) copyMap[p] = "";
    await createPost({
      brandId: effectiveBrand,
      title: idea.title,
      contentType: idea.contentType,
      status: "draft",
      scheduledAt: date.toISOString(),
      mediaEmoji: "💡",
      platforms: idea.platforms,
      copy: copyMap,
    });
    setAddedIdx((a) => [...a, idx]);
  }

  return (
    <Modal open={ideasOpen} onClose={() => set({ ideasOpen: false })} title={<span className="flex items-center gap-1.5"><Lightbulb size={14} /> Idea generator</span>} wide>
      <div className="mb-3 flex gap-2">
        <Select value={effectiveBrand} onChange={(e) => setBrandId(e.target.value)} className="flex-1" aria-label="Client">
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </Select>
        <Button variant="primary" onClick={generate} disabled={loading || !effectiveBrand}>
          {loading ? <Spinner className="border-white/40 border-t-white" /> : <Sparkles size={14} />}
          {loading ? "Thinking…" : "Generate ideas"}
        </Button>
      </div>

      {ideas.length === 0 && !loading && (
        <p className="rounded-lg border border-dashed border-[var(--border)] p-6 text-center text-sm text-[var(--muted)]">
          Pick a client and generate topic + hook suggestions tailored to their industry. Accepted ideas land on the
          calendar as draft cards.
        </p>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        {ideas.map((idea, i) => {
          const added = addedIdx.includes(i);
          return (
            <div key={i} className="fade-up flex flex-col rounded-xl border border-[var(--border)] bg-[var(--panel2)]/50 p-3">
              <div className="text-[13px] font-semibold leading-snug">{idea.title}</div>
              <p className="mt-1 flex-1 text-[11px] leading-4 text-[var(--muted)]">{idea.hook}</p>
              <div className="mt-2 flex items-center gap-1.5">
                <span className="rounded bg-[var(--panel)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--muted)]">
                  {idea.contentType}
                </span>
                {idea.platforms.map((p) => (
                  <span key={p} title={PLATFORMS[p].label} className="text-[var(--muted)]">
                    <PlatformIcon platform={p} size={11} />
                  </span>
                ))}
                <Button size="sm" variant={added ? "ghost" : "default"} className="ml-auto" disabled={added} onClick={() => addIdea(idea, i)}>
                  {added ? "Added ✓" : (<><Plus size={11} /> Draft</>)}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
