"use client";

/**
 * Wandelt einen Plan im Browser in Bilder um, bevor er hochgeladen wird.
 *
 * Das hat drei Gründe. Ein Einreichplan ist als PDF schnell zweistellig
 * megabytegroß und läuft gegen die Uploadgrenze der Hosting-Plattform;
 * komprimierte Seitenbilder sind ein Bruchteil davon. Die Umwandlung auf dem
 * Server brauchte zudem eine Grafikbibliothek, die dort nicht überall
 * verfügbar ist. Und weil die Umwandlung hier sichtbar abläuft, lässt sich der
 * Fortschritt anzeigen, statt minutenlang nichts zu melden.
 */

/**
 * pdfjs wird erst beim ersten Aufruf geladen. Auf Modulebene importiert, würde
 * es beim Vorrendern der Seite auf dem Server ausgewertet, wo die
 * Browser-Zeichenfläche fehlt — der Build bricht dann mit "DOMMatrix is not
 * defined" ab.
 */
let pdfjsPromise: Promise<typeof import("pdfjs-dist")> | null = null;

function ladePdfjs(): Promise<typeof import("pdfjs-dist")> {
  pdfjsPromise ??= import("pdfjs-dist").then((pdfjs) => {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url,
    ).href;
    return pdfjs;
  });
  return pdfjsPromise;
}

/** Kantenlänge, auf die eine Planseite gerechnet wird. Maßketten bleiben lesbar. */
const MAX_KANTE_PX = 2200;

/** JPEG-Qualität. Darunter zerfallen dünne Bemaßungslinien. */
const QUALITAET = 0.82;

export interface Blatt {
  nummer: number;
  datei: File;
}

function skalierung(breite: number, hoehe: number): number {
  return Math.min(1, MAX_KANTE_PX / Math.max(breite, hoehe));
}

async function alsJpeg(leinwand: HTMLCanvasElement, name: string): Promise<File> {
  const blob = await new Promise<Blob | null>((fertig) =>
    leinwand.toBlob(fertig, "image/jpeg", QUALITAET),
  );
  if (!blob) throw new Error("Die Planseite konnte nicht in ein Bild umgewandelt werden.");
  return new File([blob], name, { type: "image/jpeg" });
}

async function pdfZuBlaettern(
  datei: File,
  melde: (seite: number, von: number) => void,
): Promise<Blatt[]> {
  const pdfjs = await ladePdfjs();
  const dokument = await pdfjs.getDocument({
    data: new Uint8Array(await datei.arrayBuffer()),
    isEvalSupported: false,
  }).promise;

  try {
    const blaetter: Blatt[] = [];
    for (let nummer = 1; nummer <= dokument.numPages; nummer++) {
      melde(nummer, dokument.numPages);

      const seite = await dokument.getPage(nummer);
      const roh = seite.getViewport({ scale: 1 });
      const viewport = seite.getViewport({ scale: skalierung(roh.width, roh.height) * 2 });

      const leinwand = document.createElement("canvas");
      leinwand.width = Math.round(viewport.width);
      leinwand.height = Math.round(viewport.height);
      const ctx = leinwand.getContext("2d");
      if (!ctx) throw new Error("Der Browser stellt keine Zeichenfläche bereit.");

      // Pläne sind auf weißem Grund gezeichnet; ohne Füllung bliebe er transparent
      // und im JPEG schwarz.
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, leinwand.width, leinwand.height);
      await seite.render({ canvas: leinwand, viewport }).promise;

      blaetter.push({ nummer, datei: await alsJpeg(leinwand, `blatt-${nummer}.jpg`) });
      leinwand.width = 0;
      leinwand.height = 0;
    }
    return blaetter;
  } finally {
    await dokument.destroy();
  }
}

async function bildZuBlatt(datei: File): Promise<Blatt[]> {
  const bitmap = await createImageBitmap(datei);
  try {
    const faktor = skalierung(bitmap.width, bitmap.height);
    // Passt es ohnehin, bleibt die Datei unangetastet — erneutes Kodieren
    // kostet nur Schärfe.
    if (faktor === 1 && datei.size < 4 * 1024 * 1024) {
      return [{ nummer: 1, datei }];
    }

    const leinwand = document.createElement("canvas");
    leinwand.width = Math.round(bitmap.width * faktor);
    leinwand.height = Math.round(bitmap.height * faktor);
    const ctx = leinwand.getContext("2d");
    if (!ctx) throw new Error("Der Browser stellt keine Zeichenfläche bereit.");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, leinwand.width, leinwand.height);
    ctx.drawImage(bitmap, 0, 0, leinwand.width, leinwand.height);

    return [{ nummer: 1, datei: await alsJpeg(leinwand, "blatt-1.jpg") }];
  } finally {
    bitmap.close();
  }
}

export async function planZuBlaettern(
  datei: File,
  melde: (seite: number, von: number) => void = () => {},
): Promise<Blatt[]> {
  const name = datei.name.toLowerCase();
  if (name.endsWith(".pdf") || datei.type === "application/pdf") {
    return pdfZuBlaettern(datei, melde);
  }
  return bildZuBlatt(datei);
}
