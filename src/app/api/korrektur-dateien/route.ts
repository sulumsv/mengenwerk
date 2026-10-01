import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, istAngemeldet } from "@/lib/auth";
import { analysiereBildseiten, ZEITBUDGET_MS } from "@/lib/analyze";
import { regelnLesen } from "@/lib/datenspeicher";
import { MAX_BLAETTER } from "@/lib/einstellungen";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_ANFRAGE = 20 * 1024 * 1024;

/**
 * Liest nachgereichte Unterlagen (z.B. eine fehlende Fenster- und Türliste)
 * und liefert nur die daraus neu erkannten Räume und Bauteile zurück. Der
 * Client fügt sie dem bestehenden Ergebnis hinzu, statt den ganzen
 * Einreichplan nochmal auszuwerten.
 */
export async function POST(req: NextRequest) {
  const frist = Date.now() + ZEITBUDGET_MS;
  if (!(await istAngemeldet(req.cookies.get(AUTH_COOKIE)?.value))) {
    return NextResponse.json({ fehler: "Nicht angemeldet." }, { status: 401 });
  }

  const laenge = Number(req.headers.get("content-length") ?? 0);
  if (laenge > MAX_ANFRAGE) {
    return NextResponse.json({ fehler: "Die Anfrage ist zu groß. Bitte weniger oder kleinere Dateien hochladen." }, { status: 413 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ fehler: "Die Anfrage enthielt kein lesbares Formular." }, { status: 400 });
  }

  const blaetter = formData.getAll("blatt").filter((b): b is File => b instanceof File);
  if (blaetter.length === 0) {
    return NextResponse.json({ fehler: "Keine Dateien übermittelt." }, { status: 400 });
  }
  if (blaetter.length > MAX_BLAETTER) {
    return NextResponse.json({ fehler: `Höchstens ${MAX_BLAETTER} Blätter je Nachreichung möglich.` }, { status: 413 });
  }

  const dateiname = String(formData.get("dateiname") ?? "Nachreichung");
  const bilder = await Promise.all(blaetter.map(async (b) => Buffer.from(await b.arrayBuffer())));

  try {
    const regeln = (await regelnLesen()).flatMap((r) => r.regel);
    const analyse = await analysiereBildseiten(bilder, dateiname, "bild", frist, [], regeln);
    return NextResponse.json({ raeume: analyse.raeume, elemente: analyse.elemente, hinweise: analyse.hinweise });
  } catch (err) {
    console.error("Nachreichung fehlgeschlagen", err);
    return NextResponse.json({ fehler: "Die nachgereichten Dateien konnten nicht ausgewertet werden." }, { status: 502 });
  }
}
