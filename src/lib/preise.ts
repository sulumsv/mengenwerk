import type { Einheit } from "./types";

/**
 * Einheitspreise je Position.
 *
 * Die hinterlegten Werte sind ausdrücklich RICHTWERTE, keine Marktpreise: sie
 * machen die Kostenschätzung ab dem ersten Plan benutzbar, sind aber durch die
 * eigenen Preise des Betriebs zu ersetzen. Jede Position führt deshalb mit,
 * ob ihr Preis vom Betrieb stammt oder noch ein Richtwert ist, nur so ist der
 * Anteil der Schätzung erkennbar, der auf fremden Zahlen beruht.
 *
 * Stand Oktober 2026: Die übrigen Positionen außer der Verbundabdichtung im
 * Nassraum sind ebenso aus österreichischen Kostenportalen belegt, die
 * Spanne steht jeweils im Hinweis.
 *
 * Stand September 2026: Fußbodenheizung, Aushub, Mauerwerk, WDVS, Innenputz,
 * Malerei, Dachdeckung, Dachrinne, Fenster und Türen sind die Mitte der
 * Preisspannen österreichischer Kostenportale (daibau.at, baucheck.io,
 * werkflow.at, hausbaumagazin.at u. a.), brutto inklusive Montage. Das sind
 * Endkundenpreise für Einfamilienhäuser, keine erhobenen Mediane.
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

/**
 * Solange es keine Kundenkonten gibt, rechnet jede Auswertung automatisch mit
 * den Richtwerten. Mit Kundenkonten wird das auf true gestellt: dann muss
 * jeder Betrieb seine eigenen Einheitspreise hinterlegen.
 */
export const EIGENE_PREISE_PFLICHT = false;

