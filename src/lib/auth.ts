/**
 * Session tokens for the multi-tenant app.
 *
 * A token is a signed payload carrying the user id and their workspace id, so
 * every request knows which account it belongs to. Signed with AUTH_SECRET via
 * Web Crypto, so this module is safe to import from the proxy (any runtime).
 *
 * Password hashing lives in ./password (Node crypto) and is imported only by
 * the login/register API routes.
 */

export const AUTH_COOKIE = "cadence_session";

const SESSION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
export const SESSION_MAX_AGE_SECONDS = SESSION_MS / 1000;

export interface Session {
  uid: string; // user id
  wid: string; // workspace id
}

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not set");
  return s;
}

function b64urlEncode(s: string): string {
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(s: string): string {
  const pad = s.length % 4 ? "=".repeat(4 - (s.length % 4)) : "";
  return atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
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
  return b64urlEncode(String.fromCharCode(...new Uint8Array(sig)));
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Mint a signed session token for a user + workspace. */
export async function createToken(session: Session): Promise<string> {
  const body = b64urlEncode(JSON.stringify({ ...session, exp: Date.now() + SESSION_MS }));
  return `${body}.${await sign(body)}`;
}

/** Return the session for a valid, unexpired, correctly-signed token, else null. */
export async function verifySession(token: string | undefined): Promise<Session | null> {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot < 1) return null;

  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  let expected: string;
  try {
    expected = await sign(body);
  } catch {
    return null;
  }
  if (!safeEqual(sig, expected)) return null;

  try {
    const data = JSON.parse(b64urlDecode(body));
    if (typeof data.exp !== "number" || Date.now() > data.exp) return null;
    if (typeof data.uid !== "string" || typeof data.wid !== "string") return null;
    return { uid: data.uid, wid: data.wid };
  } catch {
    return null;
  }
}
