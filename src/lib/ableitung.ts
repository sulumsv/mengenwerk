import { ANNAHMEN, verschnittFuer, type AnnahmeId } from "./annahmen";
import { findeLeistungsgruppen } from "./lbhb";
import { findePreis, type Einheitspreise } from "./preise";
import { suchbegriffe } from "./nachweise";
import type {
  Abschnitt,
  Kostenschaetzung,
  DetectedElement,
  ElementType,
  Einheit,
  Konfidenz,
  Massenauszug,
  PlanKontext,
  Position,
  Raum,
} from "./types";

export function runde(n: number, dez = 2): number {
  const f = 10 ** dez;
  return Math.round(n * f) / f;
}

/** Zahlformatierung für die Rechenwege: deutsches Dezimalkomma, feste Stellen. */
function z(n: number, dez = 2): string {
  return n.toLocaleString("de-AT", { minimumFractionDigits: dez, maximumFractionDigits: dez });
}

function summe(werte: number[]): number {
  return werte.reduce((a, b) => a + b, 0);
}

/** Die schwächste Konfidenz der Eingangswerte bestimmt die der Ableitung. */
const RANG: Record<Konfidenz, number> = { plan: 0, berechnet: 1, annahme: 2 };

function schwaechste(werte: Konfidenz[]): Konfidenz {
  return werte.reduce((a, b) => (RANG[a] >= RANG[b] ? a : b), "plan" as Konfidenz);
}

function konfidenzFuer(eingang: Konfidenz[], annahmen: AnnahmeId[], gerechnet: boolean): Konfidenz {
  if (annahmen.length > 0) return "annahme";
  const basis = schwaechste(eingang.length > 0 ? eingang : ["plan"]);
  return gerechnet ? schwaechste([basis, "berechnet"]) : basis;
}

/**
 * Sucht einen Nachweiswert über einen unscharfen Namensvergleich, die Begriffe
 * vom spezifischsten zum allgemeinsten. Gibt den Schlüssel mit zurück, damit
 * der Aufrufer ihn bei einer weiteren Suche ausschließen kann: "Bruttogrundriss"
 * trifft sonst ebenso "Bruttogrundriss EG" wie die Gesamtfläche.
 */
function findeNachweis(
  kontext: PlanKontext,
  begriffe: string[],
  ausser: ReadonlySet<string> = new Set(),
): { schluessel: string; wert: number } | null {
  const eintraege = Object.entries(kontext.nachweise).filter(([name]) => !ausser.has(name));
  for (const begriff of begriffe) {
    const gesucht = begriff.toLowerCase();
    const treffer = eintraege.find(([name]) => name.toLowerCase().includes(gesucht));
    if (treffer) return { schluessel: treffer[0], wert: treffer[1] };
  }
  return null;
}

function nachweis(kontext: PlanKontext, ...begriffe: string[]): number | null {
  return findeNachweis(kontext, begriffe)?.wert ?? null;
}

/** Sucht einen Nachweis über seine Definition in der gemeinsamen Registry. */
function nw(kontext: PlanKontext, id: string): number | null {
  return findeNachweis(kontext, suchbegriffe(id))?.wert ?? null;
}

/**
 * Geschoße gehören in Bauordnung sortiert, nicht alphabetisch — sonst steht das
 * Dachgeschoß vor dem Erdgeschoß. Zwischenzahlen ("2. OG") ordnen innerhalb
 * ihrer Ebene.
 */
const GESCHOSS_RANG: [RegExp, number][] = [
  [/\bfundament|bodenplatte\b/i, 0],
  [/\b(kg|keller|untergescho)/i, 1],
  [/\b(sou|souterrain)/i, 2],
  [/\b(eg|erdgescho)/i, 3],
  [/\b(og|obergescho|stock)/i, 4],
  [/\b(dg|dachgescho|attika)/i, 5],
];

export function geschossRang(geschoss: string): number {
  const treffer = GESCHOSS_RANG.find(([muster]) => muster.test(geschoss));
  const basis = treffer ? treffer[1] : 9;
  const zahl = Number(geschoss.match(/\d+/)?.[0] ?? 0);
  return basis * 100 + zahl;
}

export function sortiereGeschosse(geschosse: string[]): string[] {
  return [...geschosse].sort((a, b) => geschossRang(a) - geschossRang(b) || a.localeCompare(b));
}

function geschosshoehe(kontext: PlanKontext, geschoss: string): number | null {
  const eintrag = Object.entries(kontext.geschosshoehen).find(
    ([g]) => g.toLowerCase() === geschoss.toLowerCase(),
  );
  return eintrag ? eintrag[1] : null;
}

/** Sammelt Positionen eines Abschnitts und vergibt fortlaufende Nummern. */
class Sammler {
  private positionen: Position[] = [];

  constructor(private abschnittsNummer: number) {}

