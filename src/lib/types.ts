/** Client-side data shapes (serialized over the API — dates are ISO strings). */
import type { Platform, PostStatus, ContentType } from "./platforms";

export interface ChannelDTO {
  id: string;
  platform: Platform;
  handle: string;
  connected: boolean;
}

export interface BrandDTO {
  id: string;
  name: string;
  handle: string;
  industry: string;
  description: string;
  accentColor: string;
  channels: ChannelDTO[];
}

export interface VariantDTO {
  id: string;
  platform: Platform;
  copy: string;
}

export interface CommentDTO {
  id: string;
  author: string;
  authorType: "team" | "client";
  body: string;
  createdAt: string;
}

export interface PostDTO {
  id: string;
  brandId: string;
  title: string;
  contentType: ContentType;
  status: PostStatus;
  scheduledAt: string | null;
  mediaEmoji: string;
  approvalState: "none" | "pending" | "approved" | "changes_requested";
  variants: VariantDTO[];
  comments: CommentDTO[];
  updatedAt: string;
}

export interface SlotDTO {
  id: string;
  brandId: string;
  weekday: number;
  hour: number;
  minute: number;
  label: string;
  platform: Platform;
  contentType: ContentType;
}

export interface ShareLinkDTO {
  id: string;
  token: string;
  brandId: string;
}

export interface BootstrapDTO {
  workspace: { id: string; name: string; plan?: string; subscriptionStatus?: string | null };
  brands: BrandDTO[];
  posts: PostDTO[];
  slots: SlotDTO[];
  shareLinks: ShareLinkDTO[];
}

export interface IdeaSuggestion {
  title: string;
  hook: string;
  contentType: ContentType;
  platforms: Platform[];
}
