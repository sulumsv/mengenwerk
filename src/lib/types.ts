export type ElementType = "fenster" | "tuer" | "wand" | "boden" | "decke" | "fundament" | "sonstiges";

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
  quelle: string;
  rechenweg: string;
}

export interface AnalysisResult {
  dateiname: string;
  dateityp: "vektor-pdf" | "scan" | "bild" | "dwg";
  seiten: number;
  elemente: DetectedElement[];
  hinweise: string[];
}

export interface GroupedItem {
  type: ElementType;
  label: string;
  breite_m: number;
  hoehe_m: number;
  anzahl: number;
  einheit_flaeche_m2: number;
  gesamt_flaeche_m2: number;
  rechenweg: string;
  lgKandidaten: string[];
}
