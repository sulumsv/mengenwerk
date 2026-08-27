/**
 * Registry aller Werte, die nicht aus dem Plan stammen.
 *
 * Ein Einreichplan enthält Flächen und Maße, aber keine Schichtstärken und
 * keine Verschnittsätze. Jede Position, die darauf aufbaut, ist nur so
 * belastbar wie die hier hinterlegte Annahme — deshalb steht zu jeder ihre
 * Begründung und ihre Auswirkung, und jede abgeleitete Position verweist auf
 * die Annahmen, die in sie eingeflossen sind.
 */

export interface Annahme {
  id: string;
  titel: string;
  wert: number;
  einheit: string;
  begruendung: string;
  auswirkung: string;
}

export const ANNAHMEN = {
  estrichstaerke: {
    id: "estrichstaerke",
    titel: "Estrichstärke 7 cm",
    wert: 0.07,
    einheit: "m",
    begruendung: "Übliche Stärke für Heizestrich auf Dämmung. Der Bodenaufbau ist nur im Schnitt bemaßt.",
    auswirkung: "Geht linear in Estrichvolumen und Liefermasse ein.",
  },
  estrichRohdichte: {
    id: "estrichRohdichte",
    titel: "Rohdichte Estrich 2 200 kg/m³",
    wert: 2200,
    einheit: "kg/m³",
    begruendung: "Zementestrich CT-C25-F4, Mittelwert für die Anlieferung.",
    auswirkung: "Bestimmt die Liefermasse in Tonnen.",
  },
  bodenplattenstaerke: {
    id: "bodenplattenstaerke",
    titel: "Bodenplatte 25 cm",
    wert: 0.25,
    einheit: "m",
    begruendung: "Stärke und Bewehrung sind im Grundriss nicht bemaßt.",
    auswirkung: "Geht linear in Betonvolumen und Bewehrungsmenge ein.",
  },
  geschossdeckenstaerke: {
    id: "geschossdeckenstaerke",
    titel: "Geschoßdecke 25 cm Stahlbeton",
    wert: 0.25,
    einheit: "m",
    begruendung: "Anteil der Rohdecke am bemaßten Deckenpaket. Die Aufbautenliste liegt nicht bei.",
    auswirkung: "Geht linear in Betonvolumen und Bewehrungsmenge ein.",
  },
  bewehrungsgrad: {
    id: "bewehrungsgrad",
    titel: "Bewehrungsgrad 110 kg/m³",
    wert: 110,
    einheit: "kg/m³",
    begruendung: "Erfahrungswert für Wohnbau. Maßgeblich ist allein die Statik.",
    auswirkung: "Bestimmt die gesamte Bewehrungsmenge.",
  },
  aussenwandstaerke: {
    id: "aussenwandstaerke",
    titel: "Tragschale Außenwand 25 cm",
    wert: 0.25,
    einheit: "m",
    begruendung: "Anteil des Mauerwerks an der bemaßten Gesamtwandstärke, Rest Dämmung und Putz.",
    auswirkung: "Geht linear in das Mauerwerksvolumen der Außenwände ein.",
  },
  oeffnungsanteilFassade: {
    id: "oeffnungsanteilFassade",
    titel: "Öffnungsanteil Fassade 15 %",
    wert: 0.15,
    einheit: "-",
    begruendung: "Ersatzwert, solange keine Fenster- und Türliste vorliegt.",
    auswirkung: "Bestimmt den Abzug von der Fassadenfläche beim Mauerwerksvolumen.",
  },
  fliesenspiegelhoehe: {
    id: "fliesenspiegelhoehe",
    titel: "Fliesenspiegel bis 2,10 m",
    wert: 2.1,
    einheit: "m",
    begruendung: "Übliche Fliesenhöhe in Bad und WC.",
    auswirkung: "Bestimmt die Wandfliesenfläche der Nassräume.",
  },
  geruestZuschlag: {
    id: "geruestZuschlag",
    titel: "Gerüstüberstand 1,00 m",
    wert: 1.0,
    einheit: "m",
    begruendung: "Schutzgeländer über Traufenhöhe.",
    auswirkung: "Erhöht die Gerüstfläche gegenüber der reinen Traufenhöhe.",
  },
  raumhoheDachgeschoss: {
    id: "raumhoheDachgeschoss",
    titel: "Mittlere Raumhöhe Dachgeschoß 2,50 m",
    wert: 2.5,
    einheit: "m",
    begruendung: "Räume liegen unter der Dachschräge, eine einheitliche lichte Höhe gibt es nicht.",
    auswirkung: "Geht in Wandfläche, Putz und Malerei des Dachgeschoßes ein.",
  },
  tuerbreiteDurchgang: {
    id: "tuerbreiteDurchgang",
    titel: "Türdurchgang 0,90 m",
    wert: 0.9,
    einheit: "m",
    begruendung: "Regelbreite Innentür, solange keine Türliste vorliegt.",
    auswirkung: "Bestimmt den Abzug bei Sockelleisten und Fliesensockeln.",
  },
  tuerhoeheDurchgang: {
    id: "tuerhoeheDurchgang",
    titel: "Türhöhe 2,00 m",
    wert: 2.0,
    einheit: "m",
    begruendung: "Regelhöhe Innentür, solange keine Türliste vorliegt.",
    auswirkung: "Bestimmt den Türabzug beim Fliesenspiegel der Nassräume.",
  },
} as const satisfies Record<string, Annahme>;

export type AnnahmeId = keyof typeof ANNAHMEN;

/** Verschnittzuschläge nach Verlegeart, als Faktor auf die Nettofläche. */
export const VERSCHNITT: Record<string, { faktor: number; begruendung: string }> = {
  parkett: { faktor: 1.05, begruendung: "5 % bei Standardverlegung" },
  dielen: { faktor: 1.1, begruendung: "10 % bei Verlegung im Freien" },
  fliesen: { faktor: 1.08, begruendung: "8 % wegen Zuschnitt in kleinteiligen Nassräumen" },
  stein: { faktor: 1.1, begruendung: "10 % bei Naturstein" },
  bodenbeschichtung: { faktor: 1.05, begruendung: "5 % Materialzuschlag" },
  dachdeckung: { faktor: 1.1, begruendung: "10 % bei geneigter Deckung" },
  trittschalldaemmung: { faktor: 1.05, begruendung: "5 % Verschnitt" },
  folie: { faktor: 1.1, begruendung: "10 % Überlappung" },
};

export const STANDARD_VERSCHNITT = { faktor: 1.05, begruendung: "5 % Regelzuschlag" };

export function verschnittFuer(belag: string | null | undefined) {
  if (!belag) return STANDARD_VERSCHNITT;
  const schluessel = belag.toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").trim();
  for (const [name, eintrag] of Object.entries(VERSCHNITT)) {
    if (schluessel.includes(name)) return eintrag;
  }
  return STANDARD_VERSCHNITT;
}
