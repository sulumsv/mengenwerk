import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, istAngemeldet } from "@/lib/auth";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (await istAngemeldet(req.cookies.get(AUTH_COOKIE)?.value)) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // Die Auswertungsroute fehlt hier bewusst: sie prüft selbst, damit ihr
  // Plan-Upload nicht durch den Puffer des Proxys muss.
  matcher: ["/app", "/app/:path*"],
};
