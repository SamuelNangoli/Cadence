import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { AUTH_COOKIE, SESSION_MAX_AGE_SECONDS, createToken } from "@/lib/auth";
import { clientIp, rateLimit, tooMany } from "@/lib/rate-limit";

/**
 * Create an account. Gated by an invite code so strangers can't sign up on a
 * public deployment. Each new account gets its own workspace — fully isolated
 * from every other account.
 */
export async function POST(req: Request) {
  if (!process.env.AUTH_SECRET) {
    return NextResponse.json({ error: "AUTH_SECRET is not configured on the server." }, { status: 500 });
  }
  if (!process.env.INVITE_CODE) {
    return NextResponse.json({ error: "Signups are not enabled on this server." }, { status: 500 });
  }

  // Throttle invite-code guessing and signup abuse: 5 attempts per hour per IP.
  const rl = await rateLimit("register", clientIp(req), 5, 60 * 60 * 1000);
  if (!rl.ok) return tooMany(rl.retryAfterSeconds);

  let body: { email?: string; password?: string; name?: string; inviteCode?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";
  const name = (body.name ?? "").trim();

  // Invite code first — don't reveal anything else to someone without it.
  if (body.inviteCode !== process.env.INVITE_CODE) {
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json({ error: "Invalid invite code." }, { status: 403 });
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  if (await prisma.user.findUnique({ where: { email } })) {
    return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);

  // Create the workspace and its first user together.
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: name || null,
      workspace: { create: { name: name ? `${name}'s workspace` : "My workspace" } },
    },
  });

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
