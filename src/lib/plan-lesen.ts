"use client";

import { NACHWEISE, normalisiereBegriff, suchbegriffe } from "./nachweise";
import { PDFJS_DOKUMENT_OPTIONEN } from "./plan-zu-bildern";
import type { Konfidenz, PlanKontext, Raum } from "./types";

/**
 * Liest einen Plan aus seiner Textebene, ohne Bilderkennung.
 *
 * Ein Einreichplan aus einem CAD-Programm enthält seine Beschriftungen als
 * echten Text mit Koordinaten: Raumstempel, Flächennachweise, Dachneigung.
 * Genau diese Werte sind die Grundlage der Mengenermittlung, sie lassen sich
 * daher direkt auslesen, ohne den Plan anzusehen.
 *
 * Das funktioniert nicht bei eingescannten Plänen: dort ist alles Bild und die
 * Textebene leer. Was dieser Weg nicht kann, sagt das Ergebnis offen.
 */

/** Ein Textschnipsel der Seite mit seiner Lage. Ursprung unten links. */
export interface Schnipsel {
  text: string;
  x: number;
  y: number;
  hoehe: number;
  breite: number;
}

export interface Leseergebnis {
  raeume: Raum[];
  kontext: PlanKontext;
  /** Anzahl Textschnipsel im Plan. Null heißt: eingescannt, nicht auslesbar. */
  schnipsel: number;
  /** Wie viele Blätter der Plansatz hat. */
  seiten: number;
  /**
   * Ob dem Gelesenen zu trauen ist. Ein Auszug aus falsch zugeordneten Zahlen
   * sieht genauso fertig aus wie ein richtiger, deshalb wird lieber nichts
   * gezeigt als etwas Falsches.
   */
  verlaesslich: boolean;
  grund?: string;
}

/**
 * Prüft das Gelesene gegen sich selbst. Der stärkste Test ist der Abgleich der
 * Raumsumme mit der ausgewiesenen Wohnnutzfläche: stimmen sie nicht annähernd
 * überein, wurden Raumstempel übersehen oder Fremdwerte eingesammelt.
 */
function beurteile(
  raeume: Raum[],
  nachweise: Record<string, number>,
  schnipsel: number,
): { verlaesslich: boolean; grund?: string } {
  const zahlwort = (n: number) => n.toLocaleString("de-AT");

  if (schnipsel === 0) {
    return {
      verlaesslich: false,
      grund:
        "Der Plan enthält überhaupt keinen Text, sondern nur ein Bild, er ist eingescannt oder als Bild exportiert. " +
        "Daraus lässt sich ohne Bilderkennung nichts lesen.",
    };
  }

  if (raeume.length < 3) {
    return {
      verlaesslich: false,
      grund:
        `Der Plan enthält ${zahlwort(schnipsel)} Textstellen, davon ließen sich aber nur ` +
        `${raeume.length} Raumstempel und ${Object.keys(nachweise).length} Nachweiswerte sicher zuordnen. ` +
        "Für einen Massenauszug ist das zu wenig.",
    };
  }

  const ausweis = Object.entries(nachweise).find(([n]) =>
    normalisiereBegriff(n).includes("wohnnutzflaeche"),
  )?.[1];

  if (ausweis && ausweis > 0) {
    const summe = raeume.filter((r) => r.beheizt).reduce((s, r) => s + r.flaeche_m2, 0);
    const abweichung = Math.abs(summe - ausweis) / ausweis;
    if (abweichung > 0.2) {
      const jeGeschoss = [...gruppiere(raeume.filter((r) => r.beheizt)).entries()]
        .map(([g, rs]) => `${g} ${rs.reduce((s, r) => s + r.flaeche_m2, 0).toFixed(2)} m²`)
        .join(", ");
      return {
        verlaesslich: false,
        grund:
          `Die Summe der erkannten Räume (${summe.toFixed(2)} m²) weicht stark von der ausgewiesenen Wohnnutzfläche (${ausweis.toFixed(2)} m²) ab.` +
          (jeGeschoss ? ` Erkannt je Blatt: ${jeGeschoss}.` : ""),
      };
    }
  }

  return { verlaesslich: true };
}

function gruppiere(raeume: Raum[]): Map<string, Raum[]> {
  const m = new Map<string, Raum[]>();
  for (const r of raeume) m.set(r.geschoss, [...(m.get(r.geschoss) ?? []), r]);
  return m;
}

const raumSchluessel = (r: Raum) => `${normalisiereBegriff(r.name)}__${r.flaeche_m2.toFixed(2)}`;

