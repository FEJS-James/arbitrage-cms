import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { JWT_SECRET_ENCODED } from "./lib/constants";

/** Constant-time string comparison using Web Crypto (Edge-compatible). */
async function timingSafeCompare(a: string, b: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const aBuf = encoder.encode(a);
  const bBuf = encoder.encode(b);
  if (aBuf.length !== bBuf.length) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    aBuf,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, aBuf);
  const sig2 = await crypto.subtle.sign("HMAC", key, bBuf);
  const s1 = new Uint8Array(sig);
  const s2 = new Uint8Array(sig2);
  let diff = 0;
  for (let i = 0; i < s1.length; i++) diff |= s1[i] ^ s2[i];
  return diff === 0;
}

const publicPaths = ["/login", "/api/auth"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths and static assets
  if (
    publicPaths.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Allow API requests with a valid scanner API key
  if (pathname.startsWith("/api/")) {
    const authHeader = request.headers.get("authorization");
    const scannerApiKey = process.env.SCANNER_API_KEY;

    if (
      scannerApiKey &&
      authHeader &&
      (await timingSafeCompare(`Bearer ${scannerApiKey}`, authHeader))
    ) {
      return NextResponse.next();
    }
  }

  const token = request.cookies.get("auth_token")?.value;

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    await jwtVerify(token, JWT_SECRET_ENCODED);
    return NextResponse.next();
  } catch {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
