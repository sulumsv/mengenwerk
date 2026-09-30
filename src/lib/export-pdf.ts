import type { jsPDF as JsPdf } from "jspdf";
import type { Massenauszug, Position } from "./types";
import { sortiereGeschosse } from "./ableitung";

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

export async function massenauszugAlsPdf(auszug: Massenauszug, titel: string, erstellt: Date): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const { autoTable } = await import("jspdf-autotable");

  const doc: JsPdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const breite = doc.internal.pageSize.getWidth();
  const hoehe = doc.internal.pageSize.getHeight();
  const rand = 14;
  const mitPreisen = auszug.kosten !== undefined;

  // Kopf
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, breite, 30, "F");
  doc.setFillColor(...SAFRAN);
  doc.rect(0, 30, breite, 1.2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("MENGENWERK  ·  MASSENAUSZUG NACH LB-HB 023", rand, 11);
  doc.setFontSize(18);
  doc.text(t(titel), rand, 21);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    `Erstellt am ${erstellt.toLocaleDateString("de-AT")} um ${erstellt.toLocaleTimeString("de-AT", { hour: "2-digit", minute: "2-digit" })}`,
    breite - rand,
    21,
    { align: "right" },
  );

  let y = 40;

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
  }

  return doc.output("blob");
}
