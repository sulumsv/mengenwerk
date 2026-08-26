import type { DetectedElement, GroupedItem } from "./types";

const LG_KANDIDATEN: Record<DetectedElement["type"], string[]> = {
  fenster: ["71 Fenster aus Holz", "72 Fenster aus Aluminium", "73 Fenster aus Kunststoff", "74 Fenster aus Holz-Aluminium", "75 Fenster aus Kunststoff-Aluminium"],
  tuer: ["43 Türsysteme (Elemente)", "37 Tischlerarbeiten"],
  wand: ["08 Mauerarbeiten", "07 Beton- und Stahlbetonarbeiten"],
  boden: ["11 Estricharbeiten", "24 Fliesen- und Plattenlegearbeiten", "50 Bodenbeläge"],
  decke: ["07 Beton- und Stahlbetonarbeiten"],
  fundament: ["03 Roden, Baugrube, Sicherungen und Tiefgründungen", "07 Beton- und Stahlbetonarbeiten"],
  sonstiges: [],
};

function rundeMass(m: number): number {
  return Math.round(m * 100) / 100;
}

export function gruppiereElemente(elemente: DetectedElement[]): GroupedItem[] {
  const gruppen = new Map<string, GroupedItem>();

  for (const el of elemente) {
    const b = rundeMass(el.breite_m);
    const h = rundeMass(el.hoehe_m);
    const key = `${el.type}__${b}x${h}`;
    const einheitFlaeche = rundeMass(b * h);

    const bestehend = gruppen.get(key);
    if (bestehend) {
      bestehend.anzahl += el.anzahl;
      bestehend.gesamt_flaeche_m2 = rundeMass(bestehend.gesamt_flaeche_m2 + einheitFlaeche * el.anzahl);
      bestehend.rechenweg = `${bestehend.anzahl} Stk x (${b} m x ${h} m = ${einheitFlaeche} m²) = ${bestehend.gesamt_flaeche_m2} m²`;
    } else {
      gruppen.set(key, {
        type: el.type,
        label: el.label || el.type,
        breite_m: b,
        hoehe_m: h,
        anzahl: el.anzahl,
        einheit_flaeche_m2: einheitFlaeche,
        gesamt_flaeche_m2: rundeMass(einheitFlaeche * el.anzahl),
        rechenweg: `${el.anzahl} Stk x (${b} m x ${h} m = ${einheitFlaeche} m²) = ${rundeMass(einheitFlaeche * el.anzahl)} m²`,
        lgKandidaten: LG_KANDIDATEN[el.type] ?? [],
      });
    }
  }

  return Array.from(gruppen.values()).sort((a, b) => a.type.localeCompare(b.type) || b.anzahl - a.anzahl);
}
