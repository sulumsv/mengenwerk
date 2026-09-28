import { ANNAHMEN, type AnnahmeId } from "./annahmen";

/**
 * Korrekturen des Nutzers an einer Mengenermittlung.
 *
 * Sie ersetzen Annahmen durch das, was der Nutzer im Plan sieht, und wirken
 * auf jede Position, die den Wert verwendet. Geschoßschlüssel "*" gilt für
 * alle Geschoße ohne eigenen Eintrag.
 */
export interface Korrekturen {
  /** Lichte Raumhöhe in m. "*" ersetzt nur angenommene Höhen, ein Geschoß überschreibt auch den Schnitt. */
  raumhoehe: Record<string, number>;
  /** Unterkante abgehängte Decke in m: dort endet die Malerei der Wände. */
  deckenUnterkante: Record<string, number>;
  /** Ersetzte Annahmen, Wert in der Einheit der Annahme. */
  annahmen: Partial<Record<AnnahmeId, number>>;
}

export const KEINE_KORREKTUREN: Korrekturen = { raumhoehe: {}, deckenUnterkante: {}, annahmen: {} };

export function istLeer(k: Korrekturen): boolean {
  return (
    Object.keys(k.raumhoehe).length === 0 &&
    Object.keys(k.deckenUnterkante).length === 0 &&
    Object.keys(k.annahmen).length === 0
  );
}

export function fuehreZusammen(alt: Korrekturen, neu: Korrekturen): Korrekturen {
  return {
    raumhoehe: { ...alt.raumhoehe, ...neu.raumhoehe },
    deckenUnterkante: { ...alt.deckenUnterkante, ...neu.deckenUnterkante },
    annahmen: { ...alt.annahmen, ...neu.annahmen },
  };
}

const zahl = (n: number, dez = 2) => n.toLocaleString("de-AT", { minimumFractionDigits: dez, maximumFractionDigits: dez });
const geschossText = (g: string) => (g === "*" ? "alle Geschoße" : g);

/** Lesbare Liste der Korrekturen, z.B. für die Anzeige und die Prüfpunkte. */
export function beschreibe(k: Korrekturen): string[] {
  const zeilen: string[] = [];
  for (const [g, w] of Object.entries(k.raumhoehe)) zeilen.push(`Lichte Raumhöhe ${geschossText(g)}: ${zahl(w)} m`);
  for (const [g, w] of Object.entries(k.deckenUnterkante))
    zeilen.push(`Unterkante abgehängte Decke ${geschossText(g)}: ${zahl(w)} m`);
  for (const [id, w] of Object.entries(k.annahmen) as [AnnahmeId, number][]) {
    const a = ANNAHMEN[id];
    zeilen.push(`${a.titel.replace(/\s[\d,.]+\s*(cm|m|%|kg\/m³)?$/, "")}: ${formatiere(w, a.einheit)}`);
  }
  return zeilen;
}

function formatiere(w: number, einheit: string): string {
  if (einheit === "m") return w < 1 ? `${zahl(w * 100, 0)} cm` : `${zahl(w)} m`;
  if (einheit === "-") return `${zahl(w * 100, 0)} %`;
  return `${zahl(w, 0)} ${einheit}`;
}

// ── Lesen eines frei geschriebenen Korrektursatzes ──

const GESCHOSSE: [RegExp, string][] = [
  [/\b(dg|dachgescho(ss|ß)\w*)\b/i, "DG"],
  [/\b(\d\.\s*og|og|obergescho(ss|ß)\w*)\b/i, "OG"],
  [/\b(eg|erdgescho(ss|ß)\w*)\b/i, "EG"],
  [/\b(kg|ug|kellergescho(ss|ß)\w*|untergescho(ss|ß)\w*|keller)\b/i, "KG"],
];

type Laenge = "m" | "anteil" | "roh";

const ANNAHME_BEGRIFFE: { muster: RegExp; id: AnnahmeId; art: Laenge }[] = [
  { muster: /estrich(st(ä|ae)rke|dicke|h(ö|oe)he)?/i, id: "estrichstaerke", art: "m" },
  { muster: /bodenplatte/i, id: "bodenplattenstaerke", art: "m" },
  { muster: /(gescho(ss|ß)decke|deckenst(ä|ae)rke|rohdecke\s*st(ä|ae)rke)/i, id: "geschossdeckenstaerke", art: "m" },
  { muster: /(au(ß|ss)enwand|tragschale|wandst(ä|ae)rke)/i, id: "aussenwandstaerke", art: "m" },
  { muster: /(fliesenspiegel|fliesen\s*bis|verfliest\s*bis|fliesenh(ö|oe)he)/i, id: "fliesenspiegelhoehe", art: "m" },
  { muster: /t(ü|ue)rh(ö|oe)he/i, id: "tuerhoeheDurchgang", art: "m" },
  { muster: /t(ü|ue)rbreite/i, id: "tuerbreiteDurchgang", art: "m" },
  { muster: /bewehrung(sgrad)?/i, id: "bewehrungsgrad", art: "roh" },
  { muster: /(ö|oe)ffnungsanteil/i, id: "oeffnungsanteilFassade", art: "anteil" },
  { muster: /ger(ü|ue)st(\s*(ü|ue)berstand|zuschlag)?/i, id: "geruestZuschlag", art: "m" },
];

const RAUMHOEHE = /(lichte\s*(raum)?h(ö|oe)he|raumh(ö|oe)he|gescho(ss|ß)h(ö|oe)he|wandh(ö|oe)he|raumhoehe)/i;
const DECKE_UK =
  /(abgeh(ä|ae)ngte?n?\s*decke|unterkante\s*(der\s*)?(abgeh(ä|ae)ngte?n?\s*)?decke|uk\s*(abgeh(ä|ae)ngte?n?\s*)?decke|deckenunterkante|decken[-\s]?uk|uk\s*decke)/i;

