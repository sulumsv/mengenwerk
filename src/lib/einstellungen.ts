/**
 * Schalter für die Testphase. Vor dem Livegang (eigene Domain, echte Kunden)
 * prüfen, siehe LIVE-CHECKLISTE.md.
 */

/**
 * KI-Kosten je Auswertung und im Konto anzeigen. Nur für die Tests gedacht:
 * Kunden sollen keine API-Kosten sehen. VOR DEM LIVEGANG AUF false STELLEN.
 */
export const KI_KOSTEN_ANZEIGEN = true;

/**
 * Upload-Grenzen. Die Datei selbst wird im Browser in Seitenbilder
 * umgewandelt, deshalb darf sie groß sein. Was an den Server geht, ist
 * auf 4,5 MB begrenzt (Vercel), das reicht für etwa 10 Blätter.
 */
export const MAX_DATEI_MB = 100;
export const MAX_BLAETTER = 10;
