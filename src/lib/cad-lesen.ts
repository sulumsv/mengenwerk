"use client";

import { ladePdfjs } from "./plan-zu-bildern";
import { massstabAusText, sammleFlaechen, werteAus, type CadAuswertung, type OpsTabelle } from "./cad-ebenen";

/**
 * Liest die CAD-Ebenen aller Seiten eines Vektor-PDFs. Gibt null zurück, wenn
 * der Plan keine Ebenen mitbringt oder kein Maßstab im Plankopf steht.
 */
export async function leseCadEbenen(datei: File): Promise<CadAuswertung | null> {
  const name = datei.name.toLowerCase();
  if (!(name.endsWith(".pdf") || datei.type === "application/pdf")) return null;

  const pdfjs = await ladePdfjs();
  const dokument = await pdfjs.getDocument({ data: new Uint8Array(await datei.arrayBuffer()), isEvalSupported: false }).promise;
  try {
    const konfig = await dokument.getOptionalContentConfig();
    const ebenenNamen: Record<string, string> = {};
    for (const [id, gruppe] of konfig) ebenenNamen[id] = (gruppe as { name: string }).name;
    if (Object.keys(ebenenNamen).length === 0) return null;

    const flaechen = [];
    let massstab: number | null = null;
    for (let nr = 1; nr <= dokument.numPages; nr++) {
      const seite = await dokument.getPage(nr);
      const text = await seite.getTextContent();
      const texte = text.items.map((t) => ("str" in t ? t.str : ""));
      massstab ??= massstabAusText(texte);
      if (!massstab) continue;
      const liste = await seite.getOperatorList();
      flaechen.push(
        ...sammleFlaechen(liste.fnArray, liste.argsArray, pdfjs.OPS as unknown as OpsTabelle, ebenenNamen, massstab),
      );
    }
    if (!massstab) return null;

    const auswertung = werteAus(flaechen, massstab, Object.values(ebenenNamen));
    return auswertung.positionen.length > 0 ? auswertung : null;
  } finally {
    await dokument.destroy();
  }
}