  add(p: {
    bezeichnung: string;
    detail?: string;
    rechenweg: string;
    menge: number | null;
    einheit: Einheit;
    eingang?: Konfidenz[];
    annahmen?: AnnahmeId[];
    gerechnet?: boolean;
    typ?: ElementType;
    material?: string | null;
    preis?: string;
    zwischenwert?: boolean;
  }): void {
    const annahmen = p.annahmen ?? [];
    this.positionen.push({
      nummer: `${this.abschnittsNummer}.${this.positionen.length + 1}`,
      bezeichnung: p.bezeichnung,
      detail: p.detail,
      rechenweg: p.rechenweg,
      menge: p.menge === null ? null : runde(p.menge),
      einheit: p.einheit,
      konfidenz: konfidenzFuer(p.eingang ?? [], annahmen, p.gerechnet ?? true),
      lgKandidaten: p.typ
        ? findeLeistungsgruppen(p.typ, p.material ?? null).map((t) => `${t.lg} ${t.bezeichnung}`)
        : [],
      annahmen: annahmen.map((a) => ANNAHMEN[a].id),
      preisSchluessel: p.preis,
      zwischenwert: p.zwischenwert,
    });
  }

  get liste(): Position[] {
    return this.positionen;
  }
}

// ---------------------------------------------------------------------------
// Abschnitt: Erdarbeiten
// ---------------------------------------------------------------------------

function abschnittErdarbeiten(kontext: PlanKontext, genutzt: Set<AnnahmeId>): Abschnitt {
  const s = new Sammler(1);

  const bebaut = nw(kontext, "bebauteFlaeche");
  const sohle = nw(kontext, "gruendungssohle");

  if (bebaut !== null) {
    // Ohne bemaßte Gründungssohle bleibt nur die angenommene Plattenstärke als
    // Aushubtiefe — das unterschätzt den Aushub, weil Rollierung und
    // Sauberkeitsschicht fehlen. Deshalb als Annahme geführt.
    const tiefe = sohle !== null ? Math.abs(sohle) : ANNAHMEN.bodenplattenstaerke.wert;
    const ausNachweis = sohle !== null;
    if (!ausNachweis) genutzt.add("bodenplattenstaerke");

    s.add({
      bezeichnung: "Baugrubenaushub",
      detail: ausNachweis
        ? `Aushubtiefe ${z(tiefe)} m laut Schnitt, ohne Arbeitsraum und Böschung`
        : "Gründungssohle nicht bemaßt, Plattenstärke als Tiefe angesetzt",
      rechenweg: `${z(bebaut)} m² × ${z(tiefe)} m`,
      menge: bebaut * tiefe,
      einheit: "m3",
      annahmen: ausNachweis ? [] : ["bodenplattenstaerke"],
      typ: "fundament",
      preis: "erdaushub",
    });
  }

  return {
    nummer: 1,
    titel: "Erdarbeiten",
    lgHinweis: "LG 03",
    vorspann:
      s.liste.length > 0
        ? "Der Aushub folgt aus der bebauten Fläche und der Gründungstiefe. Arbeitsraum, Böschung und Geländeverlauf sind nicht berücksichtigt."
        : "Ohne nachgewiesene bebaute Fläche sind keine Erdarbeiten ableitbar.",
    positionen: s.liste,
  };
}

// ---------------------------------------------------------------------------
// Abschnitt: Bodenaufbau und Beläge
// ---------------------------------------------------------------------------

function abschnittBoden(raeume: Raum[], genutzt: Set<AnnahmeId>): Abschnitt {
  const s = new Sammler(2);
  const belegte = raeume.filter((r) => r.belag);

  const nachBelag = new Map<string, Raum[]>();
  for (const r of belegte) {
    const belag = r.belag!;
    nachBelag.set(belag, [...(nachBelag.get(belag) ?? []), r]);
  }

  for (const [belag, gruppe] of [...nachBelag].sort((a, b) => a[0].localeCompare(b[0]))) {
    const netto = summe(gruppe.map((r) => r.flaeche_m2));
    const { faktor, begruendung } = verschnittFuer(belag);
    s.add({
      bezeichnung: belag,
      detail: gruppe.map((r) => `${r.name} ${z(r.flaeche_m2)}`).join(" · "),
      rechenweg: `${z(netto)} m² × ${z(faktor)} (${begruendung})`,
      menge: netto * faktor,
      einheit: "m2",
      eingang: gruppe.map((r) => r.konfidenz),
      typ: "boden",
      material: belag,
     preis: preisFuerBelag(belag),
    });
  }

  const estrichRaeume = belegte.filter((r) => istEstrichfaehig(r));
  const estrichFlaeche = summe(estrichRaeume.map((r) => r.flaeche_m2));

  if (estrichFlaeche > 0) {
    const staerke = ANNAHMEN.estrichstaerke.wert;
    const volumen = estrichFlaeche * staerke;
    genutzt.add("estrichstaerke");
    s.add({
      bezeichnung: "Heizestrich CT-C25-F4",
      detail: `${z(staerke * 100, 0)} cm angenommen`,
      rechenweg: `${z(estrichFlaeche)} m² × ${z(staerke)} m`,
      menge: volumen,
      einheit: "m3",
      annahmen: ["estrichstaerke"],
      typ: "boden",
      material: "Estrich",
     preis: "estrich",
    });

    const dichte = ANNAHMEN.estrichRohdichte.wert;
    genutzt.add("estrichRohdichte");
    s.add({
      bezeichnung: "Estrich — Liefermasse",
      detail: `Rohdichte ${z(dichte, 0)} kg/m³`,
      rechenweg: `${z(volumen)} m³ × ${z(dichte, 0)} kg/m³ = ${z(volumen * dichte, 0)} kg`,
      menge: (volumen * dichte) / 1000,
      einheit: "t",
      annahmen: ["estrichstaerke", "estrichRohdichte"],
      zwischenwert: true,
    });

    const trittschall = verschnittFuer("trittschalldaemmung");
    s.add({
      bezeichnung: "Trittschalldämmung",
      detail: trittschall.begruendung,
      rechenweg: `${z(estrichFlaeche)} m² × ${z(trittschall.faktor)}`,
      menge: estrichFlaeche * trittschall.faktor,
      einheit: "m2",
     preis: "trittschall",
    });

    const folie = verschnittFuer("folie");
    s.add({
      bezeichnung: "PE-Trennlage",
      detail: folie.begruendung,
      rechenweg: `${z(estrichFlaeche)} m² × ${z(folie.faktor)}`,
      menge: estrichFlaeche * folie.faktor,
      einheit: "m2",
     preis: "pefolie",
    });

    const umfang = summe(estrichRaeume.map((r) => r.umfang_m));
    const geschaetzt = estrichRaeume.some((r) => r.umfangQuelle === "geschaetzt");
    s.add({
      bezeichnung: "Randdämmstreifen",
      detail: geschaetzt
        ? "Summe der Raumumfänge, teils aus der Fläche geschätzt"
        : "Summe der Raumumfänge",
      rechenweg: `${estrichRaeume.length} Räume, Umfang gesamt ${z(umfang)} m`,
      menge: umfang,
      einheit: "lfm",
      eingang: geschaetzt ? ["annahme"] : ["berechnet"],
      preis: "randdaemmstreifen",
    });
  }

  const beheizt = summe(raeume.filter((r) => r.beheizt).map((r) => r.flaeche_m2));
  if (beheizt > 0) {
    s.add({
      bezeichnung: "Fußbodenheizung",
      detail: "Verlegefläche beheizt",
      rechenweg: `Summe der beheizten Raumflächen`,
      menge: beheizt,
      einheit: "m2",
      preis: "fussbodenheizung",
    });
  }

  return {
    nummer: 2,
    titel: "Bodenaufbau & Beläge",
    lgHinweis: "LG 11 · 24 · 50",
    vorspann:
      "Flächen aus den Raumstempeln, Verschnittzuschläge nach Verlegeart. Schichtstärken sind angenommen, solange die Aufbautenliste fehlt.",
    positionen: s.liste,
  };
}

