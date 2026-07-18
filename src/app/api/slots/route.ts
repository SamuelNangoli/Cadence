import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const body = await req.json();
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