export const PREISKATALOG: Preisposition[] = [
  // LG 03: Roden, Baugrube, Sicherungen
  { schluessel: "erdaushub", bezeichnung: "Baugrubenaushub", einheit: "m3", lg: "03", richtwert: 40 },

  // LG 04: Gerüste
  { schluessel: "geruest", bezeichnung: "Fassadengerüst", einheit: "m2", lg: "04", richtwert: 12 },

  // LG 06: Aufschließung, Infrastruktur
  { schluessel: "kanal", bezeichnung: "Kanalleitung bis Anschluss", einheit: "lfm", lg: "06", richtwert: 330, hinweis: "Mitte 180 bis 480 EUR/lfm" },

  // LG 07 / 08: Beton und Mauerwerk
  { schluessel: "bodenplatte", bezeichnung: "Bodenplatte Stahlbeton", einheit: "m3", lg: "07", richtwert: 260 },
  { schluessel: "geschossdecke", bezeichnung: "Geschoßdecke Stahlbeton", einheit: "m3", lg: "07", richtwert: 320 },
  { schluessel: "stuetze", bezeichnung: "Stahlbetonstütze", einheit: "m3", lg: "07", richtwert: 620 },
  { schluessel: "bewehrung", bezeichnung: "Bewehrung", einheit: "t", lg: "07", richtwert: 1500 },
  { schluessel: "mauerwerk", bezeichnung: "Mauerwerk", einheit: "m3", lg: "08", richtwert: 500, hinweis: "entspricht rund 125 EUR/m² Wand bei 25 cm" },

  // LG 10: Putzarbeiten
  { schluessel: "innenputz", bezeichnung: "Innenputz Wand", einheit: "m2", lg: "10", richtwert: 26 },
  { schluessel: "deckenputz", bezeichnung: "Deckenputz", einheit: "m2", lg: "10", richtwert: 26 },
  { schluessel: "aussenputz", bezeichnung: "Außenputz", einheit: "m2", lg: "10", richtwert: 42 },
  { schluessel: "laibung", bezeichnung: "Laibungsputz mit Kantenschutz", einheit: "lfm", lg: "10", richtwert: 16 },

  // LG 11: Estricharbeiten
  { schluessel: "estrich", bezeichnung: "Heizestrich CT-C25-F4", einheit: "m3", lg: "11", richtwert: 485, hinweis: "entspricht rund 34 EUR/m² bei 7 cm" },
  { schluessel: "trittschall", bezeichnung: "Trittschalldämmung", einheit: "m2", lg: "11", richtwert: 14 },
  { schluessel: "pefolie", bezeichnung: "PE-Trennlage", einheit: "m2", lg: "11", richtwert: 3 },
  { schluessel: "randdaemmstreifen", bezeichnung: "Randdämmstreifen", einheit: "lfm", lg: "11", richtwert: 2.5 },

  // LG 12: Abdichtungsarbeiten
  { schluessel: "abdichtungNass", bezeichnung: "Verbundabdichtung Nassraum", einheit: "m2", lg: "12", richtwert: 35, hinweis: "grob geschätzt, noch nicht recherchiert" },
  { schluessel: "abdichtungErdberuehrt", bezeichnung: "Abdichtung erdberührt", einheit: "m2", lg: "12", richtwert: 90, hinweis: "Mitte 60 bis 120 EUR/m², mit Perimeterdämmung 120 bis 220" },

  // LG 13 / 58: Außenanlagen, Garten
  { schluessel: "pflaster", bezeichnung: "Pflasterbelag Außen", einheit: "m2", lg: "13", richtwert: 120, hinweis: "inkl. Unterbau, 100 bis 140 EUR/m²" },
  { schluessel: "garten", bezeichnung: "Gartengestaltung, Rasen", einheit: "m2", lg: "58", richtwert: 26, hinweis: "Rollrasen verlegt, 15 bis 38 EUR/m²" },

  // LG 21 / 22 / 23: Dach und Spengler
  { schluessel: "dachabdichtung", bezeichnung: "Flachdachabdichtung", einheit: "m2", lg: "21", richtwert: 85, hinweis: "Mitte 50 bis 120 EUR/m²" },
  { schluessel: "dachdeckung", bezeichnung: "Dachdeckung", einheit: "m2", lg: "22", richtwert: 65 },
  { schluessel: "lattung", bezeichnung: "Lattung und Konterlattung", einheit: "m2", lg: "22", richtwert: 18 },
  { schluessel: "unterspannbahn", bezeichnung: "Unterspannbahn", einheit: "m2", lg: "22", richtwert: 9 },
  { schluessel: "dachrinne", bezeichnung: "Dachrinne", einheit: "lfm", lg: "23", richtwert: 65 },
  { schluessel: "fensterbankAussen", bezeichnung: "Fensterbank außen", einheit: "lfm", lg: "23", richtwert: 55 },

  // LG 24 / 28 / 38 / 49 / 50: Beläge
  { schluessel: "bodenfliesen", bezeichnung: "Bodenfliesen", einheit: "m2", lg: "24", richtwert: 90 },
  { schluessel: "wandfliesen", bezeichnung: "Fliesenspiegel", einheit: "m2", lg: "24", richtwert: 95 },
  { schluessel: "sockelleisteFliesen", bezeichnung: "Fliesensockel", einheit: "lfm", lg: "24", richtwert: 18 },
  { schluessel: "naturstein", bezeichnung: "Natursteinbelag", einheit: "m2", lg: "28", richtwert: 130 },
  { schluessel: "parkett", bezeichnung: "Parkett", einheit: "m2", lg: "38", richtwert: 80 },
  { schluessel: "dielen", bezeichnung: "Holzdielen", einheit: "m2", lg: "38", richtwert: 120 },
  { schluessel: "sockelleisteHolz", bezeichnung: "Sockelleiste Holz", einheit: "lfm", lg: "38", richtwert: 14 },
  { schluessel: "bodenbeschichtung", bezeichnung: "Bodenbeschichtung", einheit: "m2", lg: "49", richtwert: 45 },
  { schluessel: "laminat", bezeichnung: "Laminat", einheit: "m2", lg: "50", richtwert: 58, hinweis: "35 bis 80 EUR/m² inkl. Verlegung" },
  { schluessel: "vinyl", bezeichnung: "Vinyl- und Designbelag", einheit: "m2", lg: "50", richtwert: 35, hinweis: "25 bis 45 EUR/m² inkl. Verlegung" },
  { schluessel: "teppich", bezeichnung: "Teppichboden", einheit: "m2", lg: "50", richtwert: 30, hinweis: "20 bis 40 EUR/m² inkl. Verlegung" },
  { schluessel: "linoleum", bezeichnung: "Linoleum", einheit: "m2", lg: "50", richtwert: 52, hinweis: "30 bis 75 EUR/m² inkl. Verlegung" },

  // LG 36: Holzbau
  { schluessel: "dachkonstruktion", bezeichnung: "Dachkonstruktion Holz", einheit: "m2", lg: "36", richtwert: 95 },
  { schluessel: "dachdaemmung", bezeichnung: "Zwischensparrendämmung", einheit: "m2", lg: "36", richtwert: 45 },
  { schluessel: "holzbauteil", bezeichnung: "Holzstütze, Brettschichtholz", einheit: "m3", lg: "36", richtwert: 1100, hinweis: "BSH-Material 730 bis 1210 EUR/m³, Montage geschätzt" },

  // LG 37 / 39: Tischler, Trockenbau
  { schluessel: "fensterbankInnen", bezeichnung: "Fensterbank innen", einheit: "lfm", lg: "37", richtwert: 45 },
  { schluessel: "trockenbauwand", bezeichnung: "Gipskarton-Ständerwand", einheit: "m2", lg: "39", richtwert: 60, hinweis: "einfach beplankt 45 bis 75 EUR/m²" },

  // LG 43 / 56 / 57 / 65 / 71-75: Öffnungen
  { schluessel: "tuer", bezeichnung: "Tür", einheit: "m2", lg: "43", richtwert: 340, hinweis: "entspricht rund 650 EUR je Innentür mit Zarge" },
  { schluessel: "dachflaechenfenster", bezeichnung: "Dachflächenfenster", einheit: "Stk", lg: "56", richtwert: 1900, hinweis: "80 x 160 cm mit Einbau" },
  { schluessel: "sonnenschutz", bezeichnung: "Außenjalousie, Raffstore", einheit: "Stk", lg: "57", richtwert: 450, hinweis: "einfaches Element 380 bis 500 EUR" },
  { schluessel: "tor", bezeichnung: "Sektionaltor", einheit: "Stk", lg: "65", richtwert: 3200 },
  { schluessel: "fenster", bezeichnung: "Fenster", einheit: "m2", lg: "73", richtwert: 550, hinweis: "Kunststoff, 3-fach verglast" },
  { schluessel: "anschlussfuge", bezeichnung: "Anschlussfuge mit Dichtband", einheit: "lfm", lg: "73", richtwert: 11 },

  // LG 44 / 68: Fassade
  { schluessel: "wdvs", bezeichnung: "Wärmedämmverbundsystem", einheit: "m2", lg: "44", richtwert: 105 },
  { schluessel: "vhf", bezeichnung: "Vorgehängte hinterlüftete Fassade", einheit: "m2", lg: "68", richtwert: 250, hinweis: "Faserzement 150 bis 275, Holz 175 bis 400 EUR/m²" },

  // LG 31: Metallbau
  { schluessel: "gelaender", bezeichnung: "Geländer Metall", einheit: "lfm", lg: "31", richtwert: 300, hinweis: "Edelstahl ab etwa 300 EUR/lfm" },

  // LG 47 / 48: Tapeten und Beschichtungen
  { schluessel: "malerei", bezeichnung: "Malerei", einheit: "m2", lg: "48", richtwert: 11 },
  { schluessel: "tapete", bezeichnung: "Tapete", einheit: "m2", lg: "47", richtwert: 16, hinweis: "10 bis 22 EUR/m²" },

  // Haustechnik und Energie, nicht Teil der LB-HB
  { schluessel: "fussbodenheizung", bezeichnung: "Fußbodenheizung", einheit: "m2", lg: null, richtwert: 70 },
  { schluessel: "pv", bezeichnung: "Photovoltaikanlage", einheit: "m2", lg: null, richtwert: 350 },
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
 * Position in der Kostenschätzung nicht. Ohne `mitRichtwerten` bleibt eine
 * Position ohne eigenen Preis unbepreist.
 */
export function findePreis(
  schluessel: string | undefined,
  eigene: Einheitspreise | undefined,
  mitRichtwerten = true,
): PreisTreffer | null {
  if (!schluessel) return null;

  const eigen = eigene?.[schluessel];
  if (typeof eigen === "number" && Number.isFinite(eigen) && eigen >= 0) {
    return { preis: eigen, quelle: "eigen" };
  }

  if (!mitRichtwerten) return null;
  const katalog = KATALOG_INDEX.get(schluessel);
  return katalog ? { preis: katalog.richtwert, quelle: "richtwert" } : null;
}
