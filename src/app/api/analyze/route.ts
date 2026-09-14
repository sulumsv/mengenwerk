import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { erkenneDateityp } from "@/lib/filetype";
import { pdfZuBildern } from "@/lib/pdf2img";
import { analysiereBildseiten, ZEITBUDGET_MS } from "@/lib/analyze";
import { gruppiereElemente } from "@/lib/group";
import { baueMassenauszug } from "@/lib/ableitung";
import { katalogInfo } from "@/lib/lbhb";
import { AUTH_COOKIE, istAngemeldet } from "@/lib/auth";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Obergrenze für die Anfrage. Geprüft wird vor dem Puffern über content-length;
 * die Prüfung der Dateigröße danach fängt nur noch gefälschte Header ab.
 */
const MAX_DATEIGROESSE = 40 * 1024 * 1024;

/** Mehr Blätter sind im Zeitrahmen nicht auswertbar. */
const MAX_BLAETTER = 20;

function fehler(nachricht: string, status: number) {
  return NextResponse.json({ fehler: nachricht }, { status });
}

/**
 * Übersetzt einen Fehler aus der Auswertung in eine Meldung, die sagt, was zu
 * tun ist. Rohe SDK-Texte helfen niemandem, der einen Plan hochgeladen hat.
 */
function auswertungsFehler(err: unknown): { nachricht: string; status: number } {
  if (err instanceof Anthropic.AuthenticationError) {
    return { nachricht: "Der hinterlegte ANTHROPIC_API_KEY wurde abgelehnt. Bitte den Schlüssel prüfen.", status: 500 };
  }
  if (err instanceof Anthropic.RateLimitError) {
    return {
      nachricht: "Das Kontingent der Anthropic API ist vorerst ausgeschöpft. Bitte in einigen Minuten erneut versuchen.",
      status: 503,
    };
  }
  if (err instanceof Anthropic.APIConnectionError) {
    return { nachricht: "Die Anthropic API war nicht erreichbar. Bitte erneut versuchen.", status: 503 };
  }
  if (err instanceof Anthropic.APIError) {
    return { nachricht: `Die Anthropic API hat die Anfrage abgelehnt (${err.status}).`, status: 502 };
  }
  if (err instanceof Error && err.message.includes("ANTHROPIC_API_KEY")) {
    return { nachricht: err.message, status: 500 };
  }
  return { nachricht: "Die Auswertung ist fehlgeschlagen. Bitte erneut versuchen.", status: 500 };
}

/**
 * Die Einheitspreise liegen im Browser des Betriebs und reisen nur für die
 * Dauer dieser Auswertung mit; gespeichert werden sie hier nicht. Übernommen
 * werden ausschließlich endliche, nicht negative Zahlen.
 */
function leseEinheitspreise(roh: FormDataEntryValue | null): Record<string, number> | undefined {
  if (typeof roh !== "string" || roh.length === 0) return undefined;
  try {
    const geparst: unknown = JSON.parse(roh);
    if (typeof geparst !== "object" || geparst === null) return undefined;
    return Object.fromEntries(
      Object.entries(geparst as Record<string, unknown>).filter(
        (eintrag): eintrag is [string, number] =>
          typeof eintrag[1] === "number" && Number.isFinite(eintrag[1]) && eintrag[1] >= 0,
      ),
    );
  } catch {
    return undefined;
  }
}

export async function POST(req: NextRequest) {
  // Ab hier läuft die Uhr der Route. Upload, PDF-Rendern und Antwort zählen
  // mit, deshalb steht die Frist vor allem anderen.
  const frist = Date.now() + ZEITBUDGET_MS;

  if (!(await istAngemeldet(req.cookies.get(AUTH_COOKIE)?.value))) {
    return fehler("Nicht angemeldet.", 401);
  }

  // Vor dem Puffern prüfen: formData() liest den gesamten Body in den Speicher,
  // eine Größenprüfung danach kommt zu spät.
  const laenge = Number(req.headers.get("content-length") ?? 0);
  if (laenge > MAX_DATEIGROESSE) {
    const mb = Math.round(MAX_DATEIGROESSE / 1024 / 1024);
    return fehler(`Die Anfrage ist größer als ${mb} MB. Bitte den Plansatz verkleinern oder aufteilen.`, 413);
  }

  // formData() wirft bei fehlendem oder unlesbarem Body; ohne diesen Fang
  // beantwortet die Route das mit einem nackten 500er.
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return fehler("Die Anfrage enthielt kein lesbares Formular.", 400);
  }
  const datei = formData.get("plan");

  if (!datei || !(datei instanceof File)) {
    return fehler("Keine Datei übermittelt.", 400);
  }
  if (datei.size === 0) {
    return fehler("Die Datei ist leer.", 400);
  }
  if (datei.size > MAX_DATEIGROESSE) {
    const mb = Math.round(MAX_DATEIGROESSE / 1024 / 1024);
    return fehler(`Die Datei ist größer als ${mb} MB. Bitte den Plansatz verkleinern oder aufteilen.`, 413);
  }

  const einheitspreise = leseEinheitspreise(formData.get("einheitspreise"));
  const buf = Buffer.from(await datei.arrayBuffer());
  const dateityp = await erkenneDateityp(buf, datei.name);

  if (dateityp === "dwg") {
    return fehler("DWG/DXF wird noch nicht unterstützt. Bitte als PDF exportieren.", 400);
  }

  let bilder: Buffer[];
  try {
    bilder = dateityp === "bild" ? [buf] : await pdfZuBildern(buf);
  } catch (err) {
    console.error("PDF konnte nicht gerendert werden", err);
    return fehler(
      "Das PDF konnte nicht in Bilder umgewandelt werden. Möglicherweise ist es beschädigt oder passwortgeschützt.",
      422,
    );
  }

  if (bilder.length === 0) {
    return fehler("Der Plansatz enthält keine lesbaren Seiten.", 422);
  }
  if (bilder.length > MAX_BLAETTER) {
    return fehler(
      `Der Plansatz hat ${bilder.length} Blätter. Im Zeitrahmen sind höchstens ${MAX_BLAETTER} auswertbar — bitte aufteilen.`,
      413,
    );
  }

  try {
    const analyse = await analysiereBildseiten(bilder, datei.name, dateityp, frist);
    const gruppen = gruppiereElemente(analyse.elemente);
    const massenauszug = baueMassenauszug(analyse.raeume, analyse.elemente, analyse.kontext, einheitspreise);
    return NextResponse.json({ analyse, gruppen, massenauszug, katalog: katalogInfo() });
  } catch (err) {
    console.error("Auswertung fehlgeschlagen", err);
    const { nachricht, status } = auswertungsFehler(err);
    return fehler(nachricht, status);
  }
}
