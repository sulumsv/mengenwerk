import type { jsPDF as JsPdf } from "jspdf";
import type { Massenauszug, PlanKontext, Position } from "./types";
import { sortiereGeschosse } from "./ableitung";

/** Das MengenWerk-Icon als PNG, fest eingebettet, damit das PDF ohne Netzzugriff ensteht. */
const LOGO_PNG =
  "data:image/png;base64,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";

/**
 * Erzeugt den Massenauszug als PDF im Browser. A4 quer, weil die
 * Positionstabelle mit Rechenweg und Preisen sonst nicht lesbar bleibt.
 */

const EINHEIT_TEXT: Record<string, string> = { m2: "m²", m3: "m³", t: "t", lfm: "lfm", Stk: "Stk", EUR: "EUR" };

const NAVY: [number, number, number] = [31, 42, 68];
const SAFRAN: [number, number, number] = [242, 178, 51];
const TEXT: [number, number, number] = [17, 24, 39];
const MATT: [number, number, number] = [91, 100, 114];
const LINIE: [number, number, number] = [230, 232, 236];
const GRAU: [number, number, number] = [248, 249, 251];

const KONFIDENZ_FARBE: Record<string, [number, number, number]> = {
  plan: [31, 122, 51],
  berechnet: [242, 178, 51],
  annahme: [192, 48, 29],
};

function zahl(n: number, dez = 2): string {
  return n.toLocaleString("de-AT", { minimumFractionDigits: dez, maximumFractionDigits: dez });
}

/**
 * Die eingebaute Helvetica kennt nur WinAnsi. Zeichen außerhalb davon würden
 * als Zeichensalat erscheinen, deshalb werden sie ersetzt.
 */
function t(wert: unknown): string {
  return String(wert ?? "")
    .replace(/[≈∼]/g, "ca. ")
    .replace(/[→]/g, "->")
    .replace(/[≤]/g, "<=")
    .replace(/[≥]/g, ">=")
    .replace(/[  ]/g, " ")
    .replace(/[^\x20-\x7e\xa0-\xff€²³×·–—…„“”‚‘’•]/g, "");
}

