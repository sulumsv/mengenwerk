import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "mw_auth";

async function hash(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const geschuetzt = pathname === "/app" || pathname.startsWith("/app/") || pathname.startsWith("/api/analyze");
  if (!geschuetzt) return NextResponse.next();

  const password = process.env.MENGENWERK_PASSWORD;
  if (!password) return NextResponse.next();

  const expected = await hash(password);
  const cookie = req.cookies.get(COOKIE_NAME)?.value;
  if (cookie === expected) return NextResponse.next();

  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/app", "/app/:path*", "/api/analyze"],
};
