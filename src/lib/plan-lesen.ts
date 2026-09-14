"use client";

import { NACHWEISE, normalisiereBegriff, suchbegriffe } from "./nachweise";
import type { Konfidenz, PlanKontext, Raum } from "./types";

/**
 * Liest einen Plan aus seiner Textebene, ohne Bilderkennung.
 *
 * Ein Einreichplan aus einem CAD-Programm enthält seine Beschriftungen als
 * echten Text mit Koordinaten: Raumstempel, Flächennachweise, Dachneigung.
 * Genau diese Werte sind die Grundlage der Mengenermittlung — sie lassen sich
 * daher direkt auslesen, ohne den Plan anzusehen.
 *
 * Das funktioniert nicht bei eingescannten Plänen: dort ist alles Bild und die
 * Textebene leer. Was dieser Weg nicht kann, sagt das Ergebnis offen.
 */

/** Ein Textschnipsel der Seite mit seiner Lage. Ursprung unten links. */
interface Schnipsel {
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
   * sieht genauso fertig aus wie ein richtiger — deshalb wird lieber nichts
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
function beurteile(raeume: Raum[], nachweise: Record<string, number>): { verlaesslich: boolean; grund?: string } {
  if (raeume.length < 3) {
    return { verlaesslich: false, grund: `Es wurden nur ${raeume.length} Räume erkannt.` };
  }

  const summe = raeume.filter((r) => r.beheizt).reduce((s, r) => s + r.flaeche_m2, 0);
  const ausweis = Object.entries(nachweise).find(([n]) =>
    normalisiereBegriff(n).includes("wohnnutzflaeche"),
  )?.[1];

  if (ausweis && ausweis > 0) {
    const abweichung = Math.abs(summe - ausweis) / ausweis;
    if (abweichung > 0.2) {
      return {
        verlaesslich: false,
        grund: `Die Summe der erkannten Räume (${summe.toFixed(2)} m²) weicht stark von der ausgewiesenen Wohnnutzfläche (${ausweis.toFixed(2)} m²) ab.`,
      };
    }
  }

  return { verlaesslich: true };
}

function zahl(roh: string): number | null {
  // Österreichische Schreibweise: Komma als Dezimaltrenner, Punkt oder
  // schmales Leerzeichen als Tausendertrenner.
  const bereinigt = roh.replace(/[\s  ']/g, "").replace(/\.(?=\d{3}\b)/g, "").replace(",", ".");
  const wert = Number(bereinigt);
  return Number.isFinite(wert) ? wert : null;
}

/** "60,29 m²" — die Flächenangabe eines Raumstempels. */
const FLAECHE = /^([\d.,\s ]+)\s*m[²2]$/i;

/** Belagsangaben, wie sie in Raumstempeln vorkommen. */
const BELAG =
  /^(parkett|fliesen?|estrich|beton[\w\s().-]*|bodenbeschichtung|stein|dielen|teppich|laminat|linoleum|vinyl|kautschuk)[\w\s().-]*$/i;

/** Zeilen, die nie ein Raumname sind. */
const KEIN_RAUMNAME =
  /^(m[²2]|±|\+|-|ca\.?|abs\.?|gem\.?|lt\.?|nach|bzw\.?|und|oder|der|die|das|von|bis|max\.?|min\.?)$/i;

/** "14,26 m", "35,00°", "2,80 m²" — eine Maßangabe, kein Raumname. */
const MASSANGABE = /^[\d.,\s\u00a0]+\s*(m[²2³3]?|cm|mm|°|grad|%|stk|stück)?\.?$/i;

function istRaumname(text: string): boolean {
  const t = text.trim();
  if (t.length < 2 || t.length > 40) return false;
  if (KEIN_RAUMNAME.test(t)) return false;
  if (FLAECHE.test(t)) return false;
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

const NASSRAUM = /\b(bad|wc|dusche|du\b|sanit|toilette)/i;
const UNBEHEIZT = /\b(garage|terrasse|balkon|loggia|carport|gehweg|garten|vordach|lager|schuppen|nicht konditio)/i;

const SEITENVERHAELTNIS = 1.4;

function umfangAusFlaeche(flaeche: number) {
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
  const baender = new Map<number, Schnipsel[]>();
  for (const teil of schnipsel) {
    const toleranz = Math.max(teil.hoehe * 0.6, 1.5);
    const vorhanden = [...baender.keys()].find((y) => Math.abs(y - teil.y) <= toleranz);
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
function findeRaeume(schnipsel: Schnipsel[], geschoss: string, blatt: number): Raum[] {
  const raeume: Raum[] = [];

  for (const kandidat of schnipsel) {
    const treffer = FLAECHE.exec(kandidat.text.trim());
    if (!treffer) continue;

    const flaeche = zahl(treffer[1]);
    // Unter 0,5 m² ist es kein Raum, über 2000 m² keine Raumangabe mehr.
    if (flaeche === null || flaeche < 0.5 || flaeche > 2000) continue;

    // Nachbarschaft: gleiche Spalte, wenige Zeilenhöhen darüber und darunter.
    const spanne = Math.max(kandidat.hoehe * 3.2, 9);
    const nah = schnipsel.filter(
      (s) => s !== kandidat && Math.abs(s.x - kandidat.x) < spanne * 2.5 && Math.abs(s.y - kandidat.y) < spanne,
    );

    const darueber = nah
      .filter((s) => s.y > kandidat.y && istRaumname(s.text))
      .sort((a, b) => a.y - kandidat.y - (b.y - kandidat.y));
    const name = darueber[0]?.text.trim();
    if (!name) continue;

    const belag = nah.find((s) => s.y <= kandidat.y && BELAG.test(s.text.trim()))?.text.trim();

    raeume.push({
      id: crypto.randomUUID(),
      geschoss,
      name,
      flaeche_m2: flaeche,
      belag,
      ...umfangAusFlaeche(flaeche),
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
    // "Bebaute Fläche" steckt auch in "Bebaute Fläche in Abstandsflächen" —
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

export async function lesePlanAusText(
  datei: File,
  melde: (seite: number, von: number) => void = () => {},
): Promise<Leseergebnis> {
  const pdfjs = await ladePdfjs();
  const dokument = await pdfjs.getDocument({
    data: new Uint8Array(await datei.arrayBuffer()),
    isEvalSupported: false,
  }).promise;

  try {
    const raeume: Raum[] = [];
    const nachweise: Record<string, number> = {};
    let gesamtSchnipsel = 0;

    for (let blatt = 1; blatt <= dokument.numPages; blatt++) {
      melde(blatt, dokument.numPages);

      const seite = await dokument.getPage(blatt);
      const inhalt = await seite.getTextContent();

      const schnipsel: Schnipsel[] = inhalt.items
        .flatMap((item) => ("str" in item ? [item] : []))
        .filter((item) => item.str.trim().length > 0)
        .map((item) => ({
          text: item.str,
          x: item.transform[4],
          y: item.transform[5],
          hoehe: Math.abs(item.transform[3]) || 8,
          breite: item.width ?? item.str.length * 4,
        }));

      gesamtSchnipsel += schnipsel.length;
      if (schnipsel.length === 0) continue;

      const zeilen = baueZeilen(schnipsel);
      raeume.push(...findeRaeume(zeilen, geschossAusText(zeilen, blatt), blatt));
      // Der erste Fund gilt: Nachweise stehen einmal im Plansatz.
      for (const [name, wert] of Object.entries(findeNachweise(zeilen))) {
        nachweise[name] ??= wert;
      }
    }

    const hinweise: string[] = [];
    if (gesamtSchnipsel === 0) {
      hinweise.push(
        "Der Plan enthält keine Textebene — er ist vermutlich eingescannt. Direkt auslesen lässt er sich deshalb nicht.",
      );
    } else {
      hinweise.push(
        "Dieser Auszug wurde direkt aus der Textebene des Plans gelesen. Legende und Schnitthöhen werden dabei nicht erfasst; Wandhöhen beruhen daher auf Annahmen.",
      );
    }

    const urteil = beurteile(raeume, nachweise);
    return {
      raeume,
      kontext: { legende: {}, geschosshoehen: {}, nachweise, hinweise },
      schnipsel: gesamtSchnipsel,
      seiten: dokument.numPages,
      ...urteil,
    };
  } finally {
    await dokument.destroy();
  }
}
