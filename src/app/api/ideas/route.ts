import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getIdeaGenerator } from "@/lib/services/ideas";
import type { Platform } from "@/lib/platforms";

export async function POST(req: Request) {
  const { brandId, count } = await req.json();
  const brand = await prisma.brand.findUniqueOrThrow({
    where: { id: brandId },
    include: { channels: true },
  });

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
