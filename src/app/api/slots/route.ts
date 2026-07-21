import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { brandInWorkspace, notFound, requireSession } from "@/lib/session";

export async function POST(req: Request) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const body = await req.json();
  if (!body.brandId || !(await brandInWorkspace(body.brandId, session.wid))) return notFound();

  const slot = await prisma.recurringSlot.create({
    data: {
      brandId: body.brandId,
      weekday: body.weekday,
      hour: body.hour,
      minute: body.minute ?? 0,
      label: body.label,
      platform: body.platform,
      contentType: body.contentType ?? "image",
    },
  });
  return NextResponse.json(slot, { status: 201 });
}
