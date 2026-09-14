import type { Einheit } from "./types";

/**
 * Einheitspreise je Position.
 *
 * Die hinterlegten Werte sind ausdrücklich RICHTWERTE, keine Marktpreise: sie
 * machen die Kostenschätzung ab dem ersten Plan benutzbar, sind aber durch die
 * eigenen Preise des Betriebs zu ersetzen. Jede Position führt deshalb mit,
 * ob ihr Preis vom Betrieb stammt oder noch ein Richtwert ist — nur so ist der
 * Anteil der Schätzung erkennbar, der auf fremden Zahlen beruht.
 *
 * Der Preis gilt immer je Einheit der zugehörigen Position. Wo eine Position
 * in m³ geführt wird (Estrich, Beton), ist auch der Preis je m³ angesetzt,
 * obwohl das Gewerk üblicherweise je m² anbietet.
 */

export interface Preisposition {
  schluessel: string;
  bezeichnung: string;
  einheit: Einheit;
  /** Leistungsgruppe nach LB-HB, soweit belegt. */
  lg: string | null;
  richtwert: number;
  hinweis?: string;
}

export const PREISKATALOG: Preisposition[] = [
  // LG 11 — Estricharbeiten
  { schluessel: "estrich", bezeichnung: "Heizestrich CT-C25-F4", einheit: "m3", lg: "11", richtwert: 485, hinweis: "entspricht rund 34 EUR/m² bei 7 cm" },
  { schluessel: "trittschall", bezeichnung: "Trittschalldämmung", einheit: "m2", lg: "11", richtwert: 14 },
  { schluessel: "pefolie", bezeichnung: "PE-Trennlage", einheit: "m2", lg: "11", richtwert: 3 },
  { schluessel: "randdaemmstreifen", bezeichnung: "Randdämmstreifen", einheit: "lfm", lg: "11", richtwert: 2.5 },
  { schluessel: "fussbodenheizung", bezeichnung: "Fußbodenheizung", einheit: "m2", lg: null, richtwert: 55 },

  // LG 24 / 50 — Beläge
  { schluessel: "parkett", bezeichnung: "Parkett", einheit: "m2", lg: "50", richtwert: 80 },
  { schluessel: "dielen", bezeichnung: "Holzdielen", einheit: "m2", lg: "50", richtwert: 120 },
  { schluessel: "bodenfliesen", bezeichnung: "Bodenfliesen", einheit: "m2", lg: "24", richtwert: 90 },
  { schluessel: "wandfliesen", bezeichnung: "Fliesenspiegel", einheit: "m2", lg: "24", richtwert: 95 },
  { schluessel: "naturstein", bezeichnung: "Natursteinbelag", einheit: "m2", lg: "24", richtwert: 130 },
  { schluessel: "bodenbeschichtung", bezeichnung: "Bodenbeschichtung", einheit: "m2", lg: null, richtwert: 45 },
  { schluessel: "sockelleisteHolz", bezeichnung: "Sockelleiste Holz", einheit: "lfm", lg: "37", richtwert: 14 },
  { schluessel: "sockelleisteFliesen", bezeichnung: "Fliesensockel", einheit: "lfm", lg: "24", richtwert: 18 },

  // LG 03 / 07 / 08 — Erdbau, Beton, Mauerwerk
  { schluessel: "erdaushub", bezeichnung: "Baugrubenaushub", einheit: "m3", lg: "03", richtwert: 22 },
  { schluessel: "bodenplatte", bezeichnung: "Bodenplatte Stahlbeton", einheit: "m3", lg: "07", richtwert: 260 },
  { schluessel: "geschossdecke", bezeichnung: "Geschoßdecke Stahlbeton", einheit: "m3", lg: "07", richtwert: 320 },
  { schluessel: "stuetze", bezeichnung: "Stahlbetonstütze", einheit: "m3", lg: "07", richtwert: 620 },
  { schluessel: "bewehrung", bezeichnung: "Bewehrung", einheit: "t", lg: "07", richtwert: 1500 },
  { schluessel: "mauerwerk", bezeichnung: "Mauerwerk", einheit: "m3", lg: "08", richtwert: 210 },

  // LG 23 — Putz und Vollwärmeschutz
  { schluessel: "wdvs", bezeichnung: "Wärmedämmverbundsystem", einheit: "m2", lg: "23", richtwert: 85 },
  { schluessel: "aussenputz", bezeichnung: "Außenputz", einheit: "m2", lg: "23", richtwert: 42 },
  { schluessel: "innenputz", bezeichnung: "Innenputz Wand", einheit: "m2", lg: "23", richtwert: 24 },
  { schluessel: "deckenputz", bezeichnung: "Deckenputz", einheit: "m2", lg: "23", richtwert: 26 },
  { schluessel: "malerei", bezeichnung: "Malerei", einheit: "m2", lg: null, richtwert: 12 },
  { schluessel: "geruest", bezeichnung: "Fassadengerüst", einheit: "m2", lg: null, richtwert: 12 },

  // LG 15 / 16 / 18 — Dach
  { schluessel: "dachkonstruktion", bezeichnung: "Dachkonstruktion Holz", einheit: "m2", lg: "15", richtwert: 95 },
  { schluessel: "dachdaemmung", bezeichnung: "Zwischensparrendämmung", einheit: "m2", lg: "15", richtwert: 45 },
  { schluessel: "lattung", bezeichnung: "Lattung und Konterlattung", einheit: "m2", lg: "15", richtwert: 18 },
  { schluessel: "unterspannbahn", bezeichnung: "Unterspannbahn", einheit: "m2", lg: "15", richtwert: 9 },
  { schluessel: "dachdeckung", bezeichnung: "Dachdeckung", einheit: "m2", lg: "16", richtwert: 75 },
  { schluessel: "dachrinne", bezeichnung: "Dachrinne", einheit: "lfm", lg: "18", richtwert: 55 },
  { schluessel: "pv", bezeichnung: "Photovoltaikanlage", einheit: "m2", lg: null, richtwert: 350 },

  // LG 37 / 43 / 71–75 — Öffnungen
  { schluessel: "fenster", bezeichnung: "Fenster", einheit: "m2", lg: "71", richtwert: 620 },
  { schluessel: "tuer", bezeichnung: "Tür", einheit: "m2", lg: "43", richtwert: 380 },
  { schluessel: "tor", bezeichnung: "Sektionaltor", einheit: "Stk", lg: null, richtwert: 3200 },
];

const KATALOG_INDEX = new Map(PREISKATALOG.map((p) => [p.schluessel, p]));

export function preispositionFuer(schluessel: string | undefined): Preisposition | undefined {
  return schluessel ? KATALOG_INDEX.get(schluessel) : undefined;
}

/** Vom Betrieb hinterlegte Preise: Schlüssel auf EUR je Einheit. */
export type Einheitspreise = Record<string, number>;

export interface PreisTreffer {
  preis: number;
  quelle: "eigen" | "richtwert";
}

/**
 * Löst den Einheitspreis einer Position auf. Ein eigener Preis schlägt den
 * Richtwert; ein Preis von 0 gilt als bewusst gesetzt und unterdrückt die
 * Position in der Kostenschätzung nicht.
 */
export function findePreis(
  schluessel: string | undefined,
  eigene: Einheitspreise | undefined,
): PreisTreffer | null {
  if (!schluessel) return null;

  const eigen = eigene?.[schluessel];
  if (typeof eigen === "number" && Number.isFinite(eigen) && eigen >= 0) {
    return { preis: eigen, quelle: "eigen" };
  }

  const katalog = KATALOG_INDEX.get(schluessel);
  return katalog ? { preis: katalog.richtwert, quelle: "richtwert" } : null;
}
