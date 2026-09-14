import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { nachweisAnweisung } from "./nachweise";
import type { AnalysisResult, DetectedElement, ElementType, Konfidenz, PlanKontext, Raum } from "./types";

const MODELL = "claude-opus-5";

/** Obergrenze für den Kontextdurchgang, damit große Plansätze die Anfrage nicht sprengen. */
const MAX_KONTEXT_SEITEN = 12;

/**
 * Zeitrahmen. Die Route hat 300 Sekunden für alles — Upload, PDF-Rendern,
 * Auswertung und Antwort. Die Frist wird deshalb beim Eintreffen der Anfrage
 * gesetzt und hereingereicht, nicht erst hier: sonst zählt die Renderzeit des
 * PDF nicht mit und die Notbremse greift zu spät.
 */
export const ZEITBUDGET_MS = 250_000;

/** Obergrenze je Versuch. */
const ANFRAGE_TIMEOUT_MS = 70_000;

/**
 * Wiederholungen bei Überlast. Jeder Versuch kann bis zum Timeout laufen, die
 * Obergrenze eines Aufrufs ist also das Produkt — das muss die Frist wissen,
 * sonst startet sie einen Aufruf, der sie überzieht.
 */
const MAX_WIEDERHOLUNGEN = 1;
const MAX_AUFRUFDAUER_MS = ANFRAGE_TIMEOUT_MS * (MAX_WIEDERHOLUNGEN + 1);

/**
 * Blätter werden nebenläufig ausgewertet — sie sind voneinander unabhängig,
 * sobald der Kontext steht. Sequentiell überschreitet ein fünfseitiger Plansatz
 * das Zeitbudget. Die Grenze hält die Last gegen die API im Rahmen.
 */
const MAX_PARALLEL = 3;

/**
 * Arbeitet die Einträge mit begrenzter Nebenläufigkeit ab und behält die
 * Reihenfolge der Ergebnisse bei.
 */
async function parallelMitGrenze<T, R>(
  eintraege: T[],
  grenze: number,
  arbeit: (eintrag: T, index: number) => Promise<R>,
): Promise<R[]> {
  const ergebnisse = new Array<R>(eintraege.length);
  let naechster = 0;

  async function arbeiter(): Promise<void> {
    while (naechster < eintraege.length) {
      const i = naechster++;
      ergebnisse[i] = await arbeit(eintraege[i], i);
    }
  }

  await Promise.all(Array.from({ length: Math.min(grenze, eintraege.length) }, arbeiter));
  return ergebnisse;
}

/**
 * Benennt einen Fehler in der Sprache des Nutzers. Rohe SDK-Texte gehören nicht
 * in einen Massenauszug, den ein Baumeister liest.
 */
function fehlertext(fehler: unknown): string {
  if (fehler instanceof Anthropic.RateLimitError) return "Kontingent der Anthropic API erschöpft";
  if (fehler instanceof Anthropic.AuthenticationError) return "API-Schlüssel abgelehnt";
  if (fehler instanceof Anthropic.APIConnectionTimeoutError) return "Zeitüberschreitung";
  if (fehler instanceof Anthropic.APIConnectionError) return "API nicht erreichbar";
  if (fehler instanceof Anthropic.APIError) return `API-Fehler ${fehler.status ?? ""}`.trim();
  return "unerwarteter Fehler";
}

/** Ein abgelehnter Schlüssel betrifft jeden Aufruf — weiterzumachen ist sinnlos. */
function istEndgueltig(fehler: unknown): boolean {
  return fehler instanceof Anthropic.AuthenticationError || fehler instanceof Anthropic.PermissionDeniedError;
}

const ELEMENT_TYPEN = [
  "fenster",
  "tuer",
  "wand",
  "stuetze",
  "unterzug",
  "boden",
  "decke",
  "dach",
  "fundament",
  "sonstiges",
] as const;

const KONFIDENZ = ["plan", "berechnet", "annahme"] as const;

