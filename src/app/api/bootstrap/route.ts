import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  // A database with no workspace is a legitimate state — a fresh install, or
  // after clearing every client. Create one instead of 500ing, so the app can
  // render its "add your first client" empty state.
  const workspace =
    (await prisma.workspace.findFirst()) ??
    (await prisma.workspace.create({ data: { name: "My Workspace" } }));
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
