"use client";

/**
 * Schickt gesammelte Daten an den Datenspeicher. Scheitert das, merkt der
 * Nutzer nichts davon: die Auswertung selbst hängt nicht daran.
 */
export function sendeDaten(art: "auswertung" | "korrektur" | "cad", id: string, daten: unknown): void {
  try {
    void fetch("/api/daten", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ art, id, daten }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Ohne Netz oder bei zu großem Body: nichts zu tun.
  }
}
