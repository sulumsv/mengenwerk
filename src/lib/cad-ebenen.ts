/**
 * Auswertung von Vektor-PDFs, die ihre CAD-Ebenen mitbringen.
 *
 * Architekturbüros exportieren Pläne oft mit Ebenen wie "110 Wand Aussen" oder
 * "250 Unterzug Traeger". Dann steht nicht nur da, wo eine Linie liegt,
 * sondern auch, was sie ist. Die gefüllten Flächen einer Wandebene sind die
 * geschnittenen Wände im Grundriss; aus Fläche und Umfang jeder Fläche folgen
 * Dicke und Länge.
 *
 * Die Zuordnung von Ebenennamen zu Bauteilen ist bewusst eine Tabelle: jedes
 * Büro benennt seine Ebenen anders, und jeder neue Plan kann eine Zeile
 * ergänzen, ohne dass sich die Rechnung ändert.
 */

export type Bauteilart = "aussenwand" | "innenwand" | "unterzug" | "stuetze";

export const BAUTEIL_TITEL: Record<Bauteilart, string> = {
  aussenwand: "Außenwand",
  innenwand: "Innenwand",
  unterzug: "Unterzug",
  stuetze: "Stütze",
};

/** Ebenennamen → Bauteil. Reihenfolge zählt: die erste passende Regel gilt. */
export const EBENEN_REGELN: { muster: RegExp; art: Bauteilart | null }[] = [
  { muster: /unsichtbar|abgeh(ae|ä)ngt|daemm|dämm|elr|trockenbau|gk\b|leicht/i, art: null },
  { muster: /unterzug|tr(ae|ä)ger|\bUZ\b/i, art: "unterzug" },
  { muster: /st(ue|ü)tze/i, art: "stuetze" },
  { muster: /wand.*au(ss|ß)en|au(ss|ß)enwand|\bAW\b/i, art: "aussenwand" },
  { muster: /wand.*innen|innenwand|\bIW\b|wand.*tragend/i, art: "innenwand" },
];

export function bauteilFuerEbene(name: string): Bauteilart | null {
  for (const r of EBENEN_REGELN) if (r.muster.test(name)) return r.art;
  return null;
}

/** Übliche Bauteildicken in m; gemessene Werte rasten auf den nächsten ein. */
const RASTER = [0.12, 0.15, 0.18, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.25, 1.4, 1.6];

function einrasten(d: number): number {
  let best = RASTER[0];
  for (const r of RASTER) if (Math.abs(r - d) < Math.abs(best - d)) best = r;
  return Math.abs(best - d) <= 0.025 ? best : Math.round(d * 20) / 20;
}

export interface CadFlaeche {
  ebene: string;
  farbe: string;
  /** Lage der Fläche auf dem Blatt, nur um Doppelzeichnungen zu erkennen. */
  ort: string;
  seite: number;
  /** Außenkontur in PDF-Koordinaten, für die Kontrollansicht. */
  kontur: [number, number][];
  flaeche_m2: number;
  umfang_m: number;
}

export interface CadPosition {
  art: Bauteilart;
  dicke_m: number;
  laenge_m: number;
  flaeche_m2: number;
  teile: number;
}

export interface CadKontur {
  seite: number;
  art: Bauteilart;
  dicke_m: number;
  laenge_m: number;
  flaeche_m2: number;
  kontur: [number, number][];
}

export interface CadAuswertung {
  massstab: number;
  /** Größe der ersten Seite in PDF-Punkten, für die Kontrollansicht. */
  seite?: { breite: number; hoehe: number; transform: number[] };
  konturen: CadKontur[];
  ebenen: string[];
  erkannteEbenen: { name: string; art: Bauteilart }[];
  positionen: CadPosition[];
}

/** Obergrenze der Dicke je Bauteil; alles darüber ist eine Umrandung, kein Bauteil. */
const MAX_DICKE: Record<Bauteilart, number> = { aussenwand: 0.8, innenwand: 0.6, unterzug: 1.6, stuetze: 1.6 };

/** Untergrenze der Dicke; dünnere Streifen auf Wandebenen sind Putz oder Dämmung. */
const MIN_DICKE: Record<Bauteilart, number> = { aussenwand: 0.11, innenwand: 0.11, unterzug: 0.15, stuetze: 0.15 };

/**
 * Rechnet eine Fläche als langes Rechteck: L · d = A und 2 (L + d) = U.
 * Für L-förmige Wandzüge bleibt die Länge richtig, weil der Umfang beide
 * Schenkel enthält.
 */
function rechteck(a: number, u: number): { laenge: number; dicke: number } | null {
  const halb = u / 2;
  const disk = halb * halb - 4 * a;
  if (disk < 0 || a <= 0) return null;
  const laenge = (halb + Math.sqrt(disk)) / 2;
  return { laenge, dicke: a / laenge };
}

