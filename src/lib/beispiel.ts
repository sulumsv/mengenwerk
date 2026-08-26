// Beispieldaten aus dem Einreichplan Torricelligasse 29, wie sie die
// Planauswertung liefert. Grundlage der Vorschau unter /vorschau.
import type { DetectedElement, PlanKontext, Raum } from "./types";

const SEITENVERHAELTNIS = 1.4;
function umfang(f: number, l?: number, b?: number) {
  if (l && b) return { umfang_m: 2 * (l + b), umfangQuelle: "gerechnet" as const };
  const k = Math.sqrt(f / SEITENVERHAELTNIS);
  return { umfang_m: 2 * k * (1 + SEITENVERHAELTNIS), umfangQuelle: "geschaetzt" as const };
}

let n = 0;
const r = (
  geschoss: string, name: string, flaeche_m2: number, belag: string | undefined,
  opt: { l?: number; b?: number; beheizt?: boolean; nass?: boolean } = {},
): Raum => ({
  id: `r${n++}`, geschoss, name, flaeche_m2, belag,
  laenge_m: opt.l, breite_m: opt.b, ...umfang(flaeche_m2, opt.l, opt.b),
  beheizt: opt.beheizt ?? true, nassraum: opt.nass ?? false,
  konfidenz: "plan", quelle: "Raumstempel",
});

// Torricelligasse 29 — Räume laut Raumstempel der Einreichpläne.
export const BEISPIEL_RAEUME: Raum[] = [
  r("EG", "Wohnküche", 60.29, "Parkett", { l: 9.80, b: 6.15 }),
  r("EG", "Gang", 6.81, "Parkett", { l: 2.40, b: 2.84 }),
  r("EG", "AR", 5.12, "Parkett", { l: 2.63, b: 1.95 }),
  r("EG", "VR", 5.91, "Fliesen", { l: 2.13, b: 2.78 }),
  r("EG", "Garderobe", 3.85, "Fliesen", { l: 1.54, b: 2.50 }),
  r("EG", "Bad", 6.14, "Fliesen", { l: 1.91, b: 3.22, nass: true }),
  r("EG", "Garage", 24.80, "Bodenbeschichtung", { beheizt: false }),
  r("EG", "Pooltechnik", 1.93, "Fliesen", { beheizt: false }),
  r("EG", "Terrasse", 41.14, "Stein", { beheizt: false }),
  r("OG", "Zimmer 1", 17.36, "Parkett", { l: 3.95, b: 4.40 }),
  r("OG", "Zimmer 2", 16.66, "Parkett", { l: 3.79, b: 4.40 }),
  r("OG", "Zimmer 3", 19.38, "Parkett", { l: 4.41, b: 4.40 }),
  r("OG", "Ankleide", 7.96, "Parkett", { l: 2.62, b: 3.04 }),
  r("OG", "Gang", 17.08, "Parkett"),
  r("OG", "Technikraum", 9.61, "Fliesen", { l: 2.20, b: 4.37 }),
  r("OG", "Bad", 10.57, "Fliesen", { l: 2.72, b: 3.89, nass: true }),
  r("OG", "WC", 2.71, "Fliesen", { l: 1.59, b: 1.70, nass: true }),
  r("OG", "Balkon", 11.75, "Dielen", { beheizt: false }),
  r("DG", "Studio", 28.84, "Parkett", { l: 5.26, b: 5.48 }),
  r("DG", "Galerie", 3.76, "Parkett"),
  r("DG", "Nicht konditionierter Raum", 67.49, undefined, { beheizt: false }),
];

export const BEISPIEL_KONTEXT: PlanKontext = {
  legende: { rot: "Ziegel", grün: "Stahlbeton", braun: "Holzkonstruktion" },
  geschosshoehen: { EG: 2.80, OG: 2.63 },
  nachweise: {
    "Bebaute Fläche (m2)": 152.58,
    "Wohnnutzfläche (m2)": 222.38,
    "Bruttogrundriss EG (m2)": 143.13,
    "Bruttogrundriss DG (m2)": 138.71,
    "Bruttogrundrissfläche (m2)": 420.55,
    "Fassadenabwicklung (m2)": 356.76,
    "Giebelflächen (m2)": 35.04,
    "Gebäudehöhe (m)": 7.40,
    "Abwicklungslänge (m)": 47.95,
    "Dachneigung (Grad)": 35,
  },
  hinweise: [],
};

const el = (
  type: DetectedElement["type"], label: string, b: number, h: number,
  opt: { t?: number; anzahl?: number; material?: string } = {},
): DetectedElement => ({
  id: `e${n++}`, type, label, breite_m: b, hoehe_m: h, tiefe_m: opt.t,
  anzahl: opt.anzahl ?? 1, material: opt.material, konfidenz: "plan",
  quelle: "Plan", rechenweg: "",
});

export const BEISPIEL_ELEMENTE: DetectedElement[] = [
  el("stuetze", "STB 60/25", 0.60, 2.80, { t: 0.25, anzahl: 2, material: "Stahlbeton" }),
  el("stuetze", "STB 40/25", 0.40, 2.80, { t: 0.25, material: "Stahlbeton" }),
  el("stuetze", "STB 50/25", 0.50, 2.63, { t: 0.25, material: "Stahlbeton" }),
  el("tuer", "Innentür", 0.90, 2.20, { anzahl: 10, material: "Holz" }),
];

