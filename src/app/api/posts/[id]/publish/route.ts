import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPublisher } from "@/lib/services/publishing";
import type { Platform } from "@/lib/platforms";

type Params = { params: Promise<{ id: string }> };

/** "Publish now" — runs every channel variant through the publishing provider. */
export async function POST(_req: Request, { params }: Params) {
  const { id } = await params;
  const post = await prisma.post.findUniqueOrThrow({
    where: { id },
    include: { variants: true, brand: { include: { channels: true } } },
  });

  const publisher = getPublisher();
  const results = [];
  for (const v of post.variants) {
    const channel = post.brand.channels.find((c) => c.platform === v.platform);
    results.push(
      await publisher.publish({
        platform: v.platform as Platform,
        handle: channel?.handle ?? post.brand.handle,
        copy: v.copy,
        scheduledAt: post.scheduledAt,
      })
    );
  }

  const allOk = results.every((r) => r.ok);
  const updated = await prisma.post.update({
    where: { id },
    data: { status: allOk ? "published" : post.status },
    include: { variants: true, comments: { orderBy: { createdAt: "asc" } } },
  });

  return NextResponse.json({ post: updated, results });
}