export async function massenauszugAlsPdf(
  auszug: Massenauszug,
  titel: string,
  erstellt: Date,
  kontext?: PlanKontext,
): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const { autoTable } = await import("jspdf-autotable");

  const doc: JsPdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const breite = doc.internal.pageSize.getWidth();
  const hoehe = doc.internal.pageSize.getHeight();
  const rand = 14;
  const mitPreisen = auszug.kosten !== undefined;
  const logoGroesse = 11;

  // Kopf
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, breite, 30, "F");
  doc.setFillColor(...SAFRAN);
  doc.rect(0, 30, breite, 1.2, "F");
  doc.addImage(LOGO_PNG, "PNG", breite - rand - logoGroesse, 6, logoGroesse, logoGroesse);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("MENGENWERK  ·  MASSENAUSZUG NACH LB-HB 023", rand, 11);
  doc.setFontSize(18);
  doc.text(t(titel), rand, 21, { maxWidth: breite - 2 * rand - logoGroesse - 6 });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    `Erstellt am ${erstellt.toLocaleDateString("de-AT")} um ${erstellt.toLocaleTimeString("de-AT", { hour: "2-digit", minute: "2-digit" })}`,
    breite - rand - logoGroesse - 4,
    12,
    { align: "right" },
  );
  if (kontext?.projekt.planart) {
    doc.text(t(kontext.projekt.planart), breite - rand - logoGroesse - 4, 17, { align: "right" });
  }

  let y = 40;

  // Projektangaben: Legende, Raumhöhen, Nachweise und Bedingungen hervorgehoben
  // direkt unter dem Kopf, damit sie vor den Zahlen ins Auge fallen.
  if (kontext) {
    const spalten: { titel: string; zeilen: string[] }[] = [
      {
        titel: "Planlegende",
        zeilen: Object.entries(kontext.legende).map(([f, b]) => `${t(f)}: ${t(b)}`),
      },
      {
        titel: "Lichte Raumhöhen",
        zeilen: Object.entries(kontext.geschosshoehen).map(([g, h]) => `${t(g)}: ${zahl(h)} m`),
      },
      {
        titel: "Nachweise",
        zeilen: Object.entries(kontext.nachweise).map(([b, w]) => `${t(b)}: ${zahl(w)}`),
      },
      {
        titel: "Allgemeine Bedingungen",
        zeilen: kontext.projekt.allgemeineBedingungen.map((b) => t(b)),
      },
    ].filter((s) => s.zeilen.length > 0);

    if (spalten.length > 0) {
      const zeilenHoehe = 3.6;
      const maxZeilen = Math.max(...spalten.map((s) => s.zeilen.length));
      const kartenHoehe = 10 + Math.min(maxZeilen, 8) * zeilenHoehe;
      doc.setFillColor(255, 251, 240);
      doc.setDrawColor(...SAFRAN);
      doc.setLineWidth(0.6);
      doc.roundedRect(rand, y, breite - 2 * rand, kartenHoehe, 1.5, 1.5, "FD");
      doc.setFillColor(...SAFRAN);
      doc.rect(rand, y, 1.6, kartenHoehe, "F");

      const sw = (breite - 2 * rand - 8) / spalten.length;
      spalten.forEach((s, i) => {
        const x = rand + 6 + i * sw;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.setTextColor(...NAVY);
        doc.text(s.titel.toUpperCase(), x, y + 6);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(...TEXT);
        // Bei Überlauf eine Zeile Platz für den "+N weitere"-Hinweis freihalten,
        // sonst sprengt er die für maximal 8 Zeilen berechnete Kartenhöhe.
        const sichtbar = s.zeilen.slice(0, s.zeilen.length > 8 ? 7 : 8);
        sichtbar.forEach((zeile, zi) => {
          doc.text(zeile, x, y + 10.5 + zi * zeilenHoehe, { maxWidth: sw - 4 });
        });
        if (s.zeilen.length > sichtbar.length) {
          doc.setTextColor(...MATT);
          doc.text(`+${s.zeilen.length - sichtbar.length} weitere`, x, y + 10.5 + sichtbar.length * zeilenHoehe);
        }
      });
      y += kartenHoehe + 6;
    }
  }

  // Kennzahlen als Kacheln
  const kennzahlen = auszug.kennzahlen.filter((k) => k.menge !== null).slice(0, 7);
  if (kennzahlen.length > 0) {
    const abstand = 3;
    const kw = (breite - 2 * rand - abstand * (kennzahlen.length - 1)) / kennzahlen.length;
    kennzahlen.forEach((k, i) => {
      const x = rand + i * (kw + abstand);
      doc.setDrawColor(...LINIE);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(x, y, kw, 18, 1.5, 1.5, "FD");
      doc.setTextColor(...MATT);
      doc.setFontSize(6.5);
      doc.setFont("helvetica", "bold");
      doc.text(t(k.bezeichnung).toUpperCase(), x + 3, y + 5.5, { maxWidth: kw - 6 });
      doc.setTextColor(...TEXT);
      doc.setFontSize(12);
      doc.text(`${zahl(k.menge!)} ${EINHEIT_TEXT[k.einheit] ?? k.einheit}`, x + 3, y + 14);
    });
    y += 24;
  }

  // Kostenschätzung
  const kosten = auszug.kosten;
  if (kosten && kosten.summe > 0) {
    const anteil = (kosten.summeAusRichtwerten / kosten.summe) * 100;
    doc.setFillColor(...NAVY);
    doc.roundedRect(rand, y, breite - 2 * rand, 14, 1.5, 1.5, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("KOSTENSCHÄTZUNG", rand + 4, y + 8.5);
    doc.setFontSize(13);
    doc.text(`${zahl(kosten.summe)} EUR netto`, breite - rand - 4, y + 9, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const hinweis =
      anteil >= 99.5
        ? "Beruht vollständig auf Richtwerten, keine Kalkulation."
        : anteil > 0
          ? `${zahl(anteil, 0)} % aus Richtwerten statt eigenen Preisen.`
          : "Vollständig mit eigenen Einheitspreisen gerechnet.";
    doc.setTextColor(220, 224, 232);
    doc.text(
      hinweis + (kosten.unbepreistePositionen > 0 ? ` ${kosten.unbepreistePositionen} Positionen ohne Preis.` : ""),
      rand + 45,
      y + 8.5,
    );
    y += 20;
  }

  const tabellenStil = {
    theme: "plain" as const,
    margin: { left: rand, right: rand, top: 18, bottom: 16 },
    styles: { font: "helvetica", fontSize: 8, cellPadding: 1.8, textColor: TEXT, lineColor: LINIE, lineWidth: { bottom: 0.2 } },
    headStyles: { fillColor: GRAU, textColor: MATT, fontStyle: "bold" as const, fontSize: 6.8 },
  };

  function ueberschrift(text: string, zusatz?: string) {
    if (y > hoehe - 40) {
      doc.addPage();
      y = 20;
    }
    doc.setTextColor(...TEXT);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(t(text), rand, y);
    if (zusatz) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...MATT);
      doc.text(t(zusatz), breite - rand, y, { align: "right" });
    }
    doc.setDrawColor(...NAVY);
    doc.setLineWidth(0.4);
    doc.line(rand, y + 2, breite - rand, y + 2);
    y += 6;
  }

  function punktZeichnen(konfidenzJeZeile: (string | undefined)[]) {
    return (data: { section: string; column: { index: number }; row: { index: number }; cell: { x: number; y: number; height: number } }) => {
      if (data.section !== "body" || data.column.index !== 0) return;
      const k = konfidenzJeZeile[data.row.index];
      if (!k) return;
      doc.setFillColor(...(KONFIDENZ_FARBE[k] ?? MATT));
      doc.rect(data.cell.x + 1.8, data.cell.y + data.cell.height / 2 - 1.1, 2.2, 2.2, "F");
    };
  }

  function nachTabelle() {
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  // Raumbuch
  if (auszug.raeume.length > 0) {
    ueberschrift("1. Raumbuch", "Grundlage aller Folgepositionen");
    const zeilen: string[][] = [];
    const konf: (string | undefined)[] = [];
    const gruppen: number[] = [];
    for (const g of sortiereGeschosse([...new Set(auszug.raeume.map((r) => r.geschoss))])) {
      gruppen.push(zeilen.length);
      zeilen.push(["", t(g), "", "", "", ""]);
      konf.push(undefined);
      for (const r of auszug.raeume.filter((r) => r.geschoss === g)) {
        zeilen.push([
          "",
          t(r.name),
          t(r.belag ?? "-"),
          `${zahl(r.flaeche_m2)} m²`,
          `${zahl(r.umfang_m)} m${r.umfangQuelle === "geschaetzt" ? " *" : ""}`,
          r.beheizt ? "ja" : "nein",
        ]);
        konf.push(r.konfidenz);
      }
    }
    const beheizt = auszug.raeume.filter((r) => r.beheizt).reduce((s, r) => s + r.flaeche_m2, 0);
    autoTable(doc, {
      ...tabellenStil,
      startY: y,
      head: [["", "Raum", "Belag", "Fläche", "Umfang", "Beheizt"]],
      body: zeilen,
      foot: [["", "Beheizte Nutzfläche", "", `${zahl(beheizt)} m²`, "", ""]],
      footStyles: { fillColor: GRAU, fontStyle: "bold", textColor: TEXT },
      columnStyles: { 0: { cellWidth: 6 }, 3: { halign: "right" }, 4: { halign: "right" } },
      didParseCell: (d) => {
        if (d.section === "body" && gruppen.includes(d.row.index)) {
          d.cell.styles.fontStyle = "bold";
          d.cell.styles.textColor = MATT;
          d.cell.styles.fillColor = GRAU;
          d.cell.styles.fontSize = 7;
        }
        if ((d.section === "head" || d.section === "foot") && (d.column.index === 3 || d.column.index === 4)) {
          d.cell.styles.halign = "right";
        }
      },
      didDrawCell: punktZeichnen(konf),
    });
    nachTabelle();
  }

  // Abschnitte
  for (const a of auszug.abschnitte) {
    if (a.positionen.length === 0 && !a.vorspann) continue;
    ueberschrift(`${a.nummer}. ${a.titel}`, a.lgHinweis);
    if (a.vorspann) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...MATT);
      const zeilen = doc.splitTextToSize(t(a.vorspann), breite - 2 * rand);
      doc.text(zeilen, rand, y + 2);
      y += zeilen.length * 3.6 + 3;
    }
    if (a.positionen.length === 0) {
      y += 4;
      continue;
    }

    const kopf = ["", "Pos.", "Bezeichnung", "Rechenweg", "Menge", "Einh."];
    if (mitPreisen) kopf.push("EP", "Betrag");
    kopf.push("LB HB");

    const body = a.positionen.map((p: Position) => {
      const zeile = [
        "",
        t(p.nummer),
        t(p.bezeichnung) + (p.detail ? `\n${t(p.detail)}` : ""),
        t(p.rechenweg),
        p.menge === null ? "-" : zahl(p.menge),
        EINHEIT_TEXT[p.einheit] ?? p.einheit,
      ];
      if (mitPreisen) {
        zeile.push(
          p.einheitspreis === undefined ? "-" : zahl(p.einheitspreis) + (p.preisQuelle === "richtwert" ? " *" : ""),
          p.betrag === undefined ? (p.zwischenwert ? "-" : "offen") : zahl(p.betrag),
        );
      }
      zeile.push(t(p.lgKandidaten.join(", ") || "-"));
      return zeile;
    });

    const rechts = mitPreisen ? [4, 6, 7] : [4];
    const foot =
      mitPreisen && a.summe !== undefined && a.summe > 0
        ? [["", "", `Summe ${t(a.titel)}`, "", "", "", "", `${zahl(a.summe)} EUR`, ""]]
        : undefined;

    autoTable(doc, {
      ...tabellenStil,
      startY: y,
      head: [kopf],
      body,
      foot,
      showFoot: "lastPage",
      footStyles: { fillColor: GRAU, fontStyle: "bold", textColor: TEXT },
      columnStyles: mitPreisen
        ? {
            0: { cellWidth: 6 },
            1: { cellWidth: 11, textColor: MATT },
            2: { cellWidth: 62 },
            3: { cellWidth: 66, textColor: MATT, fontSize: 7 },
            4: { cellWidth: 20 },
            5: { cellWidth: 11, textColor: MATT },
            6: { cellWidth: 20 },
            7: { cellWidth: 24 },
            8: { textColor: MATT, fontSize: 7 },
          }
        : {
            0: { cellWidth: 6 },
            1: { cellWidth: 11, textColor: MATT },
            2: { cellWidth: 78 },
            3: { cellWidth: 82, textColor: MATT, fontSize: 7 },
            4: { cellWidth: 22 },
            5: { cellWidth: 12, textColor: MATT },
            6: { textColor: MATT, fontSize: 7 },
          },
      didParseCell: (d) => {
        if (rechts.includes(d.column.index)) d.cell.styles.halign = "right";
        if (d.section === "body" && d.column.index === 2) d.cell.styles.fontStyle = "bold";
        if (d.section === "body" && d.column.index === 4) d.cell.styles.fontStyle = "bold";
      },
      didDrawCell: punktZeichnen(a.positionen.map((p) => p.konfidenz)),
    });
    nachTabelle();
  }

  // Annahmen und Prüfpunkte
  function liste(titelText: string, farbe: [number, number, number], zeilen: string[][]) {
    if (zeilen.length === 0) return;
    if (y > hoehe - 40) {
      doc.addPage();
      y = 20;
    }
    autoTable(doc, {
      ...tabellenStil,
      startY: y,
      head: [[{ content: titelText.toUpperCase(), colSpan: zeilen[0].length }]],
      body: zeilen,
      headStyles: { fillColor: farbe, textColor: farbe === SAFRAN ? TEXT : [255, 255, 255], fontStyle: "bold", fontSize: 7.5 },
      columnStyles: zeilen[0].length > 1 ? { 0: { cellWidth: 60, fontStyle: "bold" } } : {},
    });
    nachTabelle();
  }

  liste(
    "Diese Werte stehen nicht im Plan",
    KONFIDENZ_FARBE.annahme,
    auszug.angewandteAnnahmen.map((a) => [t(a.titel), `${t(a.begruendung)} ${t(a.auswirkung)}`]),
  );
  liste("Prüfpunkte im Plansatz", SAFRAN, auszug.pruefpunkte.map((p) => [t(p)]));

  // Legende und Seitenfuß auf jeder Seite
  const seiten = doc.getNumberOfPages();
  for (let s = 1; s <= seiten; s++) {
    doc.setPage(s);
    const fy = hoehe - 8;
    doc.setDrawColor(...LINIE);
    doc.setLineWidth(0.2);
    doc.line(rand, fy - 4, breite - rand, fy - 4);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    let x = rand;
    for (const [k, text] of [
      ["plan", "Aus Plan"],
      ["berechnet", "Berechnet"],
      ["annahme", "Annahme"],
    ] as const) {
      doc.setFillColor(...KONFIDENZ_FARBE[k]);
      doc.rect(x, fy - 2, 2, 2, "F");
      doc.setTextColor(...MATT);
      doc.text(text, x + 3, fy - 0.3);
      x += 22;
    }
    doc.text("* Umfang geschätzt bzw. Preis aus Richtwert", x + 2, fy - 0.3);
    doc.text(`${t(titel)}  ·  Seite ${s} von ${seiten}`, breite - rand, fy - 0.3, { align: "right" });

    const logoFuss = 3.6;
    const mitteX = breite / 2;
    doc.addImage(LOGO_PNG, "PNG", mitteX - 9, fy - logoFuss + 0.3, logoFuss, logoFuss);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...NAVY);
    doc.text("mengenwerk", mitteX - 4, fy - 0.3);
    doc.setFont("helvetica", "normal");
  }

  return doc.output("blob");
}
