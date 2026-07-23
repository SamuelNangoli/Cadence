import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { AUTH_COOKIE, SESSION_MAX_AGE_SECONDS, createToken } from "@/lib/auth";
import { clientIp, rateLimit, tooMany } from "@/lib/rate-limit";

/** Finish a password reset: exchange a valid one-time token for a new password. */
export async function POST(req: Request) {
  const rl = await rateLimit("reset-password", clientIp(req), 10, 60 * 60 * 1000);
  if (!rl.ok) return tooMany(rl.retryAfterSeconds);

  let body: { token?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const token = body.token ?? "";
  const password = body.password ?? "";
  if (!token) return NextResponse.json({ error: "This reset link is invalid." }, { status: 400 });
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const user = await prisma.user.findFirst({
    where: {
      resetTokenHash: createHash("sha256").update(token).digest("hex"),
      resetTokenExpires: { gt: new Date() },
    },
  });
  if (!user) {
    return NextResponse.json(
      { error: "This reset link is invalid or has expired. Request a new one." },
      { status: 400 }
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await hashPassword(password),
      // One-time use.
      resetTokenHash: null,
      resetTokenExpires: null,
    },
  });

  // Sign them straight in — they just proved control of the email.
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