/**
 * Belagsbezeichnungen stammen aus dem Raumstempel und sind entsprechend frei
 * geschrieben. Ohne Treffer bleibt die Position unbepreist statt falsch
 * bepreist.
 */
const BELAG_PREIS: [RegExp, string][] = [
  [/parkett/i, "parkett"],
  [/diele/i, "dielen"],
  [/fliese|platte/i, "bodenfliesen"],
  [/stein/i, "naturstein"],
  [/beschichtung/i, "bodenbeschichtung"],
];

function preisFuerBelag(belag: string): string | undefined {
  return BELAG_PREIS.find(([muster]) => muster.test(belag))?.[1];
}

/** Außenliegende Beläge bekommen keinen Estrich. */
function istEstrichfaehig(r: Raum): boolean {
  const belag = (r.belag ?? "").toLowerCase();
  const name = r.name.toLowerCase();
  const aussen = ["stein", "dielen", "beschichtung", "beton"].some((b) => belag.includes(b));
  const aussenraum = ["terrasse", "balkon", "garage", "gehweg", "loggia"].some((n) => name.includes(n));
  return !aussen && !aussenraum;
}

// ---------------------------------------------------------------------------
// Abschnitt: Beton und Mauerwerk
// ---------------------------------------------------------------------------

function abschnittRohbau(
  kontext: PlanKontext,
  elemente: DetectedElement[],
  fassadeBrutto: number | null,
  genutzt: Set<AnnahmeId>,
): Abschnitt {
  const s = new Sammler(3);
  const betonVolumina: number[] = [];
  // Nur die Annahmen aufführen, die in eine tatsächlich gebildete Betonposition
  // eingeflossen sind — sonst behauptet die Summe Annahmen, die es nicht gab.
  const betonAnnahmen = new Set<AnnahmeId>();

  const eg = findeNachweis(kontext, suchbegriffe("bgfErdgeschoss"));
  // Die Gesamtfläche darf nicht denselben Eintrag treffen wie die des Erdgeschoßes.
  const gesamt = findeNachweis(kontext, suchbegriffe("bgfGesamt"), new Set(eg ? [eg.schluessel] : []));

  const plattenFlaeche = eg?.wert ?? null;
  const bgfGesamt = gesamt?.wert ?? null;
  if (plattenFlaeche) {
    const staerke = ANNAHMEN.bodenplattenstaerke.wert;
    const v = plattenFlaeche * staerke;
    betonVolumina.push(v);
    genutzt.add("bodenplattenstaerke");
    betonAnnahmen.add("bodenplattenstaerke");
    s.add({
      bezeichnung: "Bodenplatte",
      detail: `${z(staerke * 100, 0)} cm angenommen`,
      rechenweg: `${z(plattenFlaeche)} m² × ${z(staerke)} m`,
      menge: v,
      einheit: "m3",
      annahmen: ["bodenplattenstaerke"],
      typ: "fundament",
      material: "Stahlbeton",
      preis: "bodenplatte",
    });
  }

  // Ohne geschoßweise Bruttogrundrissflächen lässt sich die Deckenfläche nicht
  // trennen; dann bleibt die Position bewusst ohne Menge statt geraten.
  if (bgfGesamt && plattenFlaeche && bgfGesamt > plattenFlaeche) {
    const deckenFlaeche = bgfGesamt - plattenFlaeche;
    const staerke = ANNAHMEN.geschossdeckenstaerke.wert;
    const v = deckenFlaeche * staerke;
    betonVolumina.push(v);
    genutzt.add("geschossdeckenstaerke");
    betonAnnahmen.add("geschossdeckenstaerke");
    s.add({
      bezeichnung: "Geschoßdecken Stahlbeton",
      detail: `${z(staerke * 100, 0)} cm angenommen, Stiegenauge nicht abgezogen`,
      rechenweg: `(${z(bgfGesamt)} − ${z(plattenFlaeche)}) m² × ${z(staerke)} m`,
      menge: v,
      einheit: "m3",
      annahmen: ["geschossdeckenstaerke"],
      typ: "decke",
      material: "Stahlbeton",
      preis: "geschossdecke",
    });
  }

  for (const st of elemente.filter((e) => e.type === "stuetze")) {
    if (st.tiefe_m == null) {
      s.add({
        bezeichnung: `Stütze ${st.label}`,
        detail: "Querschnitt unvollständig bemaßt",
        rechenweg: "Aus Polierplan zu übernehmen",
        menge: null,
        einheit: "m3",
        eingang: [st.konfidenz],
        typ: "stuetze",
        material: st.material,
      });
      continue;
    }
    const v = st.breite_m * st.tiefe_m * st.hoehe_m * st.anzahl;
    betonVolumina.push(v);
    s.add({
      bezeichnung: `Stütze ${st.label}`,
      detail: st.material ?? undefined,
      rechenweg: `${st.anzahl} Stk × ${z(st.breite_m)} × ${z(st.tiefe_m)} × ${z(st.hoehe_m)} m`,
      menge: v,
      einheit: "m3",
      eingang: [st.konfidenz],
      typ: "stuetze",
      material: st.material,
     preis: "stuetze",
    });
  }

  if (betonVolumina.length > 0) {
    const gesamt = summe(betonVolumina);
    s.add({
      bezeichnung: "Beton gesamt",
      rechenweg: betonVolumina.map((v) => z(v)).join(" + "),
      menge: gesamt,
      einheit: "m3",
      annahmen: [...betonAnnahmen],
      zwischenwert: true,
    });

    const grad = ANNAHMEN.bewehrungsgrad.wert;
    genutzt.add("bewehrungsgrad");
    s.add({
      bezeichnung: "Bewehrung",
      detail: `${z(grad, 0)} kg/m³ Erfahrungswert — Statik maßgeblich`,
      rechenweg: `${z(gesamt)} m³ × ${z(grad, 0)} kg/m³ = ${z(gesamt * grad, 0)} kg`,
      menge: (gesamt * grad) / 1000,
      einheit: "t",
      annahmen: ["bewehrungsgrad"],
      preis: "bewehrung",
    });
  }

  if (fassadeBrutto) {
    const anteil = ANNAHMEN.oeffnungsanteilFassade.wert;
    const staerke = ANNAHMEN.aussenwandstaerke.wert;
    const netto = fassadeBrutto * (1 - anteil);
    genutzt.add("oeffnungsanteilFassade");
    genutzt.add("aussenwandstaerke");
    s.add({
      bezeichnung: "Außenwand Mauerwerk",
      detail: `Tragschale ${z(staerke * 100, 0)} cm, Öffnungsabzug ${z(anteil * 100, 0)} % pauschal`,
      rechenweg: `${z(fassadeBrutto)} m² × ${z(1 - anteil)} = ${z(netto)} m² × ${z(staerke)} m`,
      menge: netto * staerke,
      einheit: "m3",
      annahmen: ["oeffnungsanteilFassade", "aussenwandstaerke"],
      typ: "wand",
      material: "Ziegel",
      preis: "mauerwerk",
    });
  }

  return {
    nummer: 3,
    titel: "Beton & Mauerwerk",
    lgHinweis: "LG 07 · 08",
    vorspann:
      "Betonstärken sind nicht bemaßt und deshalb angesetzt. Sie gehen linear in Volumen und Bewehrung ein.",
    positionen: s.liste,
  };
}

