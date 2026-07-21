import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { notFound, postInWorkspace, requireSession } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  if (!(await postInWorkspace(id, session.wid))) return notFound();

  const { author, authorType, body } = await req.json();
  const comment = await prisma.comment.create({
    data: { postId: id, author: author || "You", authorType: authorType ?? "team", body },
  });
  return NextResponse.json(comment, { status: 201 });
}
