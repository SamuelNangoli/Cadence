import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  await prisma.recurringSlot.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
