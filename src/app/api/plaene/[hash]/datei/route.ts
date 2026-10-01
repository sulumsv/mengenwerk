import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, istAngemeldet } from "@/lib/auth";
import { istHash, ladePlanDatei, speicherePlanDatei } from "@/lib/plan-archiv";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Die hochgeladene Originaldatei eines Plans, höchstens 100 MB wie beim Upload selbst. */
const MAX_BYTE = 100 * 1024 * 1024;

/** Liefert die Originaldatei, damit sie im Konto als PDF angesehen werden kann. */
export async function GET(req: NextRequest, ctx: RouteContext<"/api/plaene/[hash]/datei">) {
  if (!(await istAngemeldet(req.cookies.get(AUTH_COOKIE)?.value))) {
    return NextResponse.json({ fehler: "Nicht angemeldet." }, { status: 401 });
  }
  const { hash } = await ctx.params;
  if (!istHash(hash)) return NextResponse.json({ fehler: "Ungültig." }, { status: 400 });
  const datei = await ladePlanDatei(hash);
  if (!datei) return NextResponse.json({ fehler: "Nicht gefunden." }, { status: 404 });
  return new NextResponse(datei.bytes as BodyInit, {
    headers: { "content-type": datei.typ, "content-disposition": "inline" },
  });
}

/** Legt die hochgeladene Originaldatei zu einem bereits ausgewerteten Plan ab. */
export async function PUT(req: NextRequest, ctx: RouteContext<"/api/plaene/[hash]/datei">) {
  if (!(await istAngemeldet(req.cookies.get(AUTH_COOKIE)?.value))) {
    return NextResponse.json({ fehler: "Nicht angemeldet." }, { status: 401 });
  }
  const { hash } = await ctx.params;
  if (!istHash(hash)) return NextResponse.json({ fehler: "Ungültig." }, { status: 400 });

  const laenge = Number(req.headers.get("content-length") ?? 0);
  if (laenge > MAX_BYTE) return NextResponse.json({ fehler: "Zu groß." }, { status: 413 });

  const typ = req.headers.get("content-type") ?? "application/octet-stream";
  const bytes = new Uint8Array(await req.arrayBuffer());
  if (bytes.byteLength === 0) return NextResponse.json({ fehler: "Leere Datei." }, { status: 400 });

  const gespeichert = await speicherePlanDatei(hash, bytes, typ);
  return NextResponse.json({ gespeichert });
}
