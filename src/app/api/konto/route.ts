import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, istAngemeldet } from "@/lib/auth";

/** Ob der Besucher angemeldet ist. Die Kopfzeile zeigt danach Konto oder Anmelden. */
export async function GET(req: NextRequest) {
  return NextResponse.json({ angemeldet: await istAngemeldet(req.cookies.get(AUTH_COOKIE)?.value) });
}

/** Abmelden: das Anmelde-Cookie löschen. */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
