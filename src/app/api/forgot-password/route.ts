import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { appUrl, emailConfigured, sendEmail } from "@/lib/email";
import { clientIp, rateLimit, tooMany } from "@/lib/rate-limit";

const RESET_TTL_MS = 60 * 60 * 1000; // links live for one hour

/**
 * Start a password reset: email the user a one-time link. The response is the
 * same whether or not the email exists, so the endpoint can't be used to
 * discover which addresses have accounts.
 */
export async function POST(req: Request) {
  if (!emailConfigured()) {
    return NextResponse.json(
      { error: "Password reset emails aren't set up on this server yet — contact whoever runs your Cadence." },
      { status: 503 }
    );
  }

  // Tight limit: reset emails are a spam vector.
  const rl = await rateLimit("forgot-password", clientIp(req), 5, 60 * 60 * 1000);
  if (!rl.ok) return tooMany(rl.retryAfterSeconds);

  let email = "";
  try {
    email = String((await req.json())?.email ?? "").trim().toLowerCase();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!email) return NextResponse.json({ error: "Enter your email address." }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const token = randomBytes(32).toString("base64url");
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetTokenHash: createHash("sha256").update(token).digest("hex"),
        resetTokenExpires: new Date(Date.now() + RESET_TTL_MS),
      },
    });

    const link = `${appUrl()}/reset-password?token=${token}`;
    await sendEmail(
      email,
      "Reset your Cadence password",
      `<div style="font-family:sans-serif;max-width:480px">
        <h2 style="margin:0 0 12px">Reset your password</h2>
        <p>Someone (hopefully you) asked to reset the password for this Cadence account.</p>
        <p style="margin:20px 0">
          <a href="${link}" style="background:#4f46e5;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">
            Choose a new password
          </a>
        </p>
        <p style="color:#666;font-size:13px">The link works once and expires in 1 hour.
        If you didn't ask for this, you can ignore this email — your password is unchanged.</p>
      </div>`
    );
  }

  // Same answer either way — no account enumeration.
  return NextResponse.json({
    ok: true,
    message: "If an account exists for that email, we've sent a reset link. Check your inbox.",
  });
}
