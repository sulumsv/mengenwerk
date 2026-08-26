import { pdf } from "pdf-to-img";

const ZIEL_DPI = 200;
const SKALIERUNG = ZIEL_DPI / 72;

export async function pdfZuBildern(pdfBuf: Buffer): Promise<Buffer[]> {
  const dokument = await pdf(pdfBuf, { scale: SKALIERUNG });
  const bilder: Buffer[] = [];
  for await (const seite of dokument) {
    bilder.push(seite);
  }
  return bilder;
}