/**
 * Stimmt das Raumbuch mit der ausgewiesenen Wohnnutzfläche ab.
 *
 * Ein Plansatz zeigt oft mehr als die Wohnnutzfläche: ein Kellergeschoß, das
 * nicht dazuzählt, oder denselben Grundriss auf zwei Blättern. Passt die
 * Gesamtsumme nicht, wird die Kombination von Geschoßen gesucht, die die
 * Wohnnutzfläche ergibt. Ein ausgelassenes Geschoß, dessen Räume sich in den
 * übrigen wiederfinden, ist eine Doppelung und fällt weg; ein eigenständiges
 * bleibt im Massenauszug, zählt aber nicht zur Wohnnutzfläche.
 */
export function gleicheWohnnutzflaecheAb(
  raeume: Raum[],
  ausweis: number | undefined,
): { raeume: Raum[]; hinweis?: string } {
  const istTabelle = (r: Raum) => r.geschoss.startsWith(TABELLE);
  const tabellen = [...new Set(raeume.filter(istTabelle).map((r) => r.geschoss))];
  const grundrisse = raeume.filter((r) => !istTabelle(r));
  // Eine Flächentabelle wiederholt die Raumstempel. Gibt es daneben Grundrisse,
  // zählen deren Räume; die Tabelle dient nur, wenn sonst nichts da ist.
  const tabellenHinweis = tabellen.length
    ? `${tabellen.join(", ")} wiederholt die Räume als Tabelle und wurde nicht doppelt gezählt`
    : undefined;

  if (!ausweis || ausweis <= 0) {
    if (tabellen.length === 0 || grundrisse.length === 0) return { raeume };
    return { raeume: grundrisse, hinweis: `${tabellenHinweis}. Bitte prüfen.` };
  }

  // Ein einzelner Raum kann nicht größer sein als die ganze Wohnnutzfläche -
  // solche Werte sind Fehlzuordnungen (z.B. Grundstücksfläche aus dem Nachweis).
  const plausibel = raeume.filter((r) => r.flaeche_m2 <= ausweis * 1.05);
  const summe = (rs: Raum[]) => rs.filter((r) => r.beheizt).reduce((s, r) => s + r.flaeche_m2, 0);
  const abw = (x: number) => Math.abs(x - ausweis) / ausweis;
  const ohneTabellen = plausibel.filter((r) => !istTabelle(r));
  if (abw(summe(plausibel)) <= 0.2 && tabellen.length === 0) return { raeume: plausibel };
  if (ohneTabellen.length > 0 && abw(summe(ohneTabellen)) <= 0.2) {
    return { raeume: ohneTabellen, hinweis: tabellenHinweis && `${tabellenHinweis}. Bitte prüfen.` };
  }

  const alleGruppen = [...gruppiere(plausibel).entries()].filter(([, rs]) => summe(rs) > 0);
  const sucheBeste = (gruppen: [string, Raum[]][]) => {
    if (gruppen.length < 2 || gruppen.length > 10) return null;
    let beste: { maske: number; abweichung: number } | null = null;
    for (let maske = 1; maske < 1 << gruppen.length; maske++) {
      if (maske === (1 << gruppen.length) - 1) continue;
      const s = gruppen.reduce((acc, [, rs], i) => (maske & (1 << i) ? acc + summe(rs) : acc), 0);
      const a = abw(s);
      if (!beste || a < beste.abweichung) beste = { maske, abweichung: a };
    }
    // Enger als die allgemeine Toleranz: ein Zufallstreffer soll nicht als Abgleich durchgehen.
    return beste && beste.abweichung <= 0.1 ? { gruppen, maske: beste.maske } : null;
  };
  // Zuerst nur Grundrisse, erst dann dürfen Tabellen mitspielen
  const treffer =
    sucheBeste(alleGruppen.filter(([g]) => !g.startsWith(TABELLE))) ??
    (tabellen.length ? sucheBeste(alleGruppen) : null);
  if (!treffer) return { raeume: plausibel };

  const drin = treffer.gruppen.filter((_, i) => treffer.maske & (1 << i));
  const draussen = alleGruppen.filter(([g]) => !drin.some(([d]) => d === g));
  const bekannt = new Set(drin.flatMap(([, rs]) => rs.map(raumSchluessel)));

  const doppelt: string[] = [];
  const nebengeschosse: string[] = [];
  const ergebnis = drin.flatMap(([, rs]) => rs);
  for (const [name, rs] of draussen) {
    const wiederholt = rs.filter((r) => bekannt.has(raumSchluessel(r))).length / rs.length;
    if (name.startsWith(TABELLE)) {
      // Eine Tabelle ist nie ein eigenes Geschoß
      doppelt.push(name);
    } else if (wiederholt >= 0.6) {
      doppelt.push(name);
    } else {
      nebengeschosse.push(`${name} (${summe(rs).toFixed(2)} m²)`);
      ergebnis.push(...rs.map((r) => ({ ...r, beheizt: false })));
    }
  }
  // Blätter nur mit unbeheizten Räumen (z.B. Garage) nehmen am Abgleich nicht teil und bleiben erhalten
  const imAbgleich = new Set(alleGruppen.map(([g]) => g));
  ergebnis.push(...plausibel.filter((r) => !imAbgleich.has(r.geschoss) && !istTabelle(r)));

  const teile: string[] = [];
  if (doppelt.length) teile.push(`${doppelt.join(", ")} zeigt dieselben Räume noch einmal und wurde nicht doppelt gezählt`);
  if (nebengeschosse.length)
    teile.push(`${nebengeschosse.join(", ")} zählt nicht zur Wohnnutzfläche und wird als unbeheizt geführt`);
  return {
    raeume: ergebnis,
    hinweis: `Abgleich mit der Wohnnutzfläche (${ausweis.toFixed(2)} m²): ${teile.join("; ")}. Bitte prüfen.`,
  };
}