const KontextSchema = z.object({
  legende: z
    .array(
      z.object({
        farbe: z.string().describe("Farbe laut Planlegende, z.B. rot, grün, orange"),
        bedeutung: z.string().describe("Zugehöriger Baustoff, z.B. Ziegel, Stahlbeton"),
      }),
    )
    .describe("Farbcodierung der Planlegende. Leer lassen, wenn keine Legende vorhanden ist."),
  geschosshoehen: z
    .array(
      z.object({
        geschoss: z.string().describe("Bezeichnung, z.B. EG, OG, DG"),
        lichte_hoehe_m: z.number().describe("Lichte Raumhöhe in Metern aus dem Schnitt"),
      }),
    )
    .describe("Nur Werte, die in einem Schnitt bemaßt sind. Nicht aus Grundrissen schätzen."),
  nachweise: z
    .array(
      z.object({
        bezeichnung: z.string().describe("z.B. Bebaute Fläche, Wohnnutzfläche, Fassadenabwicklung"),
        wert: z.number(),
        einheit: z.string().describe("z.B. m2, m3, m"),
      }),
    )
    .describe("Werte aus Flächenaufstellung und behördlichen Nachweisen."),
  hinweise: z.array(z.string()).describe("Widersprüche und fehlende Unterlagen im Plansatz."),
});

const SeitenSchema = z.object({
  raeume: z.array(
    z.object({
      geschoss: z.string().describe("Geschoß laut Planüberschrift, z.B. EG, OG, DG"),
      name: z.string().describe("Raumname laut Stempel"),
      flaeche_m2: z.number().describe("Im Raumstempel ausgewiesene Fläche, unverändert übernehmen"),
      belag: z.string().nullable().describe("Belagsangabe im Stempel, z.B. Parkett, Fliesen"),
      laenge_m: z.number().nullable().describe("Nur wenn im Plan bemaßt, sonst null"),
      breite_m: z.number().nullable().describe("Nur wenn im Plan bemaßt, sonst null"),
      beheizt: z.boolean().describe("Garage, Terrasse, Balkon und unkonditionierte Räume sind nicht beheizt"),
      nassraum: z.boolean().describe("Bad, WC, Dusche"),
      konfidenz: z.enum(KONFIDENZ),
      quelle: z.string(),
    }),
  ),
  elemente: z.array(
    z.object({
      type: z.enum(ELEMENT_TYPEN),
      label: z.string().describe("Raum- oder Bauteilbezeichnung laut Plan"),
      breite_m: z.number(),
      hoehe_m: z.number(),
      tiefe_m: z.number().nullable(),
      anzahl: z.number(),
      material: z.string().nullable().describe("Baustoff, wenn über Legende oder Beschriftung belegt"),
      konfidenz: z.enum(KONFIDENZ),
      quelle: z.string().describe("Fundstelle im Plan, z.B. Raumstempel Wohnküche, Maßkette Achse B"),
      rechenweg: z.string(),
    }),
  ),
  hinweise: z.array(z.string()),
});

const KONTEXT_PROMPT = `Du liest österreichische Einreichpläne (§70 Wiener Bauordnung) als Baukalkulator.

Dieser Durchgang erfasst NUR die Angaben, die für den gesamten Plansatz gelten. Einzelne Bauteile werden später ausgewertet.

Erfasse:
1. LEGENDE — die Farbcodierung. In österreichischen Einreichplänen üblich: rot = Ziegel, grün = Stahlbeton, orange = Dämmung weich oder GK-Ständerwand, magenta = Dämmung hart, braun = Holzkonstruktion, grau = Bestand, gelb = Abbruch. Übernimm aber immer die Legende des vorliegenden Plans, nicht diese Konvention.
2. GESCHOSSHÖHEN — ausschließlich aus den Schnitten. Ein Grundriss enthält keine Höhen. Wenn kein Schnitt vorliegt, gib eine leere Liste zurück und vermerke das unter hinweise.
3. NACHWEISE — Werte aus Flächenaufstellung, behördlichen Nachweisen und Planbeschriftung. Diese Blöcke sind vom Planverfasser gerechnet und die verlässlichste Quelle im ganzen Plansatz.

Suche gezielt nach diesen Werten und gib sie EXAKT unter dem angegebenen Namen zurück, damit die Weiterverarbeitung sie findet:
${nachweisAnweisung()}

Nicht jeder Plansatz enthält alle. Was fehlt, lässt du weg — aber suche jeden einzeln, auch in Ansichten, Schnitten und der Dachdraufsicht, nicht nur im Nachweisblock. Weitere Nachweiswerte darfst du zusätzlich liefern.
4. HINWEISE — Widersprüche (etwa Summe der Raumflächen gegen Wohnnutzfläche im Nachweis) und fehlende Unterlagen, auf die der Plan verweist (Aufbautenliste, Fenster- und Türliste, Statik).

Erfinde keine Werte. Was nicht im Plan steht, bleibt leer.`;

