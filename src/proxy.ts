import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE, verifyToken } from "@/lib/auth";

/**
 * Password gate. Everything manager-facing requires a session; the client
 * approval surface stays public because clients approve content without an
 * account — that's the product, not an oversight.
 */

/** Paths that must remain reachable without logging in. */
function isPublic(pathname: string): boolean {
  return (
    pathname === "/login" ||
    pathname === "/api/login" ||
    // Client review links + the API they read/write through.
    pathname.startsWith("/share/") ||
    pathname.startsWith("/api/share/")
  );
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (isPublic(pathname)) return NextResponse.next();

  const authed = await verifyToken(request.cookies.get(AUTH_COOKIE)?.value);
  if (authed) return NextResponse.next();

  // Unauthenticated API calls get a 401 rather than an HTML redirect, so the
  // client sees a usable error instead of parsing a login page as JSON.
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const login = new URL("/login", request.url);
  // Remember where they were headed so we can send them back after login.
  if (pathname !== "/") login.searchParams.set("next", pathname + search);
  return NextResponse.redirect(login);
}

export const config = {
  // Skip Next internals and static assets; everything else runs through the gate.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
