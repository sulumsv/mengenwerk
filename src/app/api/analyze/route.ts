import { NextRequest, NextResponse } from "next/server";
import { erkenneDateityp } from "@/lib/filetype";
import { pdfZuBildern } from "@/lib/pdf2img";
import { analysiereBildseiten } from "@/lib/analyze";
import { gruppiereElemente } from "@/lib/group";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("plan");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ fehler: "Keine Datei übermittelt." }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const dateityp = await erkenneDateityp(buf, file.name);

  if (dateityp === "dwg") {
    return NextResponse.json({ fehler: "DWG/DXF wird noch nicht unterstützt. Bitte als PDF exportieren." }, { status: 400 });
  }

  let bilder: Buffer[];
  if (dateityp === "bild") {
    bilder = [buf];
  } else {
    bilder = await pdfZuBildern(buf);
  }

  try {
    const analyse = await analysiereBildseiten(bilder, file.name, dateityp);
    const gruppen = gruppiereElemente(analyse.elemente);
    return NextResponse.json({ analyse, gruppen });
  } catch (err) {
    return NextResponse.json({ fehler: err instanceof Error ? err.message : "Unbekannter Fehler" }, { status: 500 });
  }
}