const SEITEN_PROMPT = `Du liest österreichische Einreichpläne als Baukalkulator und ermittelst Massen.

Erfasse zwei Dinge getrennt: RÄUME (jeder Raumstempel eines Grundrisses) und BAUTEILE (Fenster, Türen, Stützen und Ähnliches).

RÄUME sind die Grundlage aller Folgemengen — Estrich, Belag, Putz und Malerei leiten sich aus ihnen ab. Erfasse jeden Raumstempel eines Grundrisses, auch Garage, Terrasse und Balkon, und markiere diese als nicht beheizt. Übernimm die ausgewiesene Fläche unverändert. Länge und Breite nur, wenn sie im Plan bemaßt sind — rechne sie nicht aus der Fläche zurück.

QUELLENHIERARCHIE — in dieser Reihenfolge:
1. Raumstempel mit ausgewiesener Quadratmeterzahl und Belagsangabe. Das ist die sicherste Quelle. Übernimm die Fläche unverändert, statt sie aus Maßketten nachzurechnen.
2. Bemaßte Maßketten.
3. Alles andere ist unsicher.

KONFIDENZ — jedes Element bekommt genau eine:
- "plan": Der Wert steht beschriftet im Plan.
- "berechnet": Aus bemaßten Planmaßen gerechnet, Rechenweg nachvollziehbar.
- "annahme": Schichtstärke, Höhe oder Stückzahl ist nicht bemaßt. Verwende das auch bei abgezählten Elementen ohne Fenster- oder Türliste.

MATERIAL — leite es aus der Farbcodierung der Legende oder aus der Beschriftung ab (etwa "STB Stütze 60/25" für Stahlbeton). Das Material entscheidet über die Leistungsgruppe, deshalb ist es wichtiger als eine geschätzte Abmessung. Ohne Beleg: null.

MASSE — alle Längen in Metern. Bei Fenster- und Türbeschriftungen der Form "90/220" ist 90 die Breite in Zentimetern und 220 die Höhe, also 0,90 m und 2,20 m. "FPH" ist die Fensterparapethöhe, keine Fensterhöhe.

Gib für jedes Element den Rechenweg und die Fundstelle an. Erfinde nichts: Elemente ohne Beleg im Plan gehören nicht in die Liste, sondern unter hinweise.`;

function baueKontextText(kontext: PlanKontext): string {
  const zeilen: string[] = [];

  const legende = Object.entries(kontext.legende);
  if (legende.length > 0) {
    zeilen.push(`Planlegende: ${legende.map(([f, b]) => `${f} = ${b}`).join(", ")}`);
  }

  const hoehen = Object.entries(kontext.geschosshoehen);
  if (hoehen.length > 0) {
    zeilen.push(`Lichte Raumhöhen aus den Schnitten: ${hoehen.map(([g, h]) => `${g} = ${h} m`).join(", ")}`);
  }

  const nachweise = Object.entries(kontext.nachweise);
  if (nachweise.length > 0) {
    zeilen.push(`Nachweise: ${nachweise.map(([b, w]) => `${b} = ${w}`).join(", ")}`);
  }

  return zeilen.length > 0
    ? `Für den gesamten Plansatz gilt:\n${zeilen.join("\n")}`
    : "Für diesen Plansatz konnten keine übergreifenden Angaben erhoben werden.";
}

/**
 * Für Putz, Malerei und Sockelleisten wird der Raumumfang gebraucht. Steht nur
 * die Fläche im Stempel, wird er über ein angenommenes Seitenverhältnis von
 * 1,4 genähert — bei üblichen Wohnraumzuschnitten liegt das rund zwei Prozent
 * neben dem gerechneten Wert. Der Rückgabewert sagt, welcher Fall vorlag.
 */
const SEITENVERHAELTNIS = 1.4;

function ermittleUmfang(
  flaeche: number,
  laenge: number | null,
  breite: number | null,
): { umfang_m: number; umfangQuelle: "gerechnet" | "geschaetzt" } {
  if (laenge && breite && laenge > 0 && breite > 0) {
    return { umfang_m: 2 * (laenge + breite), umfangQuelle: "gerechnet" };
  }
  const kurz = Math.sqrt(flaeche / SEITENVERHAELTNIS);
  return { umfang_m: 2 * kurz * (1 + SEITENVERHAELTNIS), umfangQuelle: "geschaetzt" };
}

function alsBild(bild: Buffer) {
  return {
    type: "image" as const,
    source: { type: "base64" as const, media_type: "image/png" as const, data: bild.toString("base64") },
  };
}

