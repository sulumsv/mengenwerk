export type QuelleTyp = "vektor-pdf" | "scan" | "bild" | "dwg";

export async function erkenneDateityp(buf: Buffer, filename: string): Promise<QuelleTyp> {
  const ext = filename.toLowerCase().split(".").pop();
  if (ext === "dwg" || ext === "dxf") return "dwg";
  if (ext === "png" || ext === "jpg" || ext === "jpeg" || ext === "tif" || ext === "tiff") return "bild";

  if (ext === "pdf") {
    const text = buf.toString("latin1");
    const hasFonts = text.includes("/Font") || text.includes("/Type0");
    const hasTextOps = /\bTj\b|\bTJ\b/.test(text);
    return hasFonts && hasTextOps ? "vektor-pdf" : "scan";
  }

  return "bild";
}
