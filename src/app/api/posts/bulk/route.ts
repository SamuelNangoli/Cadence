import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/** Bulk operations: { ids, action: "status" | "delete" | "shift", status?, shiftDays? } */
export async function POST(req: Request) {
  const { ids, action, status, shiftDays } = await req.json();
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "ids required" }, { status: 400 });
  }

  if (action === "delete") {
    await prisma.post.deleteMany({ where: { id: { in: ids } } });
  } else if (action === "status") {
    await prisma.post.updateMany({ where: { id: { in: ids } }, data: { status } });
  } else if (action === "shift") {
    const posts = await prisma.post.findMany({ where: { id: { in: ids } } });
    for (const p of posts) {
      if (!p.scheduledAt) continue;
      const d = new Date(p.scheduledAt);
      d.setDate(d.getDate() + Number(shiftDays));
      await prisma.post.update({ where: { id: p.id }, data: { scheduledAt: d } });
    }
  } else {
    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