// ---------------------------------------------------------------------------
// Abschnitt: Fassade und Gerüst
// ---------------------------------------------------------------------------

function abschnittFassade(
  kontext: PlanKontext,
  genutzt: Set<AnnahmeId>,
): { abschnitt: Abschnitt; brutto: number | null } {
  const s = new Sammler(4);

  const abwicklung = nw(kontext, "fassadenabwicklung");
  const giebel = nw(kontext, "giebelflaeche");
  const traufe = nw(kontext, "gebaeudehoehe");

  if (abwicklung === null) {
    return {
      abschnitt: {
        nummer: 4,
        titel: "Fassade & Gerüst",
        lgHinweis: "LG 23",
        vorspann:
          "Im Plansatz ist keine Fassadenabwicklung nachgewiesen. Ohne sie lässt sich die Fassadenfläche aus Grundrissen nicht belastbar rekonstruieren.",
        positionen: [],
      },
      brutto: null,
    };
  }

  s.add({
    bezeichnung: "Fassadenabwicklung",
    detail: "aus dem Nachweis übernommen",
    rechenweg: "Nachweis Fassadenabwicklung",
    menge: abwicklung,
    einheit: "m2",
    gerechnet: false,
    zwischenwert: true,
  });

  let brutto = abwicklung;
  if (giebel !== null) {
    brutto += giebel;
    s.add({
      bezeichnung: "Giebelflächen",
      rechenweg: "Nachweis Giebelflächen",
      menge: giebel,
      einheit: "m2",
      gerechnet: false,
      zwischenwert: true,
    });
    s.add({
      bezeichnung: "Fassadenfläche brutto",
      rechenweg: `${z(abwicklung)} + ${z(giebel)}`,
      menge: brutto,
      einheit: "m2",
      zwischenwert: true,
    });
  }

  s.add({
    bezeichnung: "Wärmedämmverbundsystem",
    detail: "brutto, Öffnungsabzug erst mit der Fensterliste",
    rechenweg: "= Fassadenfläche brutto",
    menge: brutto,
    einheit: "m2",
    preis: "wdvs",
  });

  s.add({
    bezeichnung: "Außenputz",
    rechenweg: "= Fassadenfläche brutto",
    menge: brutto,
    einheit: "m2",
    preis: "aussenputz",
  });

  // Die Abwicklungslänge muss aus dem Nachweis kommen. Sie aus der Fläche und
  // der Traufenhöhe zurückzurechnen wäre zirkulär und ergäbe wieder exakt die
  // Abwicklungsfläche.
  const laenge = nw(kontext, "abwicklungslaenge");
  if (traufe !== null && laenge !== null) {
    const zuschlag = ANNAHMEN.geruestZuschlag.wert;
    genutzt.add("geruestZuschlag");
    s.add({
      bezeichnung: "Fassadengerüst",
      detail: `Traufe ${z(traufe)} m zzgl. ${z(zuschlag)} m Schutzgeländer`,
      rechenweg: `${z(laenge)} lfm × ${z(traufe + zuschlag)} m`,
      menge: laenge * (traufe + zuschlag),
      einheit: "m2",
      annahmen: ["geruestZuschlag"],
      preis: "geruest",
    });
  } else {
    s.add({
      bezeichnung: "Fassadengerüst",
      detail: "Abwicklungslänge im Nachweis nicht ausgewiesen",
      rechenweg: "Ohne Abwicklungslänge nicht ableitbar",
      menge: null,
      einheit: "m2",
    });
  }

  return {
    abschnitt: {
      nummer: 4,
      titel: "Fassade & Gerüst",
      lgHinweis: "LG 23",
      vorspann:
        "Die Fassadenabwicklung ist vom Planverfasser nachgewiesen und muss nicht rekonstruiert werden — die verlässlichste Großposition im Plansatz.",
      positionen: s.liste,
    },
    brutto,
  };
}

