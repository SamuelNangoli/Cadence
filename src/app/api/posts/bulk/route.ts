import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/session";

/** Bulk operations: { ids, action: "status" | "delete" | "shift", status?, shiftDays? } */
export async function POST(req: Request) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const { ids, action, status, shiftDays } = await req.json();
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "ids required" }, { status: 400 });
  }

  // Every operation is scoped to the caller's workspace, so ids belonging to
  // another account are silently ignored rather than acted on.
  const scope = { id: { in: ids }, brand: { workspaceId: session.wid } };

  if (action === "delete") {
    await prisma.post.deleteMany({ where: scope });
  } else if (action === "status") {
    await prisma.post.updateMany({ where: scope, data: { status } });
  } else if (action === "shift") {
    const posts = await prisma.post.findMany({ where: scope });
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
