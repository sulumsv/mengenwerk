import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, istAngemeldet } from "@/lib/auth";
import { entfernePlan, istHash, ladePlan } from "@/lib/plan-archiv";

/** Gespeichertes Ergebnis eines Plans, 404 wenn er noch nie ausgewertet wurde. */
export async function GET(req: NextRequest, ctx: RouteContext<"/api/plaene/[hash]">) {
  if (!(await istAngemeldet(req.cookies.get(AUTH_COOKIE)?.value))) {
    return NextResponse.json({ fehler: "Nicht angemeldet." }, { status: 401 });
  }
  const { hash } = await ctx.params;
  if (!istHash(hash)) return NextResponse.json({ fehler: "Ungültig." }, { status: 400 });
  const roh = await ladePlan(hash);
  if (!roh) return NextResponse.json({ fehler: "Nicht gefunden." }, { status: 404 });
  return new NextResponse(roh, { headers: { "content-type": "application/json" } });
}

export async function DELETE(req: NextRequest, ctx: RouteContext<"/api/plaene/[hash]">) {
  if (!(await istAngemeldet(req.cookies.get(AUTH_COOKIE)?.value))) {
    return NextResponse.json({ fehler: "Nicht angemeldet." }, { status: 401 });
  }
  const { hash } = await ctx.params;
  if (!istHash(hash)) return NextResponse.json({ fehler: "Ungültig." }, { status: 400 });
  return NextResponse.json({ geloescht: await entfernePlan(hash) });
}
