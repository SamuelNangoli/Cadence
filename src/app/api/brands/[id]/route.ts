import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { brandInWorkspace, notFound, requireSession } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  if (!(await brandInWorkspace(id, session.wid))) return notFound();

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
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  if (!(await brandInWorkspace(id, session.wid))) return notFound();

  await prisma.brand.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
