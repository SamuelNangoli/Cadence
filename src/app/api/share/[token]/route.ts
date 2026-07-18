import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ token: string }> };

/** Public, read-only payload for the client review page. No auth by design. */
export async function GET(_req: Request, { params }: Params) {
  const { token } = await params;
  const link = await prisma.shareLink.findUnique({
    where: { token },
    include: { brand: { include: { channels: true } } },
  });
  if (!link) return NextResponse.json({ error: "not found" }, { status: 404 });

  const posts = await prisma.post.findMany({
    where: {
      brandId: link.brandId,
      status: { in: ["needs_approval", "approved", "scheduled"] },
    },
    include: { variants: true, comments: { orderBy: { createdAt: "asc" } } },
    orderBy: { scheduledAt: "asc" },
  });

  return NextResponse.json({
    brand: {
      id: link.brand.id,
      name: link.brand.name,
      handle: link.brand.handle,
      accentColor: link.brand.accentColor,
      channels: link.brand.channels,
    },
    posts,
  });
}
