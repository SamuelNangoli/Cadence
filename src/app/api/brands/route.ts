import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const body = await req.json();
  const workspace = await prisma.workspace.findFirstOrThrow();
  const brand = await prisma.brand.create({
    data: {
      workspaceId: workspace.id,
      name: body.name,
      handle: body.handle ?? `@${String(body.name).toLowerCase().replace(/[^a-z0-9]/g, "")}`,
      industry: body.industry ?? "",
      description: body.description ?? "",
      accentColor: body.accentColor ?? "#4f46e5",
      channels: {
        create: (body.platforms ?? []).map((p: string) => ({
          platform: p,
          handle: body.handle ?? body.name,
          connected: true,
        })),
      },
    },
    include: { channels: true },
  });
  return NextResponse.json(brand, { status: 201 });
}
