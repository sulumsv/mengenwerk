import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, istAngemeldet } from "@/lib/auth";
import { ladeProfil, speichereProfil, type Profil } from "@/lib/plan-archiv";

const FELDER: (keyof Profil)[] = ["firma", "name", "email", "telefon", "gewerk", "rolle", "website", "uid", "farbe"];

export async function GET(req: NextRequest) {
  if (!(await istAngemeldet(req.cookies.get(AUTH_COOKIE)?.value))) {
    return NextResponse.json({ fehler: "Nicht angemeldet." }, { status: 401 });
  }
  return NextResponse.json({ profil: await ladeProfil() });
}

export async function PUT(req: NextRequest) {
  if (!(await istAngemeldet(req.cookies.get(AUTH_COOKIE)?.value))) {
    return NextResponse.json({ fehler: "Nicht angemeldet." }, { status: 401 });
  }
  const body = (await req.json().catch(() => null)) as Partial<Profil> | null;
  if (!body) return NextResponse.json({ fehler: "Kein JSON." }, { status: 400 });
  const profil = Object.fromEntries(FELDER.map((f) => [f, String(body[f] ?? "").slice(0, 200)])) as unknown as Profil;
  return NextResponse.json({ gespeichert: await speichereProfil(profil) });
}