/** Summiert Konturen je Bauteil und Dicke. Ausgeschlossene Konturen (Index) zählen nicht. */
export function summiere(konturen: CadKontur[], ausgeschlossen: Set<number> = new Set()): CadPosition[] {
  const gruppen = new Map<string, CadPosition>();
  konturen.forEach((k, i) => {
    if (ausgeschlossen.has(i)) return;
    const key = `${k.art}|${k.dicke_m}`;
    const g = gruppen.get(key) ?? { art: k.art, dicke_m: k.dicke_m, laenge_m: 0, flaeche_m2: 0, teile: 0 };
    g.laenge_m += k.laenge_m;
    g.flaeche_m2 += k.flaeche_m2;
    g.teile += 1;
    gruppen.set(key, g);
  });
  const reihenfolge: Bauteilart[] = ["aussenwand", "innenwand", "unterzug", "stuetze"];
  return [...gruppen.values()]
    .filter((p) => p.flaeche_m2 >= 0.3)
    .sort((a, b) => reihenfolge.indexOf(a.art) - reihenfolge.indexOf(b.art) || a.dicke_m - b.dicke_m);
}

export function werteAus(flaechen: CadFlaeche[], massstab: number, ebenen: string[]): CadAuswertung {
  const gesehen = new Set<string>();
  const konturen: CadKontur[] = [];

  // Je Ebene zählt nur die vorherrschende Füllfarbe. Andere Farben auf
  // derselben Ebene sind Überlagerungen wie Schnittmarken oder Bauteile
  // anderer Geschoße und würden die Wände doppelt zählen.
  const zaehler = new Map<string, Map<string, number>>();
  for (const f of flaechen) {
    const z = zaehler.get(f.ebene) ?? new Map<string, number>();
    z.set(f.farbe, (z.get(f.farbe) ?? 0) + 1);
    zaehler.set(f.ebene, z);
  }
  const hauptfarbe = new Map<string, string>();
  for (const [ebene, z] of zaehler) hauptfarbe.set(ebene, [...z].sort((a, b) => b[1] - a[1])[0][0]);

  for (const f of flaechen) {
    if (f.farbe !== hauptfarbe.get(f.ebene)) continue;
    const art = bauteilFuerEbene(f.ebene);
    if (!art || f.flaeche_m2 < 0.02) continue;

    // Viele CAD-Exporte zeichnen dieselbe Fläche mehrfach (Füllung, Schraffur).
    const schluessel = `${f.ebene}|${f.ort}|${f.flaeche_m2.toFixed(3)}|${f.umfang_m.toFixed(3)}`;
    if (gesehen.has(schluessel)) continue;
    gesehen.add(schluessel);

    const r = rechteck(f.flaeche_m2, f.umfang_m);
    if (!r || r.dicke > MAX_DICKE[art] || r.dicke < MIN_DICKE[art]) continue;

    const dicke = einrasten(r.dicke);
    konturen.push({ seite: f.seite, art, dicke_m: dicke, laenge_m: r.laenge, flaeche_m2: f.flaeche_m2, kontur: f.kontur });
  }

  const positionen = summiere(konturen);

  const erkannteEbenen = ebenen
    .map((name) => ({ name, art: bauteilFuerEbene(name) }))
    .filter((e): e is { name: string; art: Bauteilart } => e.art !== null);

  return { massstab, konturen, ebenen, erkannteEbenen, positionen };
}

/** Maßstab aus dem Plankopf: der häufigste alleinstehende Eintrag "1:n". */
export function massstabAusText(texte: string[]): number | null {
  const zaehler = new Map<number, number>();
  for (const t of texte) {
    const m = /^\s*(?:M\s*)?1\s*:\s*(\d{2,4})\s*$/i.exec(t);
    if (m) zaehler.set(Number(m[1]), (zaehler.get(Number(m[1])) ?? 0) + 1);
  }
  let best: number | null = null;
  for (const [n, c] of zaehler) if (best === null || c > (zaehler.get(best) ?? 0)) best = n;
  return best;
}

type Matrix = [number, number, number, number, number, number];

const mal = (a: Matrix, b: number[]): Matrix => [
  a[0] * b[0] + a[2] * b[1],
  a[1] * b[0] + a[3] * b[1],
  a[0] * b[2] + a[2] * b[3],
  a[1] * b[2] + a[3] * b[3],
  a[0] * b[4] + a[2] * b[5] + a[4],
  a[1] * b[4] + a[3] * b[5] + a[5],
];

function liegtInnen([x, y]: [number, number], poly: [number, number][]): boolean {
  let innen = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) innen = !innen;
  }
  return innen;
}

export interface OpsTabelle {
  save: number;
  restore: number;
  transform: number;
  constructPath: number;
  beginMarkedContent: number;
  beginMarkedContentProps: number;
  endMarkedContent: number;
  setFillRGBColor: number;
  fill: number;
  eoFill: number;
  fillStroke: number;
  eoFillStroke: number;
  closeFillStroke: number;
  closeEOFillStroke: number;
}

