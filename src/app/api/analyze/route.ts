import { NextRequest, NextResponse } from "next/server";
import { erkenneDateityp } from "@/lib/filetype";
import { pdfZuBildern } from "@/lib/pdf2img";
import { analysiereBildseiten } from "@/lib/analyze";
import { gruppiereElemente } from "@/lib/group";
import { baueMassenauszug } from "@/lib/ableitung";
import { katalogInfo } from "@/lib/lbhb";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("plan");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ fehler: "Keine Datei übermittelt." }, { status: 400 });
  }

  // Die Einheitspreise liegen im Browser des Betriebs und reisen nur für die
  // Dauer dieser Auswertung mit; gespeichert werden sie hier nicht.
  let einheitspreise: Record<string, number> | undefined;
  const rohPreise = formData.get("einheitspreise");
  if (typeof rohPreise === "string" && rohPreise.length > 0) {
    try {
      const geparst: unknown = JSON.parse(rohPreise);
      if (typeof geparst === "object" && geparst !== null) {
        einheitspreise = Object.fromEntries(
          Object.entries(geparst as Record<string, unknown>).filter(
            (eintrag): eintrag is [string, number] =>
              typeof eintrag[1] === "number" && Number.isFinite(eintrag[1]) && eintrag[1] >= 0,
          ),
        );
      }
    } catch {
      // Unlesbare Preise werden übergangen; es gelten die Richtwerte.
    }
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
    const massenauszug = baueMassenauszug(analyse.raeume, analyse.elemente, analyse.kontext, einheitspreise);
    return NextResponse.json({ analyse, gruppen, massenauszug, katalog: katalogInfo() });
  } catch (err) {
    return NextResponse.json({ fehler: err instanceof Error ? err.message : "Unbekannter Fehler" }, { status: 500 });
  }
}
