import { lese, leseBytes, loesche, speichere } from "./datenspeicher";

/**
 * Die ausgewerteten Pläne des Kontos. Jeder Plan liegt unter seinem
 * Fingerabdruck (SHA-256 des Dateiinhalts), daneben ein Verzeichnis für die
 * Kontoübersicht. Anders als die anonymisierten Lerndaten gehört dieses
 * Archiv dem Kunden und behält Dateinamen und Ergebnis vollständig.
 */
const VERZEICHNIS = "konto/verzeichnis.json";

export interface ArchivEintrag {
  hash: string;
  name: string;
  datum: string;
  seiten: number;
  kostenUsd: number | null;
  quelle: string;
  /** Summe der erkannten Raumflächen, für die Kontoübersicht. */
  flaeche_m2?: number;
  positionen?: number;
  /** Wie lange die erste Auswertung gedauert hat, in Sekunden. */
  dauer_s?: number;
  /** Projektbezeichnung aus dem Plankopf, statt des Dateinamens angezeigt. */
  bezeichnung?: string;
  /** Erkannte Dokumentart, z.B. Einreichplan, Polierplan, Vorabzug, Detailplan. Für die Sortierung im Konto. */
  planart?: string;
  /** Freie Zuordnung zu einem Standort/Vorhaben mit mehreren Plänen, vom Nutzer vergeben. */
  projekt?: string;
}

export interface Profil {
  firma: string;
  name: string;
  email: string;
  telefon: string;
  gewerk: string;
  rolle?: string;
  website?: string;
  uid?: string;
  /** Farbe des Firmenzeichens im Konto. */
  farbe?: string;
}

export async function ladeProfil(): Promise<Profil | null> {
  const roh = await lese("konto/profil.json");
  if (!roh) return null;
  try {
    return JSON.parse(roh) as Profil;
  } catch {
    return null;
  }
}

export async function speichereProfil(profil: Profil): Promise<boolean> {
  return speichere("konto/profil.json", JSON.stringify(profil));
}

export function istHash(wert: string): boolean {
  return /^[0-9a-f]{64}$/.test(wert);
}

export async function ladeVerzeichnis(): Promise<ArchivEintrag[]> {
  const roh = await lese(VERZEICHNIS);
  if (!roh) return [];
  try {
    const daten = JSON.parse(roh) as { plaene?: ArchivEintrag[] };
    return Array.isArray(daten.plaene) ? daten.plaene : [];
  } catch {
    return [];
  }
}

export async function ladePlan(hash: string): Promise<string | null> {
  return lese(`konto/plaene/${hash}.json`);
}

export async function speicherePlan(eintrag: ArchivEintrag, ergebnis: unknown): Promise<boolean> {
  const ok = await speichere(`konto/plaene/${eintrag.hash}.json`, JSON.stringify({ eintrag, ergebnis }));
  if (!ok) return false;
  const liste = (await ladeVerzeichnis()).filter((e) => e.hash !== eintrag.hash);
  liste.unshift(eintrag);
  return speichere(VERZEICHNIS, JSON.stringify({ plaene: liste }));
}

export async function entfernePlan(hash: string): Promise<boolean> {
  await loesche(`konto/plaene/${hash}.json`);
  await loesche(`konto/plaene/${hash}.datei`);
  const liste = (await ladeVerzeichnis()).filter((e) => e.hash !== hash);
  return speichere(VERZEICHNIS, JSON.stringify({ plaene: liste }));
}

/** Hinterlegt die hochgeladene Originaldatei, damit sie später noch angesehen werden kann. */
export async function speicherePlanDatei(hash: string, bytes: Uint8Array, typ: string): Promise<boolean> {
  return speichere(`konto/plaene/${hash}.datei`, bytes, typ);
}

export async function ladePlanDatei(hash: string): Promise<{ bytes: Uint8Array; typ: string } | null> {
  return leseBytes(`konto/plaene/${hash}.datei`);
}

/** Ändert nur die Projektzuordnung eines bereits gespeicherten Plans. */
export async function ordnePlanZu(hash: string, projekt: string): Promise<boolean> {
  const liste = await ladeVerzeichnis();
  const index = liste.findIndex((e) => e.hash === hash);
  if (index === -1) return false;
  liste[index] = { ...liste[index], projekt: projekt.trim() || undefined };
  return speichere(VERZEICHNIS, JSON.stringify({ plaene: liste }));
}
