import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const body = await req.json();
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