type Wert = { wert: number; einheit: string; pos: number };

/** Zahlen mit Einheit in einem Textstück; verworfen werden Werte hinter "statt", "anstatt", "von", "nicht". */
function zielwerte(stueck: string): Wert[] {
  const re = /(statt|anstatt|anstelle|von|nicht|alt)?\s*(\d+(?:[.,]\d+)?)\s*(zentimeter|millimeter|metern?|cm|mm|m|%|prozent|kg)?/gi;
  const einheiten: Record<string, string> = { zentimeter: "cm", millimeter: "mm", meter: "m", metern: "m", prozent: "%" };
  const werte: Wert[] = [];
  for (const m of stueck.matchAll(re)) {
    if (m[1]) continue;
    const wert = Number(m[2].replace(",", "."));
    const e = (m[3] ?? "").toLowerCase();
    if (Number.isFinite(wert)) werte.push({ wert, einheit: einheiten[e] ?? e, pos: m.index! });
  }
  return werte;
}

/** Geschoßnennungen mit Stelle im Text. */
function geschossNennungen(stueck: string): { pos: number; g: string }[] {
  const liste: { pos: number; g: string }[] = [];
  for (const [re, g] of GESCHOSSE) {
    for (const m of stueck.matchAll(new RegExp(re.source, "gi"))) liste.push({ pos: m.index!, g });
  }
  return liste.sort((a, b) => a.pos - b.pos);
}

function inMetern(w: { wert: number; einheit: string }): number {
  if (w.einheit === "cm") return w.wert / 100;
  if (w.einheit === "mm") return w.wert / 1000;
  if (w.einheit === "m") return w.wert;
  // Ohne Einheit: Zahlen über 5 sind im Bauwesen Zentimeter ("Estrich 6", "Decke 20")
  return w.wert > 5 ? w.wert / 100 : w.wert;
}

function umrechnen(w: { wert: number; einheit: string }, art: Laenge): number {
  if (art === "m") return inMetern(w);
  if (art === "anteil") return w.einheit === "%" || w.wert > 1 ? w.wert / 100 : w.wert;
  return w.wert;
}

/**
 * Liest Korrekturen aus einem deutschen Satz, z.B. "Raumhöhe statt 2,50 m
 * auf 2,90 m, abgehängte Decke UK 2,75 m". Was nicht erkannt wird, bleibt
 * leer — der Aufrufer kann dann auf die KI ausweichen.
 */
export function leseKorrektur(text: string): Korrekturen {
  const k: Korrekturen = { raumhoehe: {}, deckenUnterkante: {}, annahmen: {} };

  // Alle Stichwörter mit ihrer Stelle im Text; jedes gilt bis zum nächsten.
  type Treffer = { start: number; ende: number; ziel: "uk" | "rh" | AnnahmeId; art: Laenge };
  const treffer: Treffer[] = [];
  const sammle = (muster: RegExp, ziel: Treffer["ziel"], art: Laenge) => {
    for (const m of text.matchAll(new RegExp(muster.source, "gi"))) {
      const t = { start: m.index!, ende: m.index! + m[0].length, ziel, art };
      // Kein doppelter Treffer an derselben Stelle (UK-Decke vor Geschoßdecke)
      if (!treffer.some((x) => t.start < x.ende && x.start < t.ende)) treffer.push(t);
    }
  };
  sammle(DECKE_UK, "uk", "m");
  sammle(RAUMHOEHE, "rh", "m");
  for (const b of ANNAHME_BEGRIFFE) sammle(b.muster, b.id, b.art);
  treffer.sort((a, b) => a.start - b.start);

  treffer.forEach((t, i) => {
    const bis = treffer[i + 1]?.start ?? text.length;
    const davor = text.slice(treffer[i - 1]?.ende ?? 0, t.start);
    const danach = text.slice(t.ende, bis);
    const setze = (geschoss: string, w: Wert) => {
      if (t.ziel === "uk") k.deckenUnterkante[geschoss] = inMetern(w);
      else if (t.ziel === "rh") k.raumhoehe[geschoss] = inMetern(w);
      else k.annahmen[t.ziel] = umrechnen(w, t.art);
    };

    const vorher = geschossNennungen(davor).at(-1)?.g ?? "*";
    const werte = zielwerte(danach);
    if (werte.length === 0) {
      // "2,90 statt 2,50 bei der Raumhöhe": der Wert steht vor dem Stichwort
      const w = zielwerte(davor).at(-1);
      if (w) setze(vorher, w);
      return;
    }
    // Jeder Wert gehört zum zuletzt davor genannten Geschoß: "im OG 2,60 und im EG 2,90"
    const nennungen = geschossNennungen(danach);
    const jeGeschoss = new Map<string, Wert>();
    for (const w of werte) {
      const g = nennungen.filter((n) => n.pos < w.pos).at(-1)?.g ?? vorher;
      jeGeschoss.set(g, w);
    }
    for (const [g, w] of jeGeschoss) setze(g, w);
  });

  // Unplausible Werte verwerfen, statt still falsch zu rechnen
  for (const tabelle of [k.raumhoehe, k.deckenUnterkante]) {
    for (const [g, w] of Object.entries(tabelle)) if (!(w >= 1.8 && w <= 8)) delete tabelle[g];
  }
  for (const [id, w] of Object.entries(k.annahmen) as [AnnahmeId, number][]) {
    if (!(w >= 0 && Number.isFinite(w))) delete k.annahmen[id];
  }
  return k;
}
