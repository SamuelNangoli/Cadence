import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { clientIp, rateLimit, tooMany } from "@/lib/rate-limit";

type Params = { params: Promise<{ token: string }> };

/**
 * Client decision on a post: { postId, decision: "approve" | "request_changes",
 * comment?, author? }. Validates the post belongs to the share link's brand.
 */
export async function POST(req: Request, { params }: Params) {
  const { token } = await params;

  // This route is public (clients act without an account), so throttle it:
  // 40 actions per 10 minutes per IP.
  const rl = await rateLimit("share-decision", clientIp(req), 40, 10 * 60 * 1000);
  if (!rl.ok) return tooMany(rl.retryAfterSeconds);

  const link = await prisma.shareLink.findUnique({ where: { token } });
  if (!link) return NextResponse.json({ error: "not found" }, { status: 404 });

  const { postId, decision, comment, author } = await req.json();
  const post = await prisma.post.findFirst({
    where: { id: postId, brandId: link.brandId },
  });
  if (!post) return NextResponse.json({ error: "post not found" }, { status: 404 });

  const approve = decision === "approve";
  const updated = await prisma.post.update({
    where: { id: postId },
    data: {
      approvalState: approve ? "approved" : "changes_requested",
      status: approve ? "approved" : "draft",
    },
    include: { variants: true, comments: { orderBy: { createdAt: "asc" } } },
  });

  if (comment) {
    await prisma.comment.create({
      data: {
        postId,
        author: author || "Client",
        authorType: "client",
        body: comment,
      },
    });
  }

  return NextResponse.json(updated);
}
