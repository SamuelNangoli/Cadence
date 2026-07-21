import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { newShareToken } from "@/lib/share-token";
import { requireSession } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    if (session instanceof NextResponse) return session;

    const body = await req.json();

    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json({ error: "A client name is required." }, { status: 400 });
    }

    // Note: plan client-limits are display-only until a payment processor is
    // wired up (Stripe isn't available in Uganda), so creation isn't capped.

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
