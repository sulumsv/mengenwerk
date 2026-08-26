export type ElementType =
  | "fenster"
  | "tuer"
  | "wand"
  | "stuetze"
  | "unterzug"
  | "boden"
  | "decke"
  | "dach"
  | "fundament"
  | "sonstiges";

/** Woher ein Wert stammt. Bestimmt, ob eine Menge ausschreibungsreif ist. */
export type Konfidenz = "plan" | "berechnet" | "annahme";

export interface DetectedElement {
  id: string;
  type: ElementType;
  label: string;
  breite_m: number;
  hoehe_m: number;
  tiefe_m?: number;
  anzahl: number;
  flaeche_m2?: number;
  volumen_m3?: number;
  material?: string;
  konfidenz: Konfidenz;
  quelle: string;
  rechenweg: string;
}

/**
 * Angaben, die für den gesamten Plansatz gelten und nicht pro Seite variieren:
 * Legende, Nachweise und Geschosshöhen. Sie werden in einem eigenen Durchgang
 * über alle Seiten erhoben, bevor die einzelnen Seiten ausgewertet werden.
 */
export interface PlanKontext {
  /** Farbcodierung der Planlegende, z.B. { rot: "Ziegel", gruen: "Stahlbeton" }. */
  legende: Record<string, string>;
  /** Geschossbezeichnung auf lichte Raumhöhe in Metern, aus den Schnitten. */
  geschosshoehen: Record<string, number>;
  /** Werte aus Flächenaufstellung und Nachweisen, z.B. { bebauteFlaeche: 152.58 }. */
  nachweise: Record<string, number>;
  hinweise: string[];
}

export interface AnalysisResult {
  dateiname: string;
  dateityp: "vektor-pdf" | "scan" | "bild" | "dwg";
  seiten: number;
  kontext: PlanKontext;
  elemente: DetectedElement[];
  hinweise: string[];
}

export interface GroupedItem {
  type: ElementType;
  label: string;
  material?: string;
  breite_m: number;
  hoehe_m: number;
  anzahl: number;
  einheit_flaeche_m2: number;
  gesamt_flaeche_m2: number;
  konfidenz: Konfidenz;
  rechenweg: string;
  lgKandidaten: string[];
}
