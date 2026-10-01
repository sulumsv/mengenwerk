import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, istAngemeldet } from "@/lib/auth";
import { exportiereTrainingsdaten } from "@/lib/datenspeicher";

export const maxDuration = 60;

/**
 * Bündelt alle gespeicherten Regeln, Auswertungen, Korrekturen und
 * CAD-Einträge zu einem Trainingsdatensatz. Grundlage für ein künftiges
 * Fine-Tuning oder ein eigenes Modell. Lädt jeden Eintrag einzeln aus R2,
 * bei vielen gespeicherten Fällen dauert das - läuft nur auf Abruf.
 */
export async function GET(req: NextRequest) {
  if (!(await istAngemeldet(req.cookies.get(AUTH_COOKIE)?.value))) {
    return NextResponse.json({ fehler: "Nicht angemeldet." }, { status: 401 });
  }

  const export_ = await exportiereTrainingsdaten();
  const dateiname = `mengenwerk-trainingsdaten-${export_.erstellt.slice(0, 10)}.json`;

  return new NextResponse(JSON.stringify(export_, null, 2), {
    headers: {
      "content-type": "application/json",
      "content-disposition": `attachment; filename="${dateiname}"`,
    },
  });
}
