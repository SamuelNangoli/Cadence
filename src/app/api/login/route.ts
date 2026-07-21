import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { AUTH_COOKIE, SESSION_MAX_AGE_SECONDS, createToken } from "@/lib/auth";

/** Sign in with email + password, exchanging them for a signed session cookie. */
export async function POST(req: Request) {
  if (!process.env.AUTH_SECRET) {
    return NextResponse.json({ error: "AUTH_SECRET is not configured on the server." }, { status: 500 });
  }

  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";

  const user = await prisma.user.findUnique({ where: { email } });
  // Verify even when the user is missing, to keep timing uniform, then fail the
  // same way for "no such email" and "wrong password".
  const ok = user
    ? await verifyPassword(password, user.passwordHash)
    : (await verifyPassword(password, `${"0".repeat(32)}:${"0".repeat(128)}`), false);

  if (!user || !ok) {
    await new Promise((r) => setTimeout(r, 400));
    return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, await createToken({ uid: user.id, wid: user.workspaceId }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return res;
}

/** Sign out. */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
