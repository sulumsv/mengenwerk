import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, istAngemeldet } from "@/lib/auth";
import { lese, speichere } from "@/lib/datenspeicher";
import { lerne, START_MODELL, type DauerProbe } from "@/lib/dauer-modell";
import { MODELL } from "@/lib/analyze";

const DATEI = "system/dauer-proben.json";
const MAX_PROBEN = 300;

async function ladeProben(): Promise<DauerProbe[]> {
  const roh = await lese(DATEI);
  if (!roh) return [];
  try {
    const daten = JSON.parse(roh) as { proben?: DauerProbe[] };
    return Array.isArray(daten.proben) ? daten.proben : [];
  } catch {
    return [];
  }
}

/** Gelerntes Modell für das aktuell verwendete KI-Modell. */
export async function GET(req: NextRequest) {
  if (!(await istAngemeldet(req.cookies.get(AUTH_COOKIE)?.value))) {
    return NextResponse.json(START_MODELL);
  }
  const proben = (await ladeProben()).filter((p) => p.modell === MODELL);
  return NextResponse.json(lerne(proben));
}

/** Nimmt eine gemessene Laufzeit auf. */
export async function POST(req: NextRequest) {
  if (!(await istAngemeldet(req.cookies.get(AUTH_COOKIE)?.value))) {
    return NextResponse.json({ fehler: "Nicht angemeldet." }, { status: 401 });
  }
  const body = (await req.json().catch(() => null)) as Partial<DauerProbe> | null;
  const blaetter = Number(body?.blaetter);
  const kacheln = Number(body?.kacheln);
  const sekunden = Number(body?.sekunden);
  if (![blaetter, kacheln, sekunden].every(Number.isFinite) || blaetter < 1 || blaetter > 50 || kacheln < 0 || sekunden <= 0) {
    return NextResponse.json({ fehler: "Ungültige Messung." }, { status: 400 });
  }
  const proben = await ladeProben();
  proben.push({ blaetter, kacheln, sekunden, modell: MODELL, zeit: new Date().toISOString() });
  const gespeichert = await speichere(DATEI, JSON.stringify({ proben: proben.slice(-MAX_PROBEN) }));
  return NextResponse.json({ gespeichert });
}
