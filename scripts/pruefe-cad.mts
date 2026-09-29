// Wertet die CAD-Ebenen eines Vektor-PDFs aus und gibt die Bauteile aus.
// Aufruf: npx tsx scripts/pruefe-cad.mts pfad/zum/plan.pdf
import fs from "node:fs";
import { massstabAusText, sammleFlaechen, werteAus, BAUTEIL_TITEL, type OpsTabelle } from "../src/lib/cad-ebenen.ts";

const pfad = process.argv[2];
if (!pfad) {
  console.error("Pfad zu einem PDF angeben.");
  process.exit(1);
}

const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
const dokument = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync(pfad)), isEvalSupported: false }).promise;
const konfig = await dokument.getOptionalContentConfig();
const namen: Record<string, string> = {};
for (const [id, g] of konfig) namen[id] = (g as { name: string }).name;

const seite = await dokument.getPage(1);
const text = await seite.getTextContent();
const massstab = massstabAusText(text.items.map((t) => ("str" in t ? t.str : "")));
if (!massstab) throw new Error("Kein Maßstab im Plankopf gefunden.");
const liste = await seite.getOperatorList();
const flaechen = sammleFlaechen(liste.fnArray, liste.argsArray as unknown[][], pdfjs.OPS as unknown as OpsTabelle, namen, massstab);
const a = werteAus(flaechen, massstab, Object.values(namen));

console.log(`Maßstab 1:${a.massstab}, ${a.ebenen.length} Ebenen, davon erkannt:`);
for (const e of a.erkannteEbenen) console.log(`  ${e.name} → ${BAUTEIL_TITEL[e.art]}`);
console.log("");
for (const p of a.positionen) {
  console.log(
    `${BAUTEIL_TITEL[p.art].padEnd(10)} d=${p.dicke_m.toFixed(2)}  ${p.laenge_m.toFixed(1).padStart(8)} m  ${p.flaeche_m2.toFixed(1).padStart(7)} m²  (${p.teile})`,
  );
}
