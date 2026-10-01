import { AwsClient } from "aws4fetch";

/**
 * Ablage gesammelter Auswertungen in Cloudflare R2. Aus diesen Daten wächst
 * der Katalog aus Ebenennamen, Raumstempeln und typischen Fehlern, mit dem
 * die Erkennung besser wird. Läuft nur auf dem Server, die Schlüssel kommen
 * aus den Umgebungsvariablen.
 */

/** Umgebungsvariablen werden oft mit Leerzeichen, Anführungszeichen oder als ganze Adresse eingefügt. */
function sauber(wert: string | undefined): string | undefined {
  const s = wert?.trim().replace(/^["']|["']$/g, "").trim();
  return s ? s : undefined;
}

function konfiguration() {
  let konto = sauber(process.env.R2_ACCOUNT_ID);
  const schluessel = sauber(process.env.R2_ACCESS_KEY_ID);
  const geheim = sauber(process.env.R2_SECRET_ACCESS_KEY);
  let bucket = sauber(process.env.R2_BUCKET);
  // Ganze Adresse statt ID eingefügt: https://<id>.r2.cloudflarestorage.com/<bucket>
  const adresse = konto?.match(/([0-9a-f]{32})(?:\.eu)?\.r2\.cloudflarestorage\.com(?:\/([^/?#]+))?/i);
  if (adresse) {
    konto = adresse[1];
    bucket = bucket ?? adresse[2];
  }
  bucket = bucket?.replace(/^\/+|\/+$/g, "");
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

/**
 * Listet alle Schlüssel unter einem Präfix über die S3-kompatible
 * ListObjectsV2-API von R2. Folgt der Fortsetzungsmarke, bis alles
 * eingesammelt ist - ein Bucket mit tausenden Einträgen bleibt sonst
 * nach den ersten 1000 abgeschnitten.
 */
async function listeSchluessel(praefix: string): Promise<string[]> {
  const schluessel: string[] = [];
  let marke: string | null = null;
  for (;;) {
    const params = new URLSearchParams({ "list-type": "2", prefix: praefix });
    if (marke) params.set("continuation-token", marke);
    const antwort = await anfrage(`?${params.toString()}`, { method: "GET" });
    if (!antwort.ok) break;
    const text = await antwort.text();
    for (const m of text.matchAll(/<Key>([^<]+)<\/Key>/g)) schluessel.push(m[1]);
    const naechste = text.match(/<NextContinuationToken>([^<]+)<\/NextContinuationToken>/)?.[1];
    if (!naechste) break;
    marke = naechste;
  }
  return schluessel;
}

export async function speichere(schluessel: string, inhalt: string | Uint8Array, typ = "application/json"): Promise<boolean> {
  if (!istEingerichtet()) return false;
  try {
    // R2 verlangt die Länge im Kopf; ohne sie überträgt fetch gestückelt und R2 lehnt mit 411 ab.
    const bytes = typeof inhalt === "string" ? new TextEncoder().encode(inhalt) : inhalt;
    const antwort = await anfrage(`/${schluessel}`, {
      method: "PUT",
      body: bytes as BodyInit,
      headers: { "content-type": typ, "content-length": String(bytes.byteLength) },
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

export async function loesche(schluessel: string): Promise<boolean> {
  if (!istEingerichtet()) return false;
  try {
    const antwort = await anfrage(`/${schluessel}`, { method: "DELETE" });
    return antwort.ok || antwort.status === 404;
  } catch {
    return false;
  }
}

/**
 * Prüft Zugang und Schreibrecht mit einer kleinen Testdatei an beiden
 * möglichen Adressen und meldet je Adresse, was R2 geantwortet hat. Die
 * Schlüssel selbst tauchen nicht auf, nur ob sie gesetzt sind.
 */
export async function pruefeVerbindung() {
  const k = konfiguration();
  const gesetzt = {
    R2_ACCOUNT_ID: Boolean(process.env.R2_ACCOUNT_ID),
    R2_ACCESS_KEY_ID: Boolean(process.env.R2_ACCESS_KEY_ID),
    R2_SECRET_ACCESS_KEY: Boolean(process.env.R2_SECRET_ACCESS_KEY),
    R2_BUCKET: Boolean(process.env.R2_BUCKET),
  };
  if (!k) return { eingerichtet: false, verbunden: false, gesetzt, versuche: [] };

  const versuche: { adresse: string; status: number | string; meldung: string }[] = [];
  for (const adresse of [`https://${k.konto}.eu.r2.cloudflarestorage.com`, `https://${k.konto}.r2.cloudflarestorage.com`]) {
    try {
      const bytes = new TextEncoder().encode(JSON.stringify({ zeit: new Date().toISOString() }));
      const antwort = await k.client.fetch(`${adresse}/${k.bucket}/system/verbindungstest.json`, {
        method: "PUT",
        body: bytes,
        headers: { "content-type": "application/json", "content-length": String(bytes.byteLength) },
      });
      const text = antwort.ok ? "" : await antwort.text();
      const code = text.match(/<Code>([^<]+)<\/Code>/)?.[1] ?? "";
      const nachricht = text.match(/<Message>([^<]+)<\/Message>/)?.[1] ?? "";
      versuche.push({ adresse, status: antwort.status, meldung: antwort.ok ? "OK" : `${code} ${nachricht}`.trim() });
      if (antwort.ok) gemerkteAdresse = adresse;
    } catch (fehler) {
      versuche.push({ adresse, status: "Netzwerkfehler", meldung: String(fehler).slice(0, 200) });
    }
  }
  return {
    eingerichtet: true,
    verbunden: versuche.some((v) => v.status === 200),
    gesetzt,
    kontoIdLaenge: k.konto.length,
    bucket: k.bucket,
    versuche,
  };
}

/** Tagesordner, damit sich die Daten später zeitlich auswerten lassen. */
export function tagesPfad(art: string, id: string): string {
  const jetzt = new Date();
  return `${art}/${jetzt.toISOString().slice(0, 10)}/${id}-${jetzt.getTime()}.json`;
}

const REGEL_INDEX_SCHLUESSEL = "regeln/index.json";
/** Begrenzt den Index, damit der Prompt jeder Auswertung nicht unbegrenzt wächst. */
const REGEL_INDEX_MAX = 40;

export interface GelernteRegel {
  id: string;
  titel: string;
  regel: string[];
  zeit: string;
}

/**
 * Laufend wachsende Liste gelernter Regeln an einem festen Schlüssel, statt
 * tagesweise verteilter Einzeldateien: so lässt sie sich ohne eigene
 * R2-Auflistung bei jeder Auswertung in einem Lesezugriff mitgeben.
 */
export async function regelnLesen(): Promise<GelernteRegel[]> {
  const roh = await lese(REGEL_INDEX_SCHLUESSEL);
  if (!roh) return [];
  try {
    const liste = JSON.parse(roh);
    return Array.isArray(liste) ? liste : [];
  } catch {
    return [];
  }
}

export async function regelErgaenzen(eintrag: Omit<GelernteRegel, "zeit">): Promise<boolean> {
  const bisherige = (await regelnLesen()).filter((r) => r.id !== eintrag.id);
  const neu = [...bisherige, { ...eintrag, zeit: new Date().toISOString() }].slice(-REGEL_INDEX_MAX);
  return speichere(REGEL_INDEX_SCHLUESSEL, JSON.stringify(neu));
}

export interface TrainingsExport {
  erstellt: string;
  anzahl: Record<string, number>;
  regeln: GelernteRegel[];
  eintraege: { art: string; id: string; zeit: string; daten: unknown }[];
}

/**
 * Sammelt alles bisher Gespeicherte zu einem einzigen, strukturierten Datensatz:
 * die gelernten Regeln und jeden einzelnen Auswertungs-, Korrektur- und
 * CAD-Eintrag. Grundlage für ein künftiges Fine-Tuning oder ein eigenes
 * Modell, sobald genug echte Fälle zusammengekommen sind. Läuft nur, wenn
 * jemand es anstößt - speichert nichts automatisch, kostet nur beim Aufruf.
 */
export async function exportiereTrainingsdaten(): Promise<TrainingsExport> {
  const arten = ["auswertung", "korrektur", "cad", "regel"];
  const eintraege: TrainingsExport["eintraege"] = [];
  const anzahl: Record<string, number> = {};

  for (const art of arten) {
    const schluessel = await listeSchluessel(`${art}/`);
    anzahl[art] = schluessel.length;
    for (const s of schluessel) {
      const roh = await lese(s);
      if (!roh) continue;
      try {
        eintraege.push(JSON.parse(roh));
      } catch {
        // Ein einzelner beschädigter Eintrag soll den ganzen Export nicht abbrechen.
      }
    }
  }

  const regeln = await regelnLesen();
  return { erstellt: new Date().toISOString(), anzahl, regeln, eintraege };
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