/**
 * Erster Durchgang über den gesamten Plansatz. Legende, Schnitthöhen und
 * Nachweise stehen auf anderen Blättern als die Bauteile, die sie beschreiben —
 * ohne diesen Schritt wertet jede Seite isoliert aus und die Materialzuordnung
 * bleibt leer.
 */
async function erhebeKontext(client: Anthropic, bilder: Buffer[]): Promise<PlanKontext> {
  const auswahl = bilder.slice(0, MAX_KONTEXT_SEITEN);
  const leer: PlanKontext = { legende: {}, geschosshoehen: {}, nachweise: {}, hinweise: [] };

  let geparst;
  try {
    const antwort = await client.messages.parse(
      {
        model: MODELL,
        max_tokens: 16000,
        system: KONTEXT_PROMPT,
        thinking: { type: "adaptive" },
        output_config: { effort: "high", format: zodOutputFormat(KontextSchema) },
        messages: [
          {
            role: "user",
            content: [
              ...auswahl.map(alsBild),
              {
                type: "text",
                text: `Der Plansatz umfasst ${auswahl.length} Blätter. Erfasse die übergreifenden Angaben.`,
              },
            ],
          },
        ],
      },
      { timeout: ANFRAGE_TIMEOUT_MS },
    );
    geparst = antwort.parsed_output;
  } catch (fehler) {
    // Ein abgelehnter Schlüssel trifft jeden folgenden Aufruf gleichermaßen:
    // durchreichen, damit die Route eine klare Meldung geben kann statt eines
    // leeren Auszugs mit HTTP 200.
    if (istEndgueltig(fehler)) throw fehler;
    // Ohne Kontext bleiben Materialzuordnung und Wandhöhen offen, die Räume
    // lassen sich aber weiterhin erfassen — besser als gar kein Ergebnis.
    return {
      ...leer,
      hinweise: [
        `Die übergreifenden Planangaben konnten nicht gelesen werden (${fehlertext(fehler)}). Legende, Schnitthöhen und Nachweise fehlen daher.`,
      ],
    };
  }

  if (!geparst) {
    return { ...leer, hinweise: ["Die übergreifenden Planangaben konnten nicht gelesen werden."] };
  }

  const hinweise = [...geparst.hinweise];
  if (bilder.length > auswahl.length) {
    hinweise.push(
      `Für die Legende und die Nachweise wurden nur die ersten ${auswahl.length} von ${bilder.length} Blättern ausgewertet.`,
    );
  }

  return {
    legende: Object.fromEntries(geparst.legende.map((e) => [e.farbe, e.bedeutung])),
    geschosshoehen: Object.fromEntries(geparst.geschosshoehen.map((e) => [e.geschoss, e.lichte_hoehe_m])),
    nachweise: Object.fromEntries(geparst.nachweise.map((e) => [`${e.bezeichnung} (${e.einheit})`, e.wert])),
    hinweise,
  };
}

/** Ergebnis der Auswertung eines einzelnen Blattes. */
interface Blattergebnis {
  raeume: Raum[];
  elemente: DetectedElement[];
  hinweise: string[];
  /** Gesetzt, wenn der Aufruf scheiterte — für die Auswertung, ob alles scheiterte. */
  fehler?: unknown;
}

