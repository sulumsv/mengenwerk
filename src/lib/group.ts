import { findeLeistungsgruppen, normalisiereMaterial } from "./lbhb";
import type { DetectedElement, GroupedItem, Konfidenz } from "./types";

/** Die schwächste Konfidenz einer Gruppe bestimmt die Konfidenz der Summe. */
const KONFIDENZ_RANG: Record<Konfidenz, number> = { plan: 0, berechnet: 1, annahme: 2 };

function schwaechere(a: Konfidenz, b: Konfidenz): Konfidenz {
  return KONFIDENZ_RANG[a] >= KONFIDENZ_RANG[b] ? a : b;
}

function rundeMass(m: number): number {
  return Math.round(m * 100) / 100;
}

export function gruppiereElemente(elemente: DetectedElement[]): GroupedItem[] {
  const gruppen = new Map<string, GroupedItem>();

  for (const el of elemente) {
    const b = rundeMass(el.breite_m);
    const h = rundeMass(el.hoehe_m);
    const material = normalisiereMaterial(el.material);
    // Material geht in den Schlüssel ein: gleich große Bauteile aus Ziegel und
    // Stahlbeton landen in unterschiedlichen Leistungsgruppen und dürfen daher
    // nicht zu einer Position zusammenfallen.
    const key = `${el.type}__${material ?? "-"}__${b}x${h}`;
    const einheitFlaeche = rundeMass(b * h);

    const bestehend = gruppen.get(key);
    if (bestehend) {
      bestehend.anzahl += el.anzahl;
      bestehend.gesamt_flaeche_m2 = rundeMass(bestehend.gesamt_flaeche_m2 + einheitFlaeche * el.anzahl);
      bestehend.konfidenz = schwaechere(bestehend.konfidenz, el.konfidenz);
      bestehend.rechenweg = `${bestehend.anzahl} Stk x (${b} m x ${h} m = ${einheitFlaeche} m²) = ${bestehend.gesamt_flaeche_m2} m²`;
    } else {
      gruppen.set(key, {
        type: el.type,
        label: el.label || el.type,
        material: el.material,
        breite_m: b,
        hoehe_m: h,
        anzahl: el.anzahl,
        einheit_flaeche_m2: einheitFlaeche,
        gesamt_flaeche_m2: rundeMass(einheitFlaeche * el.anzahl),
        konfidenz: el.konfidenz,
        rechenweg: `${el.anzahl} Stk x (${b} m x ${h} m = ${einheitFlaeche} m²) = ${rundeMass(einheitFlaeche * el.anzahl)} m²`,
        lgKandidaten: findeLeistungsgruppen(el.type, el.material).map((t) => `${t.lg} ${t.bezeichnung}`),
      });
    }
  }

  return Array.from(gruppen.values()).sort((a, b) => a.type.localeCompare(b.type) || b.anzahl - a.anzahl);
}
