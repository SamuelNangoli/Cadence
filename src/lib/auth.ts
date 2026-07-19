/**
 * Password gate for the manager-facing app.
 *
 * The session cookie is an HMAC-signed expiry stamp, so it cannot be forged
 * without the secret — a plain "loggedIn=true" cookie would be trivially
 * spoofable. Uses Web Crypto so it works under either runtime.
 *
 * Note: client approval links (/share/...) are intentionally NOT gated —
 * clients approve content without an account, by design.
 */

export const AUTH_COOKIE = "cadence_session";

/** How long a login lasts before the user has to re-enter the password. */
const SESSION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function secret(): string {
  const s = process.env.APP_PASSWORD;
  if (!s) throw new Error("APP_PASSWORD is not set");
  return s;
}

function b64url(bytes: ArrayBuffer): string {
  const bin = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sign(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return b64url(sig);
}

/** Length-independent comparison, to avoid leaking equality via timing. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Verify a submitted password against APP_PASSWORD. */
export function checkPassword(submitted: string): boolean {
  const expected = process.env.APP_PASSWORD;
  if (!expected) return false;
  return safeEqual(submitted, expected);
}

/** Mint a signed session token that expires on its own. */
export async function createToken(): Promise<string> {
  const exp = String(Date.now() + SESSION_MS);
  return `${exp}.${await sign(exp)}`;
}

/** True only for a well-formed, unexpired, correctly-signed token. */
export async function verifyToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const dot = token.lastIndexOf(".");
  if (dot < 1) return false;

  const exp = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  const expiresAt = Number(exp);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;

  try {
    return safeEqual(sig, await sign(exp));
  } catch {
    return false;
  }
}

export const SESSION_MAX_AGE_SECONDS = SESSION_MS / 1000;
