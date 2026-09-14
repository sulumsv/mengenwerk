/**
 * Passwortschutz für Tool und Auswertung.
 *
 * Der Proxy schützt die Seiten. Die Auswertungsroute prüft selbst, weil der
 * Proxy jeden Request-Body puffert, um ihn mehrfach lesbar zu machen — bei
 * einem Plan-Upload wäre das eine zweite Kopie im Speicher und läuft gegen das
 * Puffer-Limit. Ohne gesetztes Passwort ist nichts geschützt.
 */

export const AUTH_COOKIE = "mw_auth";

export async function erwarteterCookiewert(passwort: string): Promise<string> {
  const daten = new TextEncoder().encode(passwort);
  const digest = await crypto.subtle.digest("SHA-256", daten);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function istAngemeldet(cookiewert: string | undefined): Promise<boolean> {
  const passwort = process.env.MENGENWERK_PASSWORD;
  if (!passwort) return true;
  if (!cookiewert) return false;
  return cookiewert === (await erwarteterCookiewert(passwort));
}