async function werteBlattAus(
  client: Anthropic,
  bild: Buffer,
  blatt: number,
  vonBlaettern: number,
  kontextText: string,
): Promise<Blattergebnis> {
  const leer: Blattergebnis = { raeume: [], elemente: [], hinweise: [] };

  let geparst;
  try {
    const antwort = await client.messages.parse(
      {
        model: MODELL,
        max_tokens: 16000,
        system: SEITEN_PROMPT,
        thinking: { type: "adaptive" },
        output_config: { effort: "high", format: zodOutputFormat(SeitenSchema) },
        messages: [
          {
            role: "user",
            content: [
              alsBild(bild),
              { type: "text", text: `${kontextText}\n\nWerte Blatt ${blatt} von ${vonBlaettern} aus.` },
            ],
          },
        ],
      },
      { timeout: ANFRAGE_TIMEOUT_MS },
    );
    geparst = antwort.parsed_output;
  } catch (fehler) {
    if (istEndgueltig(fehler)) throw fehler;
    // Ein gescheitertes Blatt darf die übrigen nicht mitreißen.
    return { ...leer, hinweise: [`Blatt ${blatt}: nicht ausgewertet (${fehlertext(fehler)}).`], fehler };
  }

  if (!geparst) {
    return { ...leer, hinweise: [`Blatt ${blatt}: Die Antwort konnte nicht gelesen werden, übersprungen.`] };
  }

  return {
    raeume: geparst.raeume.map((r) => ({
      id: crypto.randomUUID(),
      geschoss: r.geschoss,
      name: r.name,
      flaeche_m2: r.flaeche_m2,
      belag: r.belag ?? undefined,
      laenge_m: r.laenge_m ?? undefined,
      breite_m: r.breite_m ?? undefined,
      ...ermittleUmfang(r.flaeche_m2, r.laenge_m, r.breite_m),
      beheizt: r.beheizt,
      nassraum: r.nassraum,
      konfidenz: r.konfidenz as Konfidenz,
      quelle: `${r.quelle} (Blatt ${blatt})`,
    })),
    elemente: geparst.elemente.map((el) => ({
      id: crypto.randomUUID(),
      type: el.type as ElementType,
      label: el.label,
      breite_m: el.breite_m,
      hoehe_m: el.hoehe_m,
      tiefe_m: el.tiefe_m ?? undefined,
      anzahl: el.anzahl,
      material: el.material ?? undefined,
      konfidenz: el.konfidenz as Konfidenz,
      quelle: `${el.quelle} (Blatt ${blatt})`,
      rechenweg: el.rechenweg,
    })),
    hinweise: geparst.hinweise.map((h) => `Blatt ${blatt}: ${h}`),
  };
}

export async function analysiereBildseiten(
  bilder: Buffer[],
  dateiname: string,
  dateityp: AnalysisResult["dateityp"],
  frist: number,
): Promise<AnalysisResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Der Weg zum Hinterlegen ist ein anderer, je nachdem wo die Anwendung
    // läuft. Ein Verweis auf .env.local hilft niemandem, der auf Vercel sucht.
    throw new Error(
      process.env.VERCEL
        ? "Es ist kein ANTHROPIC_API_KEY hinterlegt. In Vercel unter Settings, Environment Variables eintragen und danach neu deployen."
        : "Es ist kein ANTHROPIC_API_KEY hinterlegt. Für die lokale Entwicklung in .env.local eintragen.",
    );
  }

  const client = new Anthropic({ apiKey, maxRetries: MAX_WIEDERHOLUNGEN });

  const kontext = await erhebeKontext(client, bilder);
  const kontextText = baueKontextText(kontext);

  const uebersprungen: number[] = [];
  const ergebnisse = await parallelMitGrenze(bilder, MAX_PARALLEL, async (bild, i) => {
    // Vor jedem Blatt prüfen: ein angefangener Aufruf, der in die Zeitüberschreitung
    // der Route läuft, liefert gar nichts — ein ausgelassenes Blatt kostet nur dieses.
    // Gerechnet wird mit der vollen Aufrufdauer inklusive Wiederholung.
    if (Date.now() + MAX_AUFRUFDAUER_MS > frist) {
      uebersprungen.push(i + 1);
      return { raeume: [], elemente: [], hinweise: [] } satisfies Blattergebnis;
    }
    return werteBlattAus(client, bild, i + 1, bilder.length, kontextText);
  });

  // Scheitert jedes Blatt, ist das kein Teilausfall, sondern ein Ausfall: den
  // ersten Fehler weiterreichen, damit die Route ihn benennen kann.
  const versucht = ergebnisse.filter((_, i) => !uebersprungen.includes(i + 1));
  if (versucht.length > 0 && versucht.every((e) => e.fehler !== undefined)) {
    throw versucht[0].fehler;
  }

  // Hinweise zum Plansatz gehören zu den Prüfpunkten, Hinweise zu einzelnen
  // Blättern unter "Zur Kontrolle". Ein unvollständiger Auszug ist ein
  // Prüfpunkt, kein Randdetail.
  const kontextHinweise = [...kontext.hinweise];
  if (uebersprungen.length > 0) {
    kontextHinweise.push(
      `Zeitrahmen erreicht: ${uebersprungen.length} von ${bilder.length} Blättern wurden nicht ausgewertet (Blatt ${uebersprungen
        .sort((a, b) => a - b)
        .join(", ")}). Der Auszug ist unvollständig.`,
    );
  }

  return {
    dateiname,
    dateityp,
    seiten: bilder.length,
    kontext: { ...kontext, hinweise: kontextHinweise },
    raeume: ergebnisse.flatMap((e) => e.raeume),
    elemente: ergebnisse.flatMap((e) => e.elemente),
    hinweise: ergebnisse.flatMap((e) => e.hinweise),
  };
}
