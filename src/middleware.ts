import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { JWT_SECRET_ENCODED } from "./lib/constants";

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
      authHeader === `Bearer ${scannerApiKey}`
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
