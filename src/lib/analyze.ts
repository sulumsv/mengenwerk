import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import type { AnalysisResult, DetectedElement, ElementType, Konfidenz, PlanKontext, Raum } from "./types";

const MODELL = "claude-opus-5";

/** Obergrenze für den Kontextdurchgang, damit große Plansätze die Anfrage nicht sprengen. */
const MAX_KONTEXT_SEITEN = 12;

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
3. NACHWEISE — Flächenaufstellung, bebaute Fläche, Wohnnutzfläche, Bruttogrundrissfläche, Fassadenabwicklung, Giebelflächen. Diese Blöcke sind vom Planverfasser gerechnet und die verlässlichste Quelle im ganzen Plansatz.
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

  const antwort = await client.messages.parse({
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
          { type: "text", text: `Der Plansatz umfasst ${auswahl.length} Blätter. Erfasse die übergreifenden Angaben.` },
        ],
      },
    ],
  });

  const leer: PlanKontext = { legende: {}, geschosshoehen: {}, nachweise: {}, hinweise: [] };
  const geparst = antwort.parsed_output;
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

export async function analysiereBildseiten(
  bilder: Buffer[],
  dateiname: string,
  dateityp: AnalysisResult["dateityp"],
): Promise<AnalysisResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY ist nicht gesetzt. Bitte in .env.local eintragen.");
  }
  const client = new Anthropic({ apiKey });

  const kontext = await erhebeKontext(client, bilder);
  const kontextText = baueKontextText(kontext);

  const alleRaeume: Raum[] = [];
  const alleElemente: DetectedElement[] = [];
  const alleHinweise: string[] = [];

  for (let i = 0; i < bilder.length; i++) {
    const antwort = await client.messages.parse({
      model: MODELL,
      max_tokens: 16000,
      system: SEITEN_PROMPT,
      thinking: { type: "adaptive" },
      output_config: { effort: "high", format: zodOutputFormat(SeitenSchema) },
      messages: [
        {
          role: "user",
          content: [
            alsBild(bilder[i]),
            {
              type: "text",
              text: `${kontextText}\n\nWerte Blatt ${i + 1} von ${bilder.length} aus.`,
            },
          ],
        },
      ],
    });

    const geparst = antwort.parsed_output;
    if (!geparst) {
      alleHinweise.push(`Blatt ${i + 1}: Die Antwort konnte nicht gelesen werden, übersprungen.`);
      continue;
    }

    for (const r of geparst.raeume) {
      alleRaeume.push({
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
        quelle: `${r.quelle} (Blatt ${i + 1})`,
      });
    }

    for (const el of geparst.elemente) {
      alleElemente.push({
        id: crypto.randomUUID(),
        type: el.type as ElementType,
        label: el.label,
        breite_m: el.breite_m,
        hoehe_m: el.hoehe_m,
        tiefe_m: el.tiefe_m ?? undefined,
        anzahl: el.anzahl,
        material: el.material ?? undefined,
        konfidenz: el.konfidenz as Konfidenz,
        quelle: `${el.quelle} (Blatt ${i + 1})`,
        rechenweg: el.rechenweg,
      });
    }

    alleHinweise.push(...geparst.hinweise.map((h) => `Blatt ${i + 1}: ${h}`));
  }

  return {
    dateiname,
    dateityp,
    seiten: bilder.length,
    kontext,
    raeume: alleRaeume,
    elemente: alleElemente,
    hinweise: alleHinweise,
  };
}
