import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { notFound, requireSession } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  const slot = await prisma.recurringSlot.findFirst({
    where: { id, brand: { workspaceId: session.wid } },
    select: { id: true },
  });
  if (!slot) return notFound();

  await prisma.recurringSlot.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