/**
 * Sammelt alle gefüllten Flächen aus der Operatorliste einer PDF-Seite,
 * zusammen mit der Ebene, in der sie gezeichnet wurden. Weiße Füllungen sind
 * Aussparungen, keine Bauteile, und bleiben draußen.
 */
export function sammleFlaechen(
  fnArray: number[],
  argsArray: unknown[][],
  OPS: OpsTabelle,
  ebenenNamen: Record<string, string>,
  massstab: number,
  seite = 1,
): CadFlaeche[] {
  const m = (25.4 / 72 / 1000) * massstab;
  const fuellen = new Set([OPS.fill, OPS.eoFill, OPS.fillStroke, OPS.eoFillStroke, OPS.closeFillStroke, OPS.closeEOFillStroke]);
  let ctm: Matrix = [1, 0, 0, 1, 0, 0];
  let farbe = "";
  const stapel: [Matrix, string][] = [];
  const ebenen: (string | null)[] = [];
  const ergebnis: CadFlaeche[] = [];

  for (let i = 0; i < fnArray.length; i++) {
    const fn = fnArray[i];
    const a = argsArray[i] as unknown[];
    if (fn === OPS.save) stapel.push([ctm, farbe]);
    else if (fn === OPS.restore) [ctm, farbe] = stapel.pop() ?? [ctm, farbe];
    else if (fn === OPS.transform) ctm = mal(ctm, a as number[]);
    else if (fn === OPS.setFillRGBColor) farbe = typeof a[0] === "string" ? (a[0] as string) : (a as number[]).join(",");
    else if (fn === OPS.beginMarkedContentProps) {
      const eigenschaften = a[1] as { id?: string } | null;
      ebenen.push(eigenschaften?.id ? (ebenenNamen[eigenschaften.id] ?? null) : null);
    } else if (fn === OPS.beginMarkedContent) ebenen.push(null);
    else if (fn === OPS.endMarkedContent) ebenen.pop();
    else if (fn === OPS.constructPath) {
      const op = a[0] as number;
      const daten = (a[1] as unknown[])?.[0] as ArrayLike<number> | undefined;
      if (!fuellen.has(op) || !daten || /^#?f{6}$|^255,255,255$/i.test(farbe)) continue;
      const ebene = [...ebenen].reverse().find((e) => e) ?? null;
      if (!ebene) continue;

      const ringe: { a: number; u: number; box: [number, number, number, number]; pts: [number, number][] }[] = [];
      let punkte: [number, number][] = [];
      const abschliessen = () => {
        if (punkte.length > 2) {
          let s = 0;
          let u = 0;
          const box: [number, number, number, number] = [Infinity, Infinity, -Infinity, -Infinity];
          for (let k = 0; k < punkte.length; k++) {
            const [x1, y1] = punkte[k];
            const [x2, y2] = punkte[(k + 1) % punkte.length];
            s += x1 * y2 - x2 * y1;
            u += Math.hypot(x2 - x1, y2 - y1);
            box[0] = Math.min(box[0], x1);
            box[1] = Math.min(box[1], y1);
            box[2] = Math.max(box[2], x1);
            box[3] = Math.max(box[3], y1);
          }
          ringe.push({ a: Math.abs(s) / 2, u, box, pts: punkte });
        }
        punkte = [];
      };
      const p = (x: number, y: number): [number, number] => [ctm[0] * x + ctm[2] * y + ctm[4], ctm[1] * x + ctm[3] * y + ctm[5]];
      for (let k = 0; k < daten.length; ) {
        const o = daten[k++];
        if (o === 0) {
          abschliessen();
          punkte.push(p(daten[k++], daten[k++]));
        } else if (o === 1) punkte.push(p(daten[k++], daten[k++]));
        else if (o === 2) {
          k += 4;
          punkte.push(p(daten[k++], daten[k++]));
        } else if (o === 3) {
          k += 2;
          punkte.push(p(daten[k++], daten[k++]));
        } else if (o === 4) abschliessen();
      }
      abschliessen();

      // Liegt ein Ring innerhalb eines anderen, ist er ein Loch: eine Wand,
      // als geschlossener Zug mit Außen- und Innenkontur gezeichnet.
      ringe.sort((x, y) => y.a - x.a);
      const aussen: typeof ringe = [];
      for (const r of ringe) {
        const huelle = aussen.find(
          (o) =>
            r.box[0] >= o.box[0] && r.box[1] >= o.box[1] && r.box[2] <= o.box[2] && r.box[3] <= o.box[3] &&
            r.pts.every((q) => liegtInnen(q, o.pts)),
        );
        if (huelle) {
          huelle.a -= r.a;
          huelle.u += r.u;
        } else aussen.push({ ...r });
      }
      for (const o of aussen) {
        if (o.a > 0) {
          const ort = `${Math.round(o.box[0])},${Math.round(o.box[1])}`;
          ergebnis.push({ ebene, farbe, ort, seite, kontur: o.pts, flaeche_m2: o.a * m * m, umfang_m: o.u * m });
        }
      }
    }
  }
  return ergebnis;
}
