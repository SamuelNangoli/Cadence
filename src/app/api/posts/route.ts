import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { brandInWorkspace, notFound, requireSession } from "@/lib/session";

export async function POST(req: Request) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const body = await req.json();
  // The post's brand must belong to the caller's workspace.
  if (!body.brandId || !(await brandInWorkspace(body.brandId, session.wid))) return notFound();

  const post = await prisma.post.create({
    data: {
      brandId: body.brandId,
      title: body.title,
      contentType: body.contentType ?? "image",
      status: body.status ?? "draft",
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
      mediaEmoji: body.mediaEmoji ?? "",
      approvalState: body.approvalState ?? "none",
      variants: {
        create: (body.platforms ?? []).map((p: string) => ({
          platform: p,
          copy: body.copy?.[p] ?? "",
        })),
      },
    },
    include: { variants: true, comments: true },
  });
  return NextResponse.json(post, { status: 201 });
}