// ---------------------------------------------------------------------------
// Abschnitt: Dach
// ---------------------------------------------------------------------------

function abschnittDach(kontext: PlanKontext): Abschnitt {
  const s = new Sammler(5);
  const neigung = nw(kontext, "dachneigung");
  const grundflaeche = nw(kontext, "bgfDachgeschoss");

  if (neigung !== null && grundflaeche !== null && neigung > 0 && neigung < 90) {
    const faktor = 1 / Math.cos((neigung * Math.PI) / 180);
    const geneigt = grundflaeche * faktor;
    s.add({
      bezeichnung: "Dachfläche geneigt",
      detail: `Grundfläche ${z(grundflaeche)} m², Neigung ${z(neigung, 1)}°`,
      rechenweg: `${z(grundflaeche)} m² / cos ${z(neigung, 1)}° = ${z(grundflaeche)} × ${z(faktor, 4)}`,
      menge: geneigt,
      einheit: "m2",
      typ: "dach",
      zwischenwert: true,
    });

    const deckung = verschnittFuer("dachdeckung");
    s.add({
      bezeichnung: "Dachdeckung",
      detail: deckung.begruendung,
      rechenweg: `${z(geneigt)} m² × ${z(deckung.faktor)}`,
      menge: geneigt * deckung.faktor,
      einheit: "m2",
      typ: "dach",
      preis: "dachdeckung",
    });

    s.add({
      bezeichnung: "Lattung und Konterlattung",
      rechenweg: "= Dachfläche geneigt",
      menge: geneigt,
      einheit: "m2",
      typ: "dach",
      preis: "lattung",
    });

    const folie = verschnittFuer("folie");
    s.add({
      bezeichnung: "Unterspannbahn",
      detail: folie.begruendung,
      rechenweg: `${z(geneigt)} m² × ${z(folie.faktor)}`,
      menge: geneigt * folie.faktor,
      einheit: "m2",
      preis: "unterspannbahn",
    });

    s.add({
      bezeichnung: "Dachkonstruktion Holz",
      detail: "Sparren, Pfetten und First — Querschnitte laut Statik",
      rechenweg: "= Dachfläche geneigt",
      menge: geneigt,
      einheit: "m2",
      typ: "dach",
      material: "Holz",
      preis: "dachkonstruktion",
    });

    s.add({
      bezeichnung: "Zwischensparrendämmung",
      detail: "über der gesamten geneigten Fläche, unkonditionierte Bereiche zu prüfen",
      rechenweg: "= Dachfläche geneigt",
      menge: geneigt,
      einheit: "m2",
      preis: "dachdaemmung",
    });
  }

  // Traufenlänge kommt aus dem Nachweis; aus der Dachfläche ließe sie sich nur
  // unter einer Annahme zum Seitenverhältnis zurückrechnen.
  const traufe = nw(kontext, "traufenlaenge");
  if (traufe !== null) {
    s.add({
      bezeichnung: "Dachrinne",
      detail: "Nord- und Südtraufe",
      rechenweg: `2 × ${z(traufe)} m`,
      menge: 2 * traufe,
      einheit: "lfm",
      preis: "dachrinne",
    });
  }

  const pv = nw(kontext, "pvFlaeche");
  if (pv !== null) {
    s.add({
      bezeichnung: "Photovoltaikanlage",
      detail: "Modulfläche laut Dachdraufsicht",
      rechenweg: "Nachweis Modulfläche",
      menge: pv,
      einheit: "m2",
      gerechnet: false,
      preis: "pv",
    });
  }

  return {
    nummer: 5,
    titel: "Dach",
    lgHinweis: "LG 15 · 16 · 18",
    vorspann:
      s.liste.length > 0
        ? "Die geneigte Dachfläche folgt aus der Grundfläche über den Kosinus der Dachneigung. Der Dachüberstand ist darin nicht enthalten."
        : "Ohne bemaßte Dachneigung und Dachgrundfläche im Plansatz sind keine Dachmengen ableitbar.",
    positionen: s.liste,
  };
}

