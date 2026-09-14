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
}

export interface Leseergebnis {
  raeume: Raum[];
  kontext: PlanKontext;
  /** Anzahl Textschnipsel im Plan. Null heißt: eingescannt, nicht auslesbar. */
  schnipsel: number;
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
  return raeume.filter((r) => {
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
function findeNachweise(schnipsel: Schnipsel[]): Record<string, number> {
  const gefunden: Record<string, number> = {};
  // Eine Beschriftung gehört zu genau einem Nachweis. Ohne diese Sperre nimmt
  // ein allgemeinerer Begriff die Zeile eines spezifischeren weg —
  // "Bruttogrundrissfläche" träfe sonst auch die Zeile des Erdgeschoßes.
  const vergeben = new Set<Schnipsel>();

  for (const definition of NACHWEISE) {
    if (gefunden[definition.name] !== undefined) continue;
    const begriffe = suchbegriffe(definition.id);

    for (const s of schnipsel) {
      if (vergeben.has(s)) continue;
      const text = normalisiereBegriff(s.text);
      if (!begriffe.some((b) => text.includes(b))) continue;

      // Steht der Wert in derselben Beschriftung? "Dachneigung 35,00°"
      const eigen = s.text.match(/([\d.,]+)\s*(m[²2³3]?|°|grad)?\s*$/i);
      const ausEigen = eigen && !/^[a-zäöüß\s]+$/i.test(eigen[1]) ? zahl(eigen[1]) : null;
      if (ausEigen !== null && ausEigen !== 0) {
        gefunden[definition.name] = ausEigen;
        vergeben.add(s);
        break;
      }

      const spanne = Math.max(s.hoehe * 2.5, 8);
      const nachbarn = schnipsel
        .filter((n) => n !== s)
        .filter((n) => {
          const rechts = n.x > s.x && Math.abs(n.y - s.y) < spanne;
          const darunter = n.y < s.y && s.y - n.y < spanne * 2 && Math.abs(n.x - s.x) < spanne * 8;
          return rechts || darunter;
        })
        .sort((a, b) => Math.hypot(a.x - s.x, a.y - s.y) - Math.hypot(b.x - s.x, b.y - s.y));

      for (const n of nachbarn) {
        const m = n.text.trim().match(/^([\d.,\s ]+)\s*(m[²2³3]?|°|grad)?$/i);
        const wert = m ? zahl(m[1]) : null;
        if (wert !== null && wert !== 0) {
          gefunden[definition.name] = wert;
          vergeben.add(s);
          break;
        }
      }
      if (gefunden[definition.name] !== undefined) break;
    }
  }

  return gefunden;
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
        }));

      gesamtSchnipsel += schnipsel.length;
      if (schnipsel.length === 0) continue;

      raeume.push(...findeRaeume(schnipsel, geschossAusText(schnipsel, blatt), blatt));
      // Der erste Fund gilt: Nachweise stehen einmal im Plansatz.
      for (const [name, wert] of Object.entries(findeNachweise(schnipsel))) {
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

    return {
      raeume,
      kontext: { legende: {}, geschosshoehen: {}, nachweise, hinweise },
      schnipsel: gesamtSchnipsel,
    };
  } finally {
    await dokument.destroy();
  }
}
