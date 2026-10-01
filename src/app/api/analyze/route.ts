import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { analysiereBildseiten, ZEITBUDGET_MS } from "@/lib/analyze";
import { gruppiereElemente } from "@/lib/group";
import { baueMassenauszug } from "@/lib/ableitung";
import { katalogInfo } from "@/lib/lbhb";
import { AUTH_COOKIE, istAngemeldet } from "@/lib/auth";
import { regelnLesen, speichere } from "@/lib/datenspeicher";
import { MAX_BLAETTER } from "@/lib/einstellungen";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Obergrenze für die Anfrage. Geprüft wird vor dem Puffern über content-length.
 * Die Blätter kommen bereits als komprimierte Bilder aus dem Browser, ein
 * üblicher Plansatz liegt weit darunter.
 */
const MAX_ANFRAGE = 20 * 1024 * 1024;

/** Mehr Blätter sind im Zeitrahmen nicht auswertbar. */

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
    const grund = (err.error as { error?: { message?: string } } | undefined)?.error?.message;
    const hinweis = /credit balance/i.test(grund ?? "")
      ? " Das Guthaben in der Anthropic Console reicht nicht. Unter Settings, Billing aufladen."
      : grund
        ? ` Grund: ${grund}`
        : "";
    return { nachricht: `Die Anthropic API hat die Anfrage abgelehnt (${err.status}).${hinweis}`, status: 502 };
  }
  if (err instanceof Error && err.message.includes("ANTHROPIC_API_KEY")) {
    return { nachricht: err.message, status: 500 };
  }
  return { nachricht: "Die Auswertung ist fehlgeschlagen. Bitte erneut versuchen.", status: 500 };
}

export async function POST(req: NextRequest) {
  // Ab hier läuft die Uhr der Route. Upload, Auswertung und Antwort zählen mit.
  const frist = Date.now() + ZEITBUDGET_MS;

  if (!(await istAngemeldet(req.cookies.get(AUTH_COOKIE)?.value))) {
    return fehler("Nicht angemeldet.", 401);
  }

  // Vor dem Puffern prüfen: formData() liest den gesamten Body in den Speicher,
  // eine Größenprüfung danach kommt zu spät.
  const laenge = Number(req.headers.get("content-length") ?? 0);
  if (laenge > MAX_ANFRAGE) {
    const mb = Math.round(MAX_ANFRAGE / 1024 / 1024);
    return fehler(`Die Anfrage ist größer als ${mb} MB. Bitte den Plansatz aufteilen.`, 413);
  }

  // formData() wirft bei fehlendem oder unlesbarem Body; ohne diesen Fang
  // beantwortet die Route das mit einem nackten 500er.
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return fehler("Die Anfrage enthielt kein lesbares Formular.", 400);
  }

  // Die Blätter kommen als Bilder aus dem Browser, dort wird ein PDF bereits
  // seitenweise gerendert. Der Server braucht dafür keine Grafikbibliothek.
  const blaetter = formData.getAll("blatt").filter((b): b is File => b instanceof File);
  if (blaetter.length === 0) {
    return fehler("Keine Planseiten übermittelt.", 400);
  }
  if (blaetter.length > MAX_BLAETTER) {
    return fehler(
      `Der Plansatz hat ${blaetter.length} Blätter. Im Zeitrahmen sind höchstens ${MAX_BLAETTER} auswertbar, bitte aufteilen.`,
      413,
    );
  }

  const dateiname = String(formData.get("dateiname") ?? "Plansatz");
  const bilder = await Promise.all(blaetter.map(async (b) => Buffer.from(await b.arrayBuffer())));
  const kacheln = await Promise.all(
    blaetter.map((_, i) =>
      Promise.all(
        formData
          .getAll(`kachel-${i}`)
          .filter((k): k is File => k instanceof File)
          .map(async (k) => Buffer.from(await k.arrayBuffer())),
      ),
    ),
  );

  // Den Plan selbst nur mit ausdrücklicher Zustimmung ablegen.
  const auswertungId = String(formData.get("auswertungId") ?? "");
  if (formData.get("planSpeichern") === "1" && /^[\w-]{8,64}$/.test(auswertungId)) {
    const tag = new Date().toISOString().slice(0, 10);
    await Promise.all(
      bilder.map((b, i) => speichere(`plaene/${tag}/${auswertungId}/blatt-${i + 1}.jpg`, new Uint8Array(b), "image/jpeg")),
    );
  }

  try {
    // Bei jeder Auswertung das bisher Gelernte mitgeben, statt es nur
    // abzulegen: so wird die Erkennung mit jedem gespeicherten Fund besser.
    const regeln = (await regelnLesen()).flatMap((r) => r.regel);
    const analyse = await analysiereBildseiten(bilder, dateiname, "bild", frist, kacheln, regeln);
    const gruppen = gruppiereElemente(analyse.elemente);
    const massenauszug = baueMassenauszug(analyse.raeume, analyse.elemente, analyse.kontext);
    return NextResponse.json({ analyse, gruppen, massenauszug, katalog: katalogInfo() });
  } catch (err) {
    console.error("Auswertung fehlgeschlagen", err);
    const { nachricht, status } = auswertungsFehler(err);
    return fehler(nachricht, status);
  }
}
