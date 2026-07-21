/**
 * Server-side session access for API routes. Reads the signed cookie and
 * resolves the caller's workspace, so every data query can be scoped to the
 * account that owns it.
 */
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "./db";
import { AUTH_COOKIE, verifySession, type Session } from "./auth";

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  return verifySession(token);
}

/**
 * Resolve the session or return a 401 to send back. Usage:
 *   const s = await requireSession();
 *   if (s instanceof NextResponse) return s;
 *   // s.wid is the caller's workspace
 */
export async function requireSession(): Promise<Session | NextResponse> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  return session;
}

/** True if the brand exists and belongs to the given workspace. */
export async function brandInWorkspace(brandId: string, wid: string): Promise<boolean> {
  const brand = await prisma.brand.findFirst({ where: { id: brandId, workspaceId: wid }, select: { id: true } });
  return !!brand;
}

/** True if the post exists and its brand belongs to the given workspace. */
export async function postInWorkspace(postId: string, wid: string): Promise<boolean> {
  const post = await prisma.post.findFirst({ where: { id: postId, brand: { workspaceId: wid } }, select: { id: true } });
  return !!post;
}

/** 404 for cross-tenant access — indistinguishable from a record that doesn't exist. */
export function notFound() {
  return NextResponse.json({ error: "Not found." }, { status: 404 });
}
