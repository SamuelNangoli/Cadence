import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const workspace = await prisma.workspace.findFirstOrThrow();
  const [brands, posts, slots, shareLinks] = await Promise.all([
    prisma.brand.findMany({
      where: { workspaceId: workspace.id },
      include: { channels: true },
      orderBy: { name: "asc" },
    }),
    prisma.post.findMany({
      where: { brand: { workspaceId: workspace.id } },
      include: { variants: true, comments: { orderBy: { createdAt: "asc" } } },
      orderBy: { scheduledAt: "asc" },
    }),
    prisma.recurringSlot.findMany({ where: { brand: { workspaceId: workspace.id } } }),
    prisma.shareLink.findMany({ where: { brand: { workspaceId: workspace.id } } }),
  ]);

  return NextResponse.json({
    workspace: { id: workspace.id, name: workspace.name },
    brands,
    posts,
    slots,
    shareLinks,
  });
}
