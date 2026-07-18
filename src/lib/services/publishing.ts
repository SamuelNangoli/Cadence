/**
 * Publishing abstraction. Real channel APIs (Meta Graph, LinkedIn, X, TikTok,
 * YouTube Data) plug in behind this interface in Phase 2 — the app only ever
 * talks to `getPublisher()`.
 */
import type { Platform } from "../platforms";

export interface PublishResult {
  platform: Platform;
  ok: boolean;
  externalId?: string;
  error?: string;
}

export interface PublishingProvider {
  publish(input: {
    platform: Platform;
    handle: string;
    copy: string;
    scheduledAt: Date | null;
  }): Promise<PublishResult>;
}

/** Stub provider: simulates a successful publish with a fake external id. */
class StubPublisher implements PublishingProvider {
  async publish({ platform }: { platform: Platform; handle: string; copy: string; scheduledAt: Date | null }) {
    await new Promise((r) => setTimeout(r, 150));
    return {
      platform,
      ok: true,
      externalId: `${platform}_${Math.random().toString(36).slice(2, 10)}`,
    };
  }
}

export function getPublisher(): PublishingProvider {
  // Swap on env/config when real integrations land.
  return new StubPublisher();
}