// ---------------------------------------------------------------------------
// Abschnitt: Putz, Malerei und Fliesenspiegel
// ---------------------------------------------------------------------------

function abschnittAusbau(raeume: Raum[], kontext: PlanKontext, genutzt: Set<AnnahmeId>): Abschnitt {
  const s = new Sammler(6);
  const innen = raeume.filter((r) => r.beheizt);

  const nachGeschoss = new Map<string, Raum[]>();
  for (const r of innen) {
    nachGeschoss.set(r.geschoss, [...(nachGeschoss.get(r.geschoss) ?? []), r]);
  }

  let wandGesamt = 0;
  let hoeheFehlt = false;

  const sortiert = sortiereGeschosse([...nachGeschoss.keys()]);
  for (const geschoss of sortiert) {
    const gruppe = nachGeschoss.get(geschoss)!;
    const umfang = summe(gruppe.map((r) => r.umfang_m));
    const ausSchnitt = geschosshoehe(kontext, geschoss);
    const hoehe = ausSchnitt ?? ANNAHMEN.raumhoheDachgeschoss.wert;
    if (ausSchnitt === null) {
      hoeheFehlt = true;
      genutzt.add("raumhoheDachgeschoss");
    }
    const flaeche = umfang * hoehe;
    wandGesamt += flaeche;

    s.add({
      bezeichnung: `Wandfläche ${geschoss}`,
      zwischenwert: true,
      detail: `Umfang ${z(umfang)} lfm · lichte Höhe ${z(hoehe)} m ${ausSchnitt === null ? "(angenommen)" : "(aus Schnitt)"}`,
      rechenweg: `${z(umfang)} lfm × ${z(hoehe)} m`,
      menge: flaeche,
      einheit: "m2",
      annahmen: ausSchnitt === null ? ["raumhoheDachgeschoss"] : [],
    });
  }

  if (wandGesamt > 0) {
    s.add({
      bezeichnung: "Innenputz Wand brutto",
      detail: "ohne Öffnungsabzug",
      rechenweg: "Summe aller Geschoße",
      menge: wandGesamt,
      einheit: "m2",
      annahmen: hoeheFehlt ? ["raumhoheDachgeschoss"] : [],
      preis: "innenputz",
    });
  }

  const decken = summe(innen.map((r) => r.flaeche_m2));
  if (decken > 0) {
    s.add({
      bezeichnung: "Deckenputz",
      detail: "= beheizte Nutzfläche",
      rechenweg: "Summe der beheizten Raumflächen",
      menge: decken,
      einheit: "m2",
      preis: "deckenputz",
    });
  }

  if (wandGesamt > 0 && decken > 0) {
    s.add({
      bezeichnung: "Malerei Wand + Decke",
      rechenweg: `${z(wandGesamt)} + ${z(decken)}`,
      menge: wandGesamt + decken,
      einheit: "m2",
      annahmen: hoeheFehlt ? ["raumhoheDachgeschoss"] : [],
      preis: "malerei",
    });
  }

  const nass = innen.filter((r) => r.nassraum);
  if (nass.length > 0) {
    const hoehe = ANNAHMEN.fliesenspiegelhoehe.wert;
    const tuerFlaeche = ANNAHMEN.tuerbreiteDurchgang.wert * ANNAHMEN.tuerhoeheDurchgang.wert;
    genutzt.add("fliesenspiegelhoehe");
    genutzt.add("tuerbreiteDurchgang");
    genutzt.add("tuerhoeheDurchgang");
    const brutto = summe(nass.map((r) => r.umfang_m * hoehe));
    // Bei sehr kleinen Nassräumen darf der Türabzug die Bruttofläche nicht
    // übersteigen, sonst entstünde eine negative Menge.
    const abzug = Math.min(nass.length * tuerFlaeche, brutto);
    const verschnitt = verschnittFuer("fliesen");
    s.add({
      bezeichnung: "Fliesenspiegel Nassräume",
      detail: `${nass.map((r) => r.name).join(" · ")} bis ${z(hoehe)} m`,
      rechenweg: `${z(brutto)} m² − ${z(abzug)} m² Türen = ${z(brutto - abzug)} m² × ${z(verschnitt.faktor)}`,
      menge: (brutto - abzug) * verschnitt.faktor,
      einheit: "m2",
      annahmen: ["fliesenspiegelhoehe", "tuerbreiteDurchgang", "tuerhoeheDurchgang"],
      typ: "boden",
      material: "Fliesen",
      preis: "wandfliesen",
    });
  }

  const sockelGruppen = new Map<string, Raum[]>();
  for (const r of innen.filter((r) => r.belag && !r.nassraum)) {
    sockelGruppen.set(r.belag!, [...(sockelGruppen.get(r.belag!) ?? []), r]);
  }

  for (const [belag, gruppe] of [...sockelGruppen].sort((a, b) => a[0].localeCompare(b[0]))) {
    const umfang = summe(gruppe.map((r) => r.umfang_m));
    const abzug = gruppe.length * ANNAHMEN.tuerbreiteDurchgang.wert;
    genutzt.add("tuerbreiteDurchgang");
    s.add({
      bezeichnung: `Sockelleiste ${belag}`,
      detail: `${gruppe.length} Räume, je ein Türdurchgang abgezogen`,
      rechenweg: `${z(umfang)} lfm − ${z(abzug)} lfm`,
      menge: umfang - abzug,
      einheit: "lfm",
      annahmen: ["tuerbreiteDurchgang"],
      preis: /fliese|platte|stein/i.test(belag) ? "sockelleisteFliesen" : "sockelleisteHolz",
    });
  }

  return {
    nummer: 6,
    titel: "Putz, Malerei & Fliesenspiegel",
    lgHinweis: "LG 23 · 24 · 42",
    vorspann:
      "Wandflächen raumweise aus Umfang × lichter Geschoßhöhe. Wo kein Schnitt eine Höhe hergibt, ist sie angenommen und die Position entsprechend gekennzeichnet.",
    positionen: s.liste,
  };
}

