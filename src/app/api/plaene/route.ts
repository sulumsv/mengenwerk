import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, istAngemeldet } from "@/lib/auth";
import { istHash, ladeVerzeichnis, speicherePlan } from "@/lib/plan-archiv";

const MAX_BYTE = 4 * 1024 * 1024;

/** Liste der ausgewerteten Pläne. 401 heißt nicht angemeldet, das nutzt auch die Kopfzeile. */
export async function GET(req: NextRequest) {
  if (!(await istAngemeldet(req.cookies.get(AUTH_COOKIE)?.value))) {
    return NextResponse.json({ fehler: "Nicht angemeldet." }, { status: 401 });
  }
  return NextResponse.json({ plaene: await ladeVerzeichnis() });
}

/** Legt das Ergebnis einer Auswertung im Konto ab. */
export async function POST(req: NextRequest) {
  if (!(await istAngemeldet(req.cookies.get(AUTH_COOKIE)?.value))) {
    return NextResponse.json({ fehler: "Nicht angemeldet." }, { status: 401 });
  }
  const roh = await req.text();
  if (roh.length > MAX_BYTE) return NextResponse.json({ fehler: "Zu groß." }, { status: 413 });
  let body: {
    hash?: string;
    name?: string;
    dauer_s?: number;
    ergebnis?: {
      analyse?: {
        seiten?: number;
        verbrauch?: { kostenUsd?: number | null };
        raeume?: { flaeche_m2?: number }[];
        kontext?: { projekt?: { bezeichnung?: string | null; planart?: string | null } };
      };
      massenauszug?: { abschnitte?: { positionen?: unknown[] }[] };
      quelle?: string;
    };
  };
  try {
    body = JSON.parse(roh);
  } catch {
    return NextResponse.json({ fehler: "Kein JSON." }, { status: 400 });
  }
  if (!body.hash || !istHash(body.hash) || !body.ergebnis?.analyse) {
    return NextResponse.json({ fehler: "Ungültige Angaben." }, { status: 400 });
  }
  const gespeichert = await speicherePlan(
    {
      hash: body.hash,
      name: String(body.name ?? "Plan").slice(0, 200),
      datum: new Date().toISOString(),
      seiten: Number(body.ergebnis.analyse.seiten ?? 1),
      kostenUsd: body.ergebnis.analyse.verbrauch?.kostenUsd ?? null,
      quelle: body.ergebnis.quelle ?? "ki",
      flaeche_m2: (body.ergebnis.analyse.raeume ?? []).reduce((s, r) => s + (Number(r.flaeche_m2) || 0), 0),
      positionen: (body.ergebnis.massenauszug?.abschnitte ?? []).reduce((s, a) => s + (a.positionen?.length ?? 0), 0),
      dauer_s: Number.isFinite(Number(body.dauer_s)) ? Math.round(Number(body.dauer_s)) : undefined,
      bezeichnung: body.ergebnis.analyse.kontext?.projekt?.bezeichnung || undefined,
      planart: body.ergebnis.analyse.kontext?.projekt?.planart || undefined,
    },
    body.ergebnis,
  );
  return NextResponse.json({ gespeichert });
}
