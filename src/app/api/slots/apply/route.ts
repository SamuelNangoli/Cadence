import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Materialize a brand's recurring slots into draft posts for the next N weeks.
 * Skips slots that already have a post at that exact date/time for the brand.
 */
export async function POST(req: Request) {
  const { brandId, weeks } = await req.json();
  const slots = await prisma.recurringSlot.findMany({ where: { brandId } });
  const horizon = Math.min(Number(weeks) || 2, 8);

  const now = new Date();
  let created = 0;

  for (const slot of slots) {
    for (let w = 0; w < horizon; w++) {
      const d = new Date(now);
      // next occurrence of slot.weekday, w weeks out
      const delta = (slot.weekday - d.getDay() + 7) % 7;
      d.setDate(d.getDate() + delta + w * 7);
      d.setHours(slot.hour, slot.minute, 0, 0);
      if (d <= now) continue;

      const exists = await prisma.post.findFirst({
        where: { brandId, scheduledAt: d },
      });
      if (exists) continue;

      await prisma.post.create({
        data: {
          brandId,
          title: slot.label,
          contentType: slot.contentType,
          status: "draft",
          scheduledAt: d,
          mediaEmoji: "🗓️",
          variants: { create: [{ platform: slot.platform, copy: "" }] },
        },
      });
      created++;
    }
  }

  return NextResponse.json({ created });
}