// ---------------------------------------------------------------------------
// Abschnitt: Fenster und Türen
// ---------------------------------------------------------------------------

function abschnittOeffnungen(elemente: DetectedElement[]): Abschnitt {
  const s = new Sammler(7);

  const relevant = elemente.filter((e) => e.type === "fenster" || e.type === "tuer");
  const gruppen = new Map<string, DetectedElement[]>();
  for (const e of relevant) {
    const key = `${e.type}__${e.material ?? "-"}__${runde(e.breite_m)}x${runde(e.hoehe_m)}`;
    gruppen.set(key, [...(gruppen.get(key) ?? []), e]);
  }

  for (const gruppe of gruppen.values()) {
    const erst = gruppe[0];
    const anzahl = summe(gruppe.map((e) => e.anzahl));
    const einzel = erst.breite_m * erst.hoehe_m;
    const istTor = /tor\b|sektionaltor|garagentor/i.test(erst.label);

    if (istTor) {
      s.add({
        bezeichnung: erst.label,
        detail: `${z(erst.breite_m)} × ${z(erst.hoehe_m)} m`,
        rechenweg: `${anzahl} Stk laut Plan`,
        menge: anzahl,
        einheit: "Stk",
        eingang: gruppe.map((e) => e.konfidenz),
        preis: "tor",
      });
      continue;
    }

    s.add({
      bezeichnung: `${erst.type === "fenster" ? "Fenster" : "Tür"} ${z(erst.breite_m * 100, 0)}/${z(erst.hoehe_m * 100, 0)}`,
      detail: [erst.material, erst.label].filter(Boolean).join(" · ") || undefined,
      rechenweg: `${anzahl} Stk × (${z(erst.breite_m)} × ${z(erst.hoehe_m)} m = ${z(einzel)} m²)`,
      menge: einzel * anzahl,
      einheit: "m2",
      eingang: gruppe.map((e) => e.konfidenz),
      typ: erst.type,
      material: erst.material,
      preis: erst.type === "fenster" ? "fenster" : "tuer",
    });
  }

  return {
    nummer: 7,
    titel: "Fenster & Türen",
    lgHinweis: "LG 37 · 43 · 71–75",
    vorspann:
      relevant.length > 0
        ? "Stückzahlen aus Grundrissen und Ansichten gezählt. Ohne Fenster- und Türliste bleiben sie zu verifizieren."
        : "Im Plansatz wurden keine bemaßten Fenster oder Türen gefunden.",
    positionen: s.liste,
  };
}

// ---------------------------------------------------------------------------
// Zusammenbau
// ---------------------------------------------------------------------------

