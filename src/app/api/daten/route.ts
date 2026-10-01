import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, istAngemeldet } from "@/lib/auth";
import { anonymisiere, pruefeVerbindung, speichere, tagesPfad } from "@/lib/datenspeicher";

/**
 * "regel": destillierte Erkenntnisse aus echten Plänen, mit Begründung und
 * Rechenweg, nicht nur Rohdaten. Grundlage für ein eigenes, feineres Modell,
 * das Mengen auf Basis dieser gesammelten Regeln statt allein aus der
 * Bildbeschreibung ableitet.
 */
const ARTEN = new Set(["auswertung", "korrektur", "cad", "regel"]);
const MAX_BYTE = 512 * 1024;

/** Zeigt, ob der Datenspeicher eingerichtet ist und Schreibzugriff hat. */
export async function GET(req: NextRequest) {
  if (!(await istAngemeldet(req.cookies.get(AUTH_COOKIE)?.value))) {
    return NextResponse.json({ fehler: "Nicht angemeldet." }, { status: 401 });
  }
  return NextResponse.json(await pruefeVerbindung());
}

/** Nimmt Auswertungen, Korrekturen und CAD-Ebenen aus dem Browser entgegen. */
export async function POST(req: NextRequest) {
  if (!(await istAngemeldet(req.cookies.get(AUTH_COOKIE)?.value))) {
    return NextResponse.json({ fehler: "Nicht angemeldet." }, { status: 401 });
  }
  const roh = await req.text();
  if (roh.length > MAX_BYTE) return NextResponse.json({ fehler: "Zu groß." }, { status: 413 });

  let body: { art?: string; id?: string; daten?: unknown };
  try {
    body = JSON.parse(roh);
  } catch {
    return NextResponse.json({ fehler: "Kein JSON." }, { status: 400 });
  }
  const { art, id, daten } = body;
  if (!art || !ARTEN.has(art) || !id || !/^[\w-]{8,64}$/.test(id)) {
    return NextResponse.json({ fehler: "Ungültige Angaben." }, { status: 400 });
  }

  const gespeichert = await speichere(
    tagesPfad(art, id),
    JSON.stringify({ art, id, zeit: new Date().toISOString(), daten: anonymisiere(daten) }),
  );
  return NextResponse.json({ gespeichert });
}
