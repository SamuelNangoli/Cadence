import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { newShareToken } from "@/lib/share-token";
import { requireSession } from "@/lib/session";
import { planFor } from "@/lib/plans";

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    if (session instanceof NextResponse) return session;

    const body = await req.json();

    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json({ error: "A client name is required." }, { status: 400 });
    }

    // Enforce the plan's client limit.
    const workspace = await prisma.workspace.findUnique({
      where: { id: session.wid },
      select: { plan: true, _count: { select: { brands: true } } },
    });
    const plan = planFor(workspace?.plan);
    if (workspace && workspace._count.brands >= plan.clientLimit) {
      return NextResponse.json(
        {
          error: `Your ${plan.name} plan includes ${plan.clientLimit} client${plan.clientLimit === 1 ? "" : "s"}. Upgrade to add more.`,
          code: "plan_limit",
        },
        { status: 402 }
      );
    }

    const platforms: string[] = Array.isArray(body.platforms)
      ? [...new Set(body.platforms.filter((p: unknown) => typeof p === "string"))] as string[]
      : [];
    if (platforms.length === 0) {
      return NextResponse.json({ error: "Pick at least one channel." }, { status: 400 });
    }

    const handle =
      typeof body.handle === "string" && body.handle.trim()
        ? body.handle.trim()
        : `@${name.toLowerCase().replace(/[^a-z0-9]/g, "")}`;

    const brand = await prisma.brand.create({
      data: {
        workspaceId: session.wid,
        name,
        handle,
        industry: typeof body.industry === "string" ? body.industry : "",
        description: typeof body.description === "string" ? body.description : "",
        accentColor: typeof body.accentColor === "string" ? body.accentColor : "#4f46e5",
        channels: {
          create: platforms.map((platform) => ({
            platform,
            handle,
            connected: true,
          })),
        },
        // Every client gets an approval link up front — otherwise there is no
        // way to send them their content for review.
        shareLinks: { create: { token: newShareToken() } },
      },
      include: { channels: true, shareLinks: true },
    });

    return NextResponse.json(brand, { status: 201 });
  } catch (err) {
    // Surface the real reason instead of an opaque HTML 500 page.
    console.error("[POST /api/brands] failed:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Could not create the client: ${message}` }, { status: 500 });
  }
}