function pruefpunkte(raeume: Raum[], kontext: PlanKontext): string[] {
  const punkte: string[] = [];

  const beheizt = summe(raeume.filter((r) => r.beheizt).map((r) => r.flaeche_m2));
  const ausweis = nw(kontext, "wohnnutzflaeche");
  if (ausweis !== null && beheizt > 0) {
    const differenz = runde(Math.abs(ausweis - beheizt));
    if (differenz > 0.05) {
      punkte.push(
        `Summe der beheizten Raumflächen: ${z(beheizt)} m². Nachweis: ${z(ausweis)} m². Differenz ${z(differenz)} m² — vor Ausschreibung klären.`,
      );
    }
  }

  const geschaetzt = raeume.filter((r) => r.umfangQuelle === "geschaetzt");
  if (geschaetzt.length > 0) {
    punkte.push(
      `Bei ${geschaetzt.length} Räumen (${geschaetzt.map((r) => r.name).join(", ")}) war nur die Fläche bemaßt. Deren Umfang ist aus der Fläche geschätzt und geht in Putz, Malerei und Sockelleisten ein.`,
    );
  }

  if (Object.keys(kontext.geschosshoehen).length === 0) {
    punkte.push(
      "Der Plansatz enthält keinen bemaßten Schnitt. Alle Wandhöhen und damit sämtliche Wand-, Putz- und Malereipositionen beruhen auf Annahmen.",
    );
  }

  if (Object.keys(kontext.legende).length === 0) {
    punkte.push(
      "Keine Planlegende gefunden. Ohne Materialzuordnung bleibt die Leistungsgruppe vieler Positionen offen.",
    );
  }

  return [...punkte, ...kontext.hinweise];
}

/**
 * Legt Einheitspreise auf die Positionen und bildet die Summen. Positionen
 * ohne Menge oder ohne Preisschlüssel bleiben unbepreist und werden gezählt,
 * damit die Schätzung nicht vollständiger wirkt, als sie ist.
 */
function bepreise(
  abschnitte: Abschnitt[],
  eigene: Einheitspreise | undefined,
): { abschnitte: Abschnitt[]; kosten: Kostenschaetzung } {
  let summe = 0;
  let ausRichtwerten = 0;
  let bepreist = 0;
  let unbepreist = 0;

  const bepreiste = abschnitte.map((abschnitt) => {
    let abschnittssumme = 0;

    const positionen = abschnitt.positionen.map((position) => {
      const treffer = findePreis(position.preisSchluessel, eigene);
      if (treffer === null || position.menge === null) {
        if (!position.zwischenwert) unbepreist++;
        return position;
      }

      const betrag = runde(position.menge * treffer.preis);
      abschnittssumme += betrag;
      summe += betrag;
      if (treffer.quelle === "richtwert") ausRichtwerten += betrag;
      bepreist++;

      return {
        ...position,
        einheitspreis: treffer.preis,
        betrag,
        preisQuelle: treffer.quelle,
      };
    });

    return { ...abschnitt, positionen, summe: runde(abschnittssumme) };
  });

  return {
    abschnitte: bepreiste,
    kosten: {
      summe: runde(summe),
      summeAusRichtwerten: runde(ausRichtwerten),
      bepreistePositionen: bepreist,
      unbepreistePositionen: unbepreist,
    },
  };
}

/** Setzt Abschnitts- und Positionsnummern auf die endgültige Reihenfolge. */
function nummeriere(abschnitt: Abschnitt, nummer: number): Abschnitt {
  return {
    ...abschnitt,
    nummer,
    positionen: abschnitt.positionen.map((p, i) => ({ ...p, nummer: `${nummer}.${i + 1}` })),
  };
}

export function baueMassenauszug(
  raeume: Raum[],
  elemente: DetectedElement[],
  kontext: PlanKontext,
  einheitspreise?: Einheitspreise,
): Massenauszug {
  const genutzt = new Set<AnnahmeId>();

  const erdarbeiten = abschnittErdarbeiten(kontext, genutzt);
  const boden = abschnittBoden(raeume, genutzt);
  const { abschnitt: fassade, brutto } = abschnittFassade(kontext, genutzt);
  const rohbau = abschnittRohbau(kontext, elemente, brutto, genutzt);
  const dach = abschnittDach(kontext);
  const ausbau = abschnittAusbau(raeume, kontext, genutzt);
  const oeffnungen = abschnittOeffnungen(elemente);

  // Das Raumbuch belegt in der Ansicht die Nummer 1, die Gewerke folgen ab 2.
  // Erst hier vergeben, damit das Weglassen eines leeren Abschnitts keine Lücke
  // in der Nummerierung hinterlässt.
  const roh = [erdarbeiten, boden, rohbau, fassade, dach, ausbau, oeffnungen]
    .filter((a) => a.positionen.length > 0 || a.vorspann)
    .map((a, i) => nummeriere(a, i + 2));

  const { abschnitte, kosten } = bepreise(roh, einheitspreise);

  const alle = abschnitte.flatMap((a) => a.positionen);
  const kennzahlen = [
    "Fassadenfläche brutto",
    "Beton gesamt",
    "Dachfläche geneigt",
    "Innenputz Wand brutto",
    "Malerei Wand + Decke",
    "Estrich — Liefermasse",
    "Fußbodenheizung",
  ]
    .map((name) => alle.find((p) => p.bezeichnung === name))
    .filter((p): p is Position => p !== undefined && p.menge !== null);

  return {
    raeume,
    kennzahlen,
    abschnitte,
    angewandteAnnahmen: [...genutzt].map((id) => {
      const a = ANNAHMEN[id];
      return { id: a.id, titel: a.titel, begruendung: a.begruendung, auswirkung: a.auswirkung };
    }),
    pruefpunkte: pruefpunkte(raeume, kontext),
    kosten,
  };
}