function zahl(roh: string): number | null {
  // Österreichische Schreibweise: Komma als Dezimaltrenner, Punkt oder
  // schmales Leerzeichen als Tausendertrenner.
  const bereinigt = roh.replace(/[\s  ']/g, "").replace(/\.(?=\d{3}\b)/g, "").replace(",", ".");
  const wert = Number(bereinigt);
  return Number.isFinite(wert) ? wert : null;
}

/** "60,29 m²", die Flächenangabe eines Raumstempels. */
// Mit "A:" davor ist die Einheit eindeutig, auch wenn die hochgestellte 2 als
// eigener Schnipsel verloren geht ("A: 24,17 m").
const FLAECHE = /^(?:(?:a|f|nf|nfl|ngf|fläche|flaeche)\s*[:=]\s*([\d.,\s ]+)\s*m[²2]?|([\d.,\s ]+)\s*m[²2])$/i;

/** "A: 5,95 m DFF": Flächenzeile eines Stempels, an die eine fremde Beschriftung anstößt. */
const STEMPEL_FLAECHE = /^(?:a|nf|ngf)\s*[:=]\s*(\d[\d.,]*)\s*m[²2]?(?=\s|$)/i;

/** "U: 19,92 m", der Raumumfang, den ArchiCAD und andere in den Stempel schreiben. */
const UMFANG = /^(?:u|umfang)\s*[:=]\s*([\d.,\s ]+)\s*m$/i;

/** Belagsangaben, wie sie in Raumstempeln vorkommen. */
const BELAG =
  /^(parkett|fliesen?|estrich|beton[\w\s().-]*|bodenbeschichtung|stein|dielen|teppich|laminat|linoleum|vinyl|kautschuk)[\w\s().-]*$/i;

/** Belagszeile eines Raumstempels, auch mit Zahlen davor oder dahinter ("200 Parkett", "Fliesen 200"). */
const BELAG_WORT =
  /^(parkett|fliesen?|estrich|beton|bodenbeschichtung|stein|steinzeug|naturstein|dielen|teppich|laminat|linoleum|vinyl|kautschuk|holz|holzbelag|platten|pflaster|kies|rasen|bef\.?\s*fl(ä|ae)che|---+)(\b|$)/i;

function istBelag(text: string): boolean {
  return BELAG_WORT.test(text.replace(/[\d.,]+/g, " ").replace(/\s+/g, " ").trim());
}

/** Zeilen, die nie ein Raumname sind. */
const KEIN_RAUMNAME =
  /^(m[²2]|±|\+|-|ca\.?|abs\.?|gem\.?|lt\.?|nach|bzw\.?|und|oder|der|die|das|von|bis|max\.?|min\.?)$/i;

/** Beschriftungen, die neben Raumstempeln stehen, aber keine Raumnamen sind. */
const KEIN_RAUMSTEMPEL: RegExp[] = [
  // Wohnungsstempel "TOP - 09 141,17 m²": die Summe einer Wohnung, kein Raum
  /^top(\s|-|–|$)/i,
  // Bauteilkürzel: ET00, FE05a, WTW01, H_AW02, VS01
  /^[a-z]{1,4}[_-]?[a-z]{0,3}\d{2}[a-z]?$/i,
  // Treppenangaben "20 St", "18 STG", "18,5 / 26"
  /^\d+\s*st(g|k|\.)?\.?$/i,
  // Eine Maßangabe im Text ("MIN. 2,10m", "h=1,50m") macht keinen Namen
  /\d[.,]\d+\s*m\b|\d\s*m\s*[²2]/i,
  // Planhinweise und Kürzel
  /(fph|stuk|rph|dff\b|abgeh(ä|ae)ngt|gesamte wohnung|lt\.?\s*statik|brandschutz|beweissicherung|steigleitung|fallrohr|entl(ü|ue)ftung|kanal|bauphase|verteiler|\bmin\.|\bmax\.)/i,
  // Abgekürzte Wörter aus Hinweisen ("mech." von "mech. Entlüftung")
  /^\p{L}{1,5}\.$/u,
  // Kürzel aus Legende und Haustechnik
  /^(ws|wm|e-?v|fbh-?v|rar|ab|bfl|th|bf|rigole?)$/i,
  // Reste wie "E-" oder "---"
  /^[\p{L}]{0,2}[-–]+$/u,
];

/** Planhinweise, die im Export an einen Raumnamen anstoßen ("WOHNKÜCHEabgehängte Decken"). */
const HINWEIS_IM_NAMEN =
  /(abgeh(ä|ae)ngt|gesamte wohnung|lt\.?\s*statik|brandschutz|beweissicherung|steigleitung|fallrohr|entl(ü|ue)ftung|kanal|\bh\s*=\s*\d)/i;

/** Schneidet angehängte Hinweise und Maßzahlen ab: "WC 165" wird "WC", "250 ET02" wird "ET02". */
function bereinigeName(text: string): string {
  const treffer = HINWEIS_IM_NAMEN.exec(text);
  const vorne = treffer && treffer.index > 0 ? text.slice(0, treffer.index) : text;
  return vorne.replace(/^[\d.,\s]+(?=\p{L})/u, "").replace(/(\s+\d+)+\s*$/, "").trim();
}

/** "14,26 m", "35,00°", "2,80 m²", eine Maßangabe, kein Raumname. */
const MASSANGABE = /^[\d.,\s\u00a0]+\s*(m[²2³3]?|cm|mm|°|grad|%|stk|stück)?\.?$/i;

export function istRaumname(text: string): boolean {
  const t = text.trim();
  if (t.length < 2 || t.length > 40) return false;
  if (KEIN_RAUMNAME.test(t)) return false;
  if (FLAECHE.test(t) || UMFANG.test(t)) return false;
  // Flächen des Gebäudes oder Grundstücks, keine Räume
  if (/^(gebäude|gebaeude|grundstück|grundstueck|bauplatz|bauland)/i.test(t)) return false;
  if (KEIN_RAUMSTEMPEL.some((re) => re.test(t))) return false;
  // Die Belagszeile steht im Raumstempel direkt neben dem Namen und wird sonst
  // selbst zum Raumnamen ("Parkett", "Fliesen 200").
  if (istBelag(t)) return false;
  // Maßangaben und reine Zahlenkolonnen scheiden aus. Ohne diese Prüfung wird
  // in einem Nachweisblock die Zeile darüber zum vermeintlichen Raumnamen.
  if (MASSANGABE.test(t)) return false;
  // Begriffe aus der Flächenaufstellung sind keine Räume.
  const normal = normalisiereBegriff(t);
  if (NACHWEISE.some((n) => suchbegriffe(n.id).some((b) => normal.includes(b)))) return false;
  // Reine Maß- und Zahlenangaben scheiden aus.
  if (/^[\d.,\s /×x°%+-]+$/.test(t)) return false;
  return /[A-Za-zÄÖÜäöüß]/.test(t);
}

/** Geschoß aus der Blattüberschrift, sonst aus dem Dateinamen der Seite. */
function geschossAusText(alle: Schnipsel[], blatt: number): string {
  const muster: [RegExp, string][] = [
    [/dachgescho|dachgeschoss|\bdg\b/i, "DG"],
    [/obergescho|\bog\b|\b\d\.\s*og\b/i, "OG"],
    [/erdgescho|\beg\b/i, "EG"],
    [/kellergescho|untergescho|\bkg\b/i, "KG"],
  ];
  // Überschriften stehen groß und meist am Blattrand; die Reihenfolge oben ist
  // vom spezifischsten zum allgemeinsten, damit "DG" nicht von "EG" verdeckt wird.
  const grosse = [...alle].sort((a, b) => b.hoehe - a.hoehe).slice(0, 40);
  for (const [regex, name] of muster) {
    if (grosse.some((s) => /grundriss|gescho/i.test(s.text) && regex.test(s.text))) return name;
  }
  for (const [regex, name] of muster) {
    if (grosse.some((s) => regex.test(s.text))) return name;
  }
  return `Blatt ${blatt}`;
}

/** Präfix der Gruppe für Zeilen aus einer Flächentabelle statt aus einem Grundriss. */
export const TABELLE = "Flächenaufstellung";

/** "Grundriss 1. Obergeschoss 1:100" wird zu "1.OG". */
function geschossAusTitel(text: string): string | null {
  const t = text.replace(/\b(m|ma(ß|ss)stab)?\s*1\s*:\s*\d+/gi, " ").replace(/\s+/g, " ").trim();
  if (/dachgescho|\bdg\b/i.test(t)) return "DG";
  const og = t.match(/(\d+)\s*\.?\s*(obergescho|og\b|stock)/i);
  if (og) return `${og[1]}.OG`;
  if (/obergescho|\bog\b/i.test(t)) return "OG";
  if (/erdgescho|\beg\b/i.test(t)) return "EG";
  if (/kellergescho|untergescho|\bkg\b|\bug\b/i.test(t)) return "KG";
  // "Grundriss Galerie": ohne bekanntes Geschoß zählt die Überschrift selbst
  const rest = t.replace(/^.*?grundriss\w*\s*/i, "").trim();
  return rest.length >= 2 && rest.length <= 30 ? rest : null;
}

/**
 * Viele Einreichpläne zeigen alle Grundrisse auf einem einzigen Blatt, jeden
 * mit einer Überschrift wie "Grundriss Erdgeschoss 1:100" darunter. Ohne
 * Aufteilung landen alle Räume in einem Topf, und Keller oder eine
 * Flächenaufstellung lassen sich nicht mehr vom Wohnraum trennen.
 *
 * Jeder Raumstempel gehört zur nächsten Grundrissüberschrift unter ihm, die
 * links von ihm beginnt. Flächenangaben, die exakt untereinander in einer
 * Spalte stehen, sind eine Tabelle und keine Raumstempel im Grundriss.
 */
function ordneGrundrissen(zeilen: Schnipsel[], basis: string, blatt: number): (s: Schnipsel) => string {
  const tabelle = tabellenZeilen(zeilen);
  const titel = zeilen.flatMap((z) => {
    if (!/\bgrundriss\b/i.test(z.text)) return [];
    const label = geschossAusTitel(z.text);
    return label ? [{ ...z, label }] : [];
  });

  // Gleiche Überschrift zweimal auf dem Blatt (z.B. Bestand und Neu) bleibt unterscheidbar
  const gezaehlt = new Map<string, number>();
  for (const t of titel.sort((a, b) => a.x - b.x || b.y - a.y)) {
    const n = (gezaehlt.get(t.label) ?? 0) + 1;
    gezaehlt.set(t.label, n);
    if (n > 1) t.label = `${t.label} (${n})`;
  }

  return (s) => {
    if (tabelle.has(s)) return `${TABELLE} Blatt ${blatt}`;
    if (titel.length < 2) return basis;
    const unter = titel.filter((t) => t.y < s.y && t.x <= s.x + Math.max(s.hoehe * 3, 10));
    if (unter.length === 0) return basis;
    const naechste = Math.max(...unter.map((t) => t.y));
    const reihe = unter.filter((t) => naechste - t.y <= Math.max(t.hoehe * 4, 20));
    return reihe.sort((a, b) => b.x - a.x)[0].label;
  };
}

/** Flächenangaben, die bündig untereinander in einer Spalte stehen: mindestens vier heißt Tabelle. */
function tabellenZeilen(zeilen: Schnipsel[]): Set<Schnipsel> {
  const flaechen = zeilen.filter((z) => FLAECHE.test(z.text.trim()));
  const buendig = (a: Schnipsel, b: Schnipsel) =>
    (Math.abs(a.x - b.x) < 2 || Math.abs(a.x + a.breite - (b.x + b.breite)) < 2) &&
    Math.abs(a.y - b.y) <= Math.max(a.hoehe, b.hoehe) * 3;

  const tabelle = new Set<Schnipsel>();
  const besucht = new Set<Schnipsel>();
  for (const start of flaechen) {
    if (besucht.has(start)) continue;
    const gruppe = [start];
    besucht.add(start);
    for (let i = 0; i < gruppe.length; i++) {
      for (const o of flaechen) {
        if (!besucht.has(o) && buendig(gruppe[i], o)) {
          besucht.add(o);
          gruppe.push(o);
        }
      }
    }
    if (gruppe.length >= 4) for (const z of gruppe) tabelle.add(z);
  }
  return tabelle;
}

const NASSRAUM = /\b(bad|wc|dusche|du\b|sanit|toilette)/i;
const UNBEHEIZT =
  /\b(garage|tiefgarage|terrasse|balkon|loggia|carport|gehweg|garten|vordach|lager|schuppen|nicht konditio|keller|technik|heizraum|hausanschluss|fahrrad|müll)/i;

const SEITENVERHAELTNIS = 1.4;

export function umfangAusFlaeche(flaeche: number) {
  const kurz = Math.sqrt(flaeche / SEITENVERHAELTNIS);
  return { umfang_m: 2 * kurz * (1 + SEITENVERHAELTNIS), umfangQuelle: "geschaetzt" as const };
}

/**
 * Setzt Textfragmente zu Zeilen zusammen.
 *
 * CAD-Programme zerlegen eine Beschriftung beim PDF-Export in mehrere Stücke:
 * "60,29" und "m²" kommen einzeln an. Ohne dieses Zusammensetzen findet die
 * Suche nach Raumstempeln nichts, weil kein Fragment für sich wie eine
 * Flächenangabe aussieht.
 */
function baueZeilen(schnipsel: Schnipsel[]): Schnipsel[] {
  if (schnipsel.length === 0) return [];

  // Erst nach Höhe bündeln, dann innerhalb eines Bandes nach waagrechter Nähe
  // trennen. Ohne die zweite Trennung verschmelzen nebeneinanderliegende
  // Raumstempel zu einer einzigen Zeile, weil sie dieselbe Höhe teilen.
  // Von oben nach unten und jeweils zum nächstgelegenen Band: sonst verketten
  // sich eng gestapelte Stempelzeilen über ein fremdes Band zu "TERRASSEHolzbelag".
  const baender = new Map<number, Schnipsel[]>();
  for (const teil of [...schnipsel].sort((a, b) => b.y - a.y)) {
    const toleranz = Math.max(teil.hoehe * 0.6, 1.5);
    let vorhanden: number | undefined;
    for (const y of baender.keys()) {
      const abstand = Math.abs(y - teil.y);
      if (abstand <= toleranz && (vorhanden === undefined || abstand < Math.abs(vorhanden - teil.y))) vorhanden = y;
    }
    const schluessel = vorhanden ?? teil.y;
    baender.set(schluessel, [...(baender.get(schluessel) ?? []), teil]);
  }

  const zeilen: Schnipsel[] = [];
  for (const band of baender.values()) {
    const geordnet = band.sort((a, b) => a.x - b.x);
    let lauf: Schnipsel[] = [geordnet[0]];

    const abschliessen = () => {
      let text = lauf[0].text;
      for (let i = 1; i < lauf.length; i++) {
        const vorher = lauf[i - 1];
        const luecke = lauf[i].x - (vorher.x + vorher.breite);
        text += (luecke > vorher.hoehe * 0.33 ? " " : "") + lauf[i].text;
      }
      const letzte = lauf[lauf.length - 1];
      zeilen.push({
        text: text.replace(/\s{2,}/g, " ").trim(),
        x: lauf[0].x,
        y: lauf[0].y,
        hoehe: Math.max(...lauf.map((t) => t.hoehe)),
        breite: letzte.x + letzte.breite - lauf[0].x,
      });
    };

    for (let i = 1; i < geordnet.length; i++) {
      const vorher = geordnet[i - 1];
      const luecke = geordnet[i].x - (vorher.x + vorher.breite);
      // Eine Lücke von mehr als zwei Zeichenhöhen trennt zwei Beschriftungen.
      if (luecke > vorher.hoehe * 2) {
        abschliessen();
        lauf = [geordnet[i]];
      } else {
        lauf.push(geordnet[i]);
      }
    }
    abschliessen();
  }

  return zeilen;
}

/**
 * Ein Raumstempel besteht aus gestapelten Zeilen: Name, Fläche, Belag. Gesucht
 * wird von der Flächenangabe aus, weil sie das eindeutigste Muster hat.
 */
function findeRaeume(schnipsel: Schnipsel[], geschossFuer: (s: Schnipsel) => string, blatt: number): Raum[] {
  const raeume: Raum[] = [];

  for (const kandidat of schnipsel) {
    const treffer = FLAECHE.exec(kandidat.text.trim()) ?? STEMPEL_FLAECHE.exec(kandidat.text.trim());
    if (!treffer) continue;

    const flaeche = zahl(treffer[1] ?? treffer[2]);
    // Unter 0,5 m² ist es kein Raum, über 2000 m² keine Raumangabe mehr.
    if (flaeche === null || flaeche < 0.5 || flaeche > 2000) continue;

    // Nachbarschaft: gleiche Spalte, einige Zeilenhöhen darüber und darunter.
    // Der Radius ist großzügiger, weil manche CAD-Exporte Raumstempel mit
    // mehreren Zeilen (Nutzung, Belag, Fläche) produzieren.
    const spanne = Math.max(kandidat.hoehe * 4.0, 12);
    const nah = schnipsel.filter(
      (s) => s !== kandidat && Math.abs(s.x - kandidat.x) < spanne * 2.5 && Math.abs(s.y - kandidat.y) < spanne,
    );

    // Raumname suchen: zuerst oberhalb der Flächenangabe (häufigste Lage),
    // dann unterhalb als Fallback, ArchiCAD und andere CAD-Programme legen
    // den Namen manchmal darunter.
    // Wohnungsstempel "TOP - 09 / 141,17 m²" ist die Summe einer Wohnung, kein Raum
    const direktDarueber = nah
      .filter((s) => s.y > kandidat.y && s.y - kandidat.y < kandidat.hoehe * 2 && Math.abs(s.x - kandidat.x) < kandidat.hoehe * 3)
      .sort((a, b) => a.y - b.y)[0];
    if (direktDarueber && /^top(\s|-|–|$)/i.test(direktDarueber.text.trim())) continue;

    const namenKandidaten = nah
      .map((s) => ({ ...s, text: bereinigeName(s.text) }))
      .filter((s) => istRaumname(s.text));
    // Nächster zuerst; seitlicher Versatz zählt doppelt, weil die Zeilen eines
    // Stempels bündig untereinander stehen und daneben oft fremde Beschriftung liegt.
    const abstand = (s: Schnipsel) => Math.abs(s.y - kandidat.y) + 2 * Math.abs(s.x - kandidat.x);
    const darueber = namenKandidaten.filter((s) => s.y > kandidat.y).sort((a, b) => abstand(a) - abstand(b));
    const darunter = namenKandidaten.filter((s) => s.y < kandidat.y).sort((a, b) => abstand(a) - abstand(b));
    const name = (darueber[0] ?? darunter[0])?.text.trim();
    if (!name) continue;

    const belag = nah.find((s) => istBelag(s.text))?.text.trim();

    // Steht der Umfang im Stempel, gilt er statt der Schätzung aus der Fläche.
    const umfangZeile = nah
      .filter((s) => UMFANG.test(s.text.trim()))
      .sort((a, b) => Math.hypot(a.x - kandidat.x, a.y - kandidat.y) - Math.hypot(b.x - kandidat.x, b.y - kandidat.y))[0];
    const umfang = umfangZeile ? zahl(UMFANG.exec(umfangZeile.text.trim())![1]) : null;
    // Ein Quadrat hat den kleinsten Umfang; deutlich darunter ist es nicht dieser Raum.
    const umfangPasst = umfang !== null && umfang >= 3.9 * Math.sqrt(flaeche) && umfang <= 20 * Math.sqrt(flaeche);

    raeume.push({
      id: crypto.randomUUID(),
      geschoss: geschossFuer(kandidat),
      name,
      flaeche_m2: flaeche,
      belag,
      ...(umfangPasst ? { umfang_m: umfang!, umfangQuelle: "gerechnet" as const } : umfangAusFlaeche(flaeche)),
      beheizt: !UNBEHEIZT.test(name),
      nassraum: NASSRAUM.test(name),
      konfidenz: "plan" as Konfidenz,
      quelle: `Raumstempel (Blatt ${blatt})`,
    });
  }

  // Derselbe Raum kann auf einem Blatt mehrfach beschriftet sein.
  const gesehen = new Set<string>();
  // Zeilen aus Rechenblöcken wie "Nord = 1,20m²" oder Kürzel wie "A4" sind
  // keine Räume, auch wenn daneben eine Flächenangabe steht.
  const unsinn = /[=:]|^[A-Z]\d{1,2}$/;
  return raeume.filter((r) => {
    if (unsinn.test(r.name)) return false;
    const schluessel = `${r.geschoss}__${r.name.toLowerCase()}__${r.flaeche_m2}`;
    if (gesehen.has(schluessel)) return false;
    gesehen.add(schluessel);
    return true;
  });
}

/**
 * Sucht die Nachweiswerte. Der Wert steht entweder in derselben Zeile rechts
 * vom Begriff oder unmittelbar darunter.
 */
function findeNachweise(zeilen: Schnipsel[]): Record<string, number> {
  const gefunden: Record<string, number> = {};
  // Eine Zeile gehört zu genau einem Nachweis.
  const vergeben = new Set<Schnipsel>();

  for (const definition of NACHWEISE) {
    const begriffe = suchbegriffe(definition.id);

    // Alle Zeilen sammeln, die den Begriff enthalten, und die engste nehmen.
    // "Bebaute Fläche" steckt auch in "Bebaute Fläche in Abstandsflächen" -
    // ohne diese Wertung gewinnt die erstbeste, nicht die gemeinte Zeile.
    const kandidaten = zeilen
      .filter((z) => !vergeben.has(z))
      .flatMap((z) => {
        const text = normalisiereBegriff(z.text);
        const treffer = begriffe.find((b) => text.includes(b));
        if (!treffer) return [];
        // Überhang: alles in der Zeile, was nicht der Begriff selbst und keine
        // Zahl oder Einheit ist. Je weniger, desto sicherer die Zuordnung.
        const rest = text.replace(treffer, " ").replace(/[\d.,\s:=]|m[²2³3]?|lfm|grad|°|%/g, "").trim();
        return [{ zeile: z, ueberhang: rest.length }];
      })
      .sort((a, b) => a.ueberhang - b.ueberhang);

    for (const { zeile, ueberhang } of kandidaten) {
      // Mehr als ein paar Fremdzeichen heißt: andere Zeile, anderer Nachweis.
      if (ueberhang > 6) break;

      const wert = werteAusZeile(zeile, zeilen);
      if (wert !== null) {
        gefunden[definition.name] = wert;
        vergeben.add(zeile);
        break;
      }
    }
  }

  return gefunden;
}

/** Der Wert steht in der Zeile selbst, rechts daneben oder direkt darunter. */
function werteAusZeile(zeile: Schnipsel, alle: Schnipsel[]): number | null {
  const eigen = zeile.text.match(/([\d][\d.,\s\u00a0]*)\s*(m[²2³3]?|lfm|°|grad|%)?\s*$/i);
  if (eigen) {
    const wert = zahl(eigen[1]);
    if (wert !== null && wert !== 0) return wert;
  }

  const spanne = Math.max(zeile.hoehe * 2.5, 8);
  const nachbarn = alle
    .filter((n) => n !== zeile)
    .filter((n) => {
      const rechts = n.x > zeile.x && Math.abs(n.y - zeile.y) < spanne;
      const darunter = n.y < zeile.y && zeile.y - n.y < spanne * 2 && Math.abs(n.x - zeile.x) < spanne * 8;
      return rechts || darunter;
    })
    .sort((a, b) => Math.hypot(a.x - zeile.x, a.y - zeile.y) - Math.hypot(b.x - zeile.x, b.y - zeile.y));

  for (const n of nachbarn) {
    const m = n.text.trim().match(/^([\d][\d.,\s\u00a0]*)\s*(m[²2³3]?|lfm|°|grad|%)?$/i);
    const wert = m ? zahl(m[1]) : null;
    if (wert !== null && wert !== 0) return wert;
  }
  return null;
}

async function ladePdfjs() {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).href;
  return pdfjs;
}

/** Wertet die Textschnipsel aller Blätter aus: Raumstempel, Nachweise, Abgleich und Urteil. */
export function werteSeitenAus(seiten: Schnipsel[][]): Leseergebnis {
  const raeume: Raum[] = [];
  const nachweise: Record<string, number> = {};
  let gesamtSchnipsel = 0;

  seiten.forEach((schnipsel, i) => {
    const blatt = i + 1;
    gesamtSchnipsel += schnipsel.length;
    if (schnipsel.length === 0) return;

    const zeilen = baueZeilen(schnipsel);
    const geschossFuer = ordneGrundrissen(zeilen, geschossAusText(zeilen, blatt), blatt);
    raeume.push(...findeRaeume(zeilen, geschossFuer, blatt));
    // Der erste Fund gilt: Nachweise stehen einmal im Plansatz.
    for (const [name, wert] of Object.entries(findeNachweise(zeilen))) {
      nachweise[name] ??= wert;
    }
  });

  const hinweise: string[] = [];
  if (gesamtSchnipsel === 0) {
    hinweise.push(
      "Der Plan enthält keine Textebene, er ist vermutlich eingescannt. Direkt auslesen lässt er sich deshalb nicht.",
    );
  } else {
    hinweise.push(
      "Dieser Auszug wurde direkt aus der Textebene des Plans gelesen. Legende und Schnitthöhen werden dabei nicht erfasst; Wandhöhen beruhen daher auf Annahmen.",
    );
  }

  const wohnnutzflaeche = Object.entries(nachweise).find(([n]) =>
    normalisiereBegriff(n).includes("wohnnutzflaeche"),
  )?.[1];
  const abgleich = gleicheWohnnutzflaecheAb(raeume, wohnnutzflaeche);
  const bereinigte = abgleich.raeume;
  if (abgleich.hinweis) hinweise.push(abgleich.hinweis);

  const urteil = beurteile(bereinigte, nachweise, gesamtSchnipsel);
  return {
    raeume: bereinigte,
    kontext: {
      legende: {},
      geschosshoehen: {},
      nachweise,
      hinweise,
      projekt: { bezeichnung: null, planart: null, allgemeineBedingungen: [] },
    },
    schnipsel: gesamtSchnipsel,
    seiten: seiten.length,
    ...urteil,
  };
}

export async function lesePlanAusText(
  datei: File,
  melde: (seite: number, von: number) => void = () => {},
): Promise<Leseergebnis> {
  const pdfjs = await ladePdfjs();
  const dokument = await pdfjs.getDocument({
    data: new Uint8Array(await datei.arrayBuffer()),
    isEvalSupported: false,
    ...PDFJS_DOKUMENT_OPTIONEN,
  }).promise;

  try {
    const seiten: Schnipsel[][] = [];
    for (let blatt = 1; blatt <= dokument.numPages; blatt++) {
      melde(blatt, dokument.numPages);

      const seite = await dokument.getPage(blatt);
      const inhalt = await seite.getTextContent();

      seiten.push(
        inhalt.items
          .flatMap((item) => ("str" in item ? [item] : []))
          .filter((item) => item.str.trim().length > 0)
          .map((item) => ({
            text: item.str,
            x: item.transform[4],
            y: item.transform[5],
            hoehe: Math.abs(item.transform[3]) || 8,
            breite: item.width ?? item.str.length * 4,
          })),
      );
    }
    return werteSeitenAus(seiten);
  } finally {
    await dokument.destroy();
  }
}
