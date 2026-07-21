import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getIdeaGenerator } from "@/lib/services/ideas";
import type { Platform } from "@/lib/platforms";
import { notFound, requireSession } from "@/lib/session";

export async function POST(req: Request) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const { brandId, count } = await req.json();
  const brand = await prisma.brand.findFirst({
    where: { id: brandId, workspaceId: session.wid },
    include: { channels: true },
  });
  if (!brand) return notFound();

  const ideas = await getIdeaGenerator().generate(
    {
      brandName: brand.name,
      industry: brand.industry,
      description: brand.description,
      platforms: brand.channels.map((c) => c.platform as Platform),
    },
    count ?? 6
  );

  return NextResponse.json({ ideas });
}
