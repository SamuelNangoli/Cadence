import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  const wid = session.wid;

  const workspace = await prisma.workspace.findUnique({ where: { id: wid } });
  if (!workspace) {
    // Session points at a workspace that no longer exists (e.g. account deleted).
    return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
  }

  const [brands, posts, slots, shareLinks] = await Promise.all([
    prisma.brand.findMany({
      where: { workspaceId: wid },
      include: { channels: true },
      orderBy: { name: "asc" },
    }),
    prisma.post.findMany({
      where: { brand: { workspaceId: wid } },
      include: { variants: true, comments: { orderBy: { createdAt: "asc" } } },
      orderBy: { scheduledAt: "asc" },
    }),
    prisma.recurringSlot.findMany({ where: { brand: { workspaceId: wid } } }),
    prisma.shareLink.findMany({ where: { brand: { workspaceId: wid } } }),
  ]);

  return NextResponse.json({
    workspace: {
      id: workspace.id,
      name: workspace.name,
      plan: workspace.plan,
      subscriptionStatus: workspace.subscriptionStatus,
    },
    brands,
    posts,
    slots,
    shareLinks,
  });
}
