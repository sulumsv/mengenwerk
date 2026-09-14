import type { VerbrauchsBericht } from "./verbrauch";

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

/**
 * Ein Raum laut Raumstempel. Die dort ausgewiesene Quadratmeterzahl ist die
 * verlässlichste Angabe im ganzen Plan und wird unverändert übernommen, statt
 * sie aus Maßketten nachzurechnen.
 */
export interface Raum {
  id: string;
  geschoss: string;
  name: string;
  flaeche_m2: number;
  belag?: string;
  laenge_m?: number;
  breite_m?: number;
  /** Aus Länge und Breite gerechnet, sonst aus der Fläche geschätzt. */
  umfang_m: number;
  umfangQuelle: "gerechnet" | "geschaetzt";
  beheizt: boolean;
  nassraum: boolean;
  konfidenz: Konfidenz;
  quelle: string;
}

export interface AnalysisResult {
  dateiname: string;
  dateityp: "vektor-pdf" | "scan" | "bild" | "dwg";
  seiten: number;
  kontext: PlanKontext;
  raeume: Raum[];
  elemente: DetectedElement[];
  hinweise: string[];
  /**
   * Was die Auswertung an API-Kosten verursacht hat. Fehlt, wenn der Plan aus
   * seiner eigenen Textebene gelesen wurde — dann fällt nichts an.
   */
  verbrauch?: VerbrauchsBericht;
}

export type Einheit = "m2" | "m3" | "t" | "lfm" | "Stk" | "EUR";

export interface Position {
  nummer: string;
  bezeichnung: string;
  detail?: string;
  rechenweg: string;
  menge: number | null;
  einheit: Einheit;
  konfidenz: Konfidenz;
  lgKandidaten: string[];
  /** Ids aus der Annahmen-Registry, die in diese Position eingeflossen sind. */
  annahmen: string[];
  /** Schlüssel in den Preiskatalog. Ohne ihn bleibt die Position unbepreist. */
  preisSchluessel?: string;
  einheitspreis?: number;
  /** Menge mal Einheitspreis. */
  betrag?: number;
  /** Ob der Einheitspreis vom Betrieb stammt oder noch ein Richtwert ist. */
  preisQuelle?: "eigen" | "richtwert";
  /**
   * Zwischenwert, dessen Kosten eine Folgeposition trägt — etwa die
   * Fassadenfläche, die über Wärmedämmverbund und Außenputz bepreist wird.
   * Solche Positionen bleiben bewusst ohne Betrag und zählen nicht als Lücke.
   */
  zwischenwert?: boolean;
}

export interface Abschnitt {
  nummer: number;
  titel: string;
  lgHinweis: string;
  vorspann?: string;
  positionen: Position[];
  /** Summe der bepreisten Positionen dieses Abschnitts. */
  summe?: number;
}

export interface Kostenschaetzung {
  summe: number;
  /** Anteil der Summe, der auf Richtwerten statt eigenen Preisen beruht. */
  summeAusRichtwerten: number;
  bepreistePositionen: number;
  unbepreistePositionen: number;
}

export interface Massenauszug {
  raeume: Raum[];
  kennzahlen: Position[];
  abschnitte: Abschnitt[];
  angewandteAnnahmen: {
    id: string;
    titel: string;
    begruendung: string;
    auswirkung: string;
  }[];
  pruefpunkte: string[];
  kosten?: Kostenschaetzung;
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
