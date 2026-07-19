import { randomBytes } from "node:crypto";

/**
 * Share-link tokens are the only thing protecting a client's review page —
 * there is no login on that surface — so they must be unguessable. 24 random
 * bytes (~192 bits) rendered base64url, which is not brute-forceable.
 */
export function newShareToken(): string {
  return randomBytes(24).toString("base64url");
}
