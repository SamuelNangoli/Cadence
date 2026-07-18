import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const { author, authorType, body } = await req.json();
  const comment = await prisma.comment.create({
    data: { postId: id, author: author || "You", authorType: authorType ?? "team", body },
  });
  return NextResponse.json(comment, { status: 201 });
}
