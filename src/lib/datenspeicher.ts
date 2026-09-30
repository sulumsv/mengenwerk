import { AwsClient } from "aws4fetch";

/**
 * Ablage gesammelter Auswertungen in Cloudflare R2. Aus diesen Daten wächst
 * der Katalog aus Ebenennamen, Raumstempeln und typischen Fehlern, mit dem
 * die Erkennung besser wird. Läuft nur auf dem Server, die Schlüssel kommen
 * aus den Umgebungsvariablen.
 */

function konfiguration() {
  const konto = process.env.R2_ACCOUNT_ID;
  const schluessel = process.env.R2_ACCESS_KEY_ID;
  const geheim = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;
  if (!konto || !schluessel || !geheim || !bucket) return null;
  return { konto, bucket, client: new AwsClient({ accessKeyId: schluessel, secretAccessKey: geheim, service: "s3", region: "auto" }) };
}

// Ein Bucket mit EU-Gerichtsbarkeit hat eine eigene Adresse. Welche gilt,
// zeigt erst die erste Anfrage; danach bleibt sie für die Laufzeit gemerkt.
let gemerkteAdresse: string | null = null;

async function anfrage(pfad: string, init: RequestInit): Promise<Response> {
  const k = konfiguration();
  if (!k) throw new Error("R2 ist nicht eingerichtet.");
  const adressen = gemerkteAdresse
    ? [gemerkteAdresse]
    : [`https://${k.konto}.eu.r2.cloudflarestorage.com`, `https://${k.konto}.r2.cloudflarestorage.com`];

  let letzte: Response | null = null;
  for (const adresse of adressen) {
    const url = `${adresse}/${k.bucket}${pfad}`;
    try {
      const antwort = await k.client.fetch(url, init);
      if (antwort.ok) {
        gemerkteAdresse = adresse;
        return antwort;
      }
      letzte = antwort;
    } catch {
      // Adresse nicht erreichbar, nächste probieren.
    }
  }
  if (letzte) return letzte;
  throw new Error("R2 war nicht erreichbar.");
}

export function istEingerichtet(): boolean {
  return konfiguration() !== null;
}

export async function speichere(schluessel: string, inhalt: string | Uint8Array, typ = "application/json"): Promise<boolean> {
  if (!istEingerichtet()) return false;
  try {
    const antwort = await anfrage(`/${schluessel}`, {
      method: "PUT",
      body: inhalt as BodyInit,
      headers: { "content-type": typ },
    });
    if (!antwort.ok) console.error("R2 Speichern fehlgeschlagen", antwort.status, await antwort.text());
    return antwort.ok;
  } catch (fehler) {
    console.error("R2 Speichern fehlgeschlagen", fehler);
    return false;
  }
}

export async function lese(schluessel: string): Promise<string | null> {
  if (!istEingerichtet()) return null;
  try {
    const antwort = await anfrage(`/${schluessel}`, { method: "GET" });
    return antwort.ok ? await antwort.text() : null;
  } catch {
    return null;
  }
}

/** Prüft Zugang und Schreibrecht mit einer kleinen Testdatei. */
export async function pruefeVerbindung(): Promise<{ eingerichtet: boolean; verbunden: boolean; adresse: string | null }> {
  if (!istEingerichtet()) return { eingerichtet: false, verbunden: false, adresse: null };
  const ok = await speichere("system/verbindungstest.json", JSON.stringify({ zeit: new Date().toISOString() }));
  return { eingerichtet: true, verbunden: ok, adresse: gemerkteAdresse };
}

/** Tagesordner, damit sich die Daten später zeitlich auswerten lassen. */
export function tagesPfad(art: string, id: string): string {
  const jetzt = new Date();
  return `${art}/${jetzt.toISOString().slice(0, 10)}/${id}-${jetzt.getTime()}.json`;
}

/**
 * Entfernt, was auf ein konkretes Grundstück zeigt. Straßennamen tauchen in
 * Nachweisen auf ("Frontlänge ...gasse"), der Dateiname trägt oft die Adresse.
 */
export function anonymisiere<T>(wert: T): T {
  const ADRESSE = /\b[\wäöüß-]*(gasse|straße|strasse|weg|platz|allee|ring|zeile|kai|promenade)\b\s*\d*[a-z]?/gi;
  return JSON.parse(JSON.stringify(wert), (k, v) => {
    if (k === "dateiname") return undefined;
    return typeof v === "string" ? v.replace(ADRESSE, "[Adresse]") : v;
  });
}
