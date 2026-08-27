// Prüflauf der Ableitung gegen die von Hand gerechneten Mengen des
// Einreichplans Torricelligasse 29. Aufruf: npm run pruefe
import { baueMassenauszug } from "../src/lib/ableitung.ts";
import type { DetectedElement, PlanKontext, Raum } from "../src/lib/types.ts";

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
const raeume: Raum[] = [
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

const kontext: PlanKontext = {
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

const elemente: DetectedElement[] = [
  el("stuetze", "STB 60/25", 0.60, 2.80, { t: 0.25, anzahl: 2, material: "Stahlbeton" }),
  el("stuetze", "STB 40/25", 0.40, 2.80, { t: 0.25, material: "Stahlbeton" }),
  el("stuetze", "STB 50/25", 0.50, 2.63, { t: 0.25, material: "Stahlbeton" }),
  el("tuer", "Innentür", 0.90, 2.20, { anzahl: 10, material: "Holz" }),
];

const m = baueMassenauszug(raeume, elemente, kontext);

const grau = "\x1b[90m", reset = "\x1b[0m", fett = "\x1b[1m";
for (const a of m.abschnitte) {
  console.log(`\n${fett}${a.nummer} — ${a.titel}${reset} ${grau}${a.lgHinweis}${reset}`);
  for (const p of a.positionen) {
    const menge = p.menge === null ? "—" : p.menge.toFixed(2).replace(".", ",");
    const flag = { plan: "▪", berechnet: "▫", annahme: "△" }[p.konfidenz];
    console.log(`  ${flag} ${p.nummer.padEnd(5)} ${p.bezeichnung.padEnd(34)} ${menge.padStart(10)} ${p.einheit.padEnd(4)} ${grau}${p.rechenweg}${reset}`);
  }
}

console.log(`\n${fett}Kennzahlen${reset}`);
for (const k of m.kennzahlen) console.log(`  ${k.bezeichnung.padEnd(34)} ${k.menge!.toFixed(2).padStart(10)} ${k.einheit}`);

console.log(`\n${fett}Angewandte Annahmen${reset} (${m.angewandteAnnahmen.length})`);
for (const a of m.angewandteAnnahmen) console.log(`  · ${a.titel}`);

console.log(`\n${fett}Prüfpunkte${reset}`);
for (const p of m.pruefpunkte) console.log(`  ! ${p}`);

// Abgleich gegen die Handrechnung im Massenauszug Torricelligasse 29.
console.log(`\n${fett}Abgleich mit der Handrechnung${reset}`);
const alle = m.abschnitte.flatMap((a) => a.positionen);
const finde = (name: string) => alle.find((p) => p.bezeichnung === name)?.menge ?? null;
const erwartet: [string, number | null, number][] = [
  ["Parkett", finde("Parkett"), 192.42],
  ["Fliesen", finde("Fliesen"), 43.98],
  ["Stein", finde("Stein"), 45.25],
  ["Dielen", finde("Dielen"), 12.93],
  ["Heizestrich CT-C25-F4", finde("Heizestrich CT-C25-F4"), 15.68],
  ["Estrich — Liefermasse", finde("Estrich — Liefermasse"), 34.50],
  ["Fassadenfläche brutto", finde("Fassadenfläche brutto"), 391.80],
  ["Fußbodenheizung", finde("Fußbodenheizung"), 222.05],
];
let fehler = 0;
for (const [name, ist, soll] of erwartet) {
  const ok = ist !== null && Math.abs(ist - soll) < 0.02;
  if (!ok) fehler++;
  console.log(`  ${ok ? "OK  " : "FEHL"} ${name.padEnd(26)} ist ${String(ist).padStart(8)}  soll ${soll}`);
}
console.log(fehler === 0 ? "\nAlle Prüfwerte stimmen mit der Handrechnung überein." : `\n${fehler} Abweichung(en) zur Handrechnung.`);

// --- Randfälle: die Ableitung darf bei dünner Datenlage nicht abstürzen ---
console.log(`\n${fett}Randfälle${reset}`);

function pruefe(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  OK   ${name}`);
  } catch (e) {
    console.error(`  FEHL ${name}: ${e instanceof Error ? e.message : e}`);
    fehler++;
  }
}

const leererKontext: PlanKontext = { legende: {}, geschosshoehen: {}, nachweise: {}, hinweise: [] };

pruefe("Plan ohne Räume und ohne Nachweise", () => {
  const a = baueMassenauszug([], [], leererKontext);
  if (a.abschnitte.some((x) => x.positionen.some((p) => Number.isNaN(p.menge)))) {
    throw new Error("NaN in einer Menge");
  }
});

pruefe("Räume ohne jeden Nachweis", () => {
  const a = baueMassenauszug(raeume, [], leererKontext);
  const nan = a.abschnitte.flatMap((x) => x.positionen).filter((p) => p.menge !== null && Number.isNaN(p.menge));
  if (nan.length > 0) throw new Error(`NaN bei ${nan.map((p) => p.bezeichnung).join(", ")}`);
});

pruefe("Kleinstnassraum ergibt keine negative Menge", () => {
  const winzig = r("EG", "WC", 0.6, "Fliesen", { l: 0.6, b: 1.0, nass: true });
  const a = baueMassenauszug([winzig], [], { ...leererKontext, geschosshoehen: { EG: 2.5 } });
  const negativ = a.abschnitte
    .flatMap((x) => x.positionen)
    .filter((p) => p.menge !== null && p.menge < 0);
  if (negativ.length > 0) {
    throw new Error(`negative Menge bei ${negativ.map((p) => `${p.bezeichnung} ${p.menge}`).join(", ")}`);
  }
});

pruefe("Summenposition nennt nur tatsächlich genutzte Annahmen", () => {
  const nurStuetze = baueMassenauszug([], [elemente[0]], leererKontext);
  const gesamt = nurStuetze.abschnitte.flatMap((x) => x.positionen).find((p) => p.bezeichnung === "Beton gesamt");
  if (gesamt && gesamt.annahmen.length > 0) {
    throw new Error(`Beton gesamt behauptet Annahmen ${gesamt.annahmen.join(", ")} ohne Bodenplatte oder Decke`);
  }
});

pruefe("Abgeleitete Summen gelten nicht als im Plan beschriftet", () => {
  const a = baueMassenauszug(raeume, elemente, kontext);
  const abgeleitet = ["Fußbodenheizung", "Wärmedämmverbundsystem", "Außenputz", "Deckenputz"];
  const falsch = a.abschnitte
    .flatMap((x) => x.positionen)
    .filter((p) => abgeleitet.includes(p.bezeichnung) && p.konfidenz === "plan");
  if (falsch.length > 0) {
    throw new Error(`als "Aus Plan" ausgewiesen: ${falsch.map((p) => p.bezeichnung).join(", ")}`);
  }
});

if (fehler > 0) {
  console.error(`\n${fehler} Fehler.`);
  process.exit(1);
}
console.log("\nRandfälle bestanden.");
