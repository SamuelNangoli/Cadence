import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { notFound, postInWorkspace, requireSession } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  if (!(await postInWorkspace(id, session.wid))) return notFound();

  const body = await req.json();

  const data: Record<string, unknown> = {};
  for (const key of ["title", "contentType", "status", "mediaEmoji", "approvalState"]) {
    if (body[key] !== undefined) data[key] = body[key];
  }
  if (body.scheduledAt !== undefined) {
    data.scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null;
  }

  // Replace per-channel variants when provided: upsert each, remove dropped ones.
  if (body.variants) {
    const keep: string[] = body.variants.map((v: { platform: string }) => v.platform);
    await prisma.postVariant.deleteMany({ where: { postId: id, platform: { notIn: keep } } });
    for (const v of body.variants as { platform: string; copy: string }[]) {
      await prisma.postVariant.upsert({
        where: { postId_platform: { postId: id, platform: v.platform } },
        create: { postId: id, platform: v.platform, copy: v.copy },
        update: { copy: v.copy },
      });
    }
  }

  const post = await prisma.post.update({
    where: { id },
    data,
    include: { variants: true, comments: { orderBy: { createdAt: "asc" } } },
  });
  return NextResponse.json(post);
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  if (!(await postInWorkspace(id, session.wid))) return notFound();

  await prisma.post.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
