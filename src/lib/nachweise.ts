/**
 * Die Nachweiswerte, auf die die Ableitung angewiesen ist.
 *
 * Diese Liste ist die einzige Quelle: aus ihr entsteht die Anweisung an das
 * Modell, welche Werte unter welchem Namen zu liefern sind, und über sie
 * findet die Ableitung sie wieder. Zwei getrennte Listen waren der Grund,
 * warum der Prompt nur die Hälfte der Werte verlangte, die die Engine sucht —
 * ganze Abschnitte wären lautlos leer geblieben.
 *
 * `brauchtFuer` steht auch im Prompt: es sagt dem Modell, wofür der Wert
 * gebraucht wird, und erscheint im Plan als Begründung, warum sich zu suchen
 * lohnt.
 */

export interface NachweisDefinition {
  id: string;
  /** Name, unter dem das Modell den Wert liefern soll. */
  name: string;
  einheit: string;
  /** Weitere Schreibweisen, unter denen der Wert erkannt wird. */
  synonyme: string[];
  brauchtFuer: string;
}

export const NACHWEISE: NachweisDefinition[] = [
  {
    id: "bebauteFlaeche",
    name: "Bebaute Fläche",
    einheit: "m2",
    synonyme: ["bebaute flaeche"],
    brauchtFuer: "Baugrubenaushub",
  },
  {
    id: "wohnnutzflaeche",
    name: "Wohnnutzfläche",
    einheit: "m2",
    synonyme: ["nutzfläche"],
    brauchtFuer: "Abgleich mit der Summe der Raumflächen",
  },
  {
    id: "bgfErdgeschoss",
    name: "Bruttogrundrissfläche Erdgeschoß",
    einheit: "m2",
    synonyme: ["bruttogrundriss eg", "bgf eg", "bruttogrundrissfläche erdgeschoss"],
    brauchtFuer: "Bodenplatte",
  },
  {
    id: "bgfGesamt",
    name: "Bruttogrundrissfläche gesamt",
    einheit: "m2",
    synonyme: ["bruttogrundrissfläche", "bruttogrundfläche", "bgf gesamt"],
    brauchtFuer: "Geschoßdecken",
  },
  {
    id: "bgfDachgeschoss",
    name: "Bruttogrundrissfläche Dachgeschoß",
    einheit: "m2",
    synonyme: ["bruttogrundriss dg", "bgf dg", "dachgrundfläche"],
    brauchtFuer: "Dachfläche",
  },
  {
    id: "fassadenabwicklung",
    name: "Fassadenabwicklung",
    einheit: "m2",
    synonyme: ["fassadenfläche", "abwicklung fassade"],
    brauchtFuer: "Wärmedämmverbund, Außenputz und Mauerwerk",
  },
  {
    id: "giebelflaeche",
    name: "Giebelflächen",
    einheit: "m2",
    synonyme: ["giebelfläche", "giebel"],
    brauchtFuer: "Fassadenfläche brutto",
  },
  {
    id: "abwicklungslaenge",
    name: "Abwicklungslänge",
    einheit: "m",
    synonyme: ["frontlänge", "gebäudeumfang", "umfang gebäude"],
    brauchtFuer: "Fassadengerüst",
  },
  {
    id: "gebaeudehoehe",
    name: "Gebäudehöhe",
    einheit: "m",
    synonyme: ["traufenhöhe", "traufe"],
    brauchtFuer: "Fassadengerüst",
  },
  {
    id: "dachneigung",
    name: "Dachneigung",
    einheit: "Grad",
    synonyme: ["neigung dach", "dachschräge"],
    brauchtFuer: "den gesamten Dachabschnitt",
  },
  {
    id: "traufenlaenge",
    name: "Traufenlänge",
    einheit: "m",
    synonyme: ["firstlänge", "länge dachrinne"],
    brauchtFuer: "Dachrinne",
  },
  {
    id: "pvFlaeche",
    name: "Photovoltaik Modulfläche",
    einheit: "m2",
    synonyme: ["pv-anlage", "photovoltaik", "pv fläche"],
    brauchtFuer: "Photovoltaikanlage",
  },
  {
    id: "gruendungssohle",
    name: "Unterkante Bodenplatte",
    einheit: "m",
    synonyme: ["gründungssohle", "aushubtiefe", "unterkante fundament"],
    brauchtFuer: "Aushubtiefe",
  },
];

const INDEX = new Map(NACHWEISE.map((n) => [n.id, n]));

export function nachweisDefinition(id: string): NachweisDefinition | undefined {
  return INDEX.get(id);
}

/** Suchbegriffe eines Nachweises, vom kanonischen Namen zu den Synonymen. */
export function suchbegriffe(id: string): string[] {
  const def = INDEX.get(id);
  if (!def) return [];
  return [def.name.toLowerCase(), ...def.synonyme.map((s) => s.toLowerCase())];
}

/** Die Liste, die im Prompt steht — damit Modell und Ableitung dasselbe meinen. */
export function nachweisAnweisung(): string {
  return NACHWEISE.map((n) => `- "${n.name}" (${n.einheit}) — gebraucht für ${n.brauchtFuer}`).join("\n");
}
