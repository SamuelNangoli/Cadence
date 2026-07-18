/** Platform metadata: labels, brand colors, character limits, card behavior. */

export type Platform = "instagram" | "linkedin" | "x" | "tiktok" | "facebook" | "youtube";

export const PLATFORMS: Record<
  Platform,
  { label: string; color: string; charLimit: number; charLabel: string; media: "square" | "vertical" | "wide" | "text" }
> = {
  instagram: { label: "Instagram", color: "#e1306c", charLimit: 2200, charLabel: "caption", media: "square" },
  linkedin: { label: "LinkedIn", color: "#0a66c2", charLimit: 3000, charLabel: "post", media: "text" },
  x: { label: "X", color: "#536471", charLimit: 280, charLabel: "post", media: "text" },
  tiktok: { label: "TikTok", color: "#0f766e", charLimit: 2200, charLabel: "caption", media: "vertical" },
  facebook: { label: "Facebook", color: "#1877f2", charLimit: 5000, charLabel: "post", media: "wide" },
  youtube: { label: "YouTube", color: "#ff0000", charLimit: 5000, charLabel: "description", media: "wide" },
};

export const PLATFORM_ORDER: Platform[] = ["instagram", "tiktok", "x", "linkedin", "facebook", "youtube"];

export type PostStatus = "idea" | "draft" | "needs_approval" | "approved" | "scheduled" | "published";

export const STATUSES: Record<PostStatus, { label: string; color: string; bg: string }> = {
  idea: { label: "Idea", color: "#71717a", bg: "rgba(113,113,122,.14)" },
  draft: { label: "Draft", color: "#0284c7", bg: "rgba(2,132,199,.13)" },
  needs_approval: { label: "Needs approval", color: "#d97706", bg: "rgba(217,119,6,.14)" },
  approved: { label: "Approved", color: "#059669", bg: "rgba(5,150,105,.13)" },
  scheduled: { label: "Scheduled", color: "#7c3aed", bg: "rgba(124,58,237,.13)" },
  published: { label: "Published", color: "#64748b", bg: "rgba(100,116,139,.14)" },
};

export const STATUS_ORDER: PostStatus[] = ["idea", "draft", "needs_approval", "approved", "scheduled", "published"];

export const CONTENT_TYPES = ["image", "video", "carousel", "text", "reel", "story", "short"] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];
