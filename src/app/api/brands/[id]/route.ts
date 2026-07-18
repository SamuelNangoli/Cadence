import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const data: Record<string, unknown> = {};
  for (const key of ["name", "handle", "industry", "description", "accentColor"]) {
    if (body[key] !== undefined) data[key] = body[key];
  }
  const brand = await prisma.brand.update({
    where: { id },
    data,
    include: { channels: true },
  });
  return NextResponse.json(brand);
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  await prisma.brand.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
