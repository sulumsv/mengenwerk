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
 * Browser-Zeichenfläche fehlt, der Build bricht dann mit "DOMMatrix is not
 * defined" ab.
 */
let pdfjsPromise: Promise<typeof import("pdfjs-dist")> | null = null;

/**
 * Ohne diese drei Pfade bleiben Pläne mit JPEG2000-Rasterbildern (häufig bei
 * CAD-Exporten) oder bestimmten Schriften leer oder unvollständig: pdfjs lädt
 * den OpenJPEG/JBIG2-Dekoder und die Standardschriften nur, wenn es weiß, wo
 * sie liegen. Unversioniert über jsdelivr, an die installierte pdfjs-Version
 * gebunden über den package.json-Eintrag.
 */
const PDFJS_VERSION = "5.4.624";
const PDFJS_CDN = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}`;

/** Gemeinsame Optionen für jeden getDocument()-Aufruf im Browser. */
export const PDFJS_DOKUMENT_OPTIONEN = {
  wasmUrl: `${PDFJS_CDN}/wasm/`,
  cMapUrl: `${PDFJS_CDN}/cmaps/`,
  cMapPacked: true,
  standardFontDataUrl: `${PDFJS_CDN}/standard_fonts/`,
};

export function ladePdfjs(): Promise<typeof import("pdfjs-dist")> {
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
  /** Ausschnitte in höherer Auflösung, nur bei großen Blättern. */
  kacheln: File[];
}

/**
 * Ab dieser Blattkante in PDF-Punkten (etwa A2) wird zusätzlich gekachelt.
 * Auf einem A0-Blatt mit allen Grundrissen, Schnitten und Ansichten sind in
 * der Übersicht Fensterbeschriftungen und Maßketten nicht mehr lesbar.
 */
const KACHEL_AB_PT = 1650;
/** Kantenlänge einer Kachel. Über 20 Bildern je Anfrage nimmt die API höchstens 2000 px an. */
const KACHEL_PX = 1900;
/** Pixel je PDF-Punkt für die Kacheln, rund 115 dpi. */
const KACHEL_SKALA = 1.6;
const MAX_KACHELN = 6;
const UEBERLAPPUNG = 0.08;
/** Obergrenze aller Bilder einer Anfrage. Vercel nimmt höchstens 4,5 MB an. */
export const BILDBUDGET_BYTE = 4 * 1024 * 1024;

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

/** Raster für die Kacheln: so fein wie nötig, höchstens MAX_KACHELN Stück. */
function kachelRaster(breitePt: number, hoehePt: number): { spalten: number; zeilen: number; skala: number } {
  let skala = KACHEL_SKALA;
  for (;;) {
    const spalten = Math.ceil((breitePt * skala) / (KACHEL_PX * (1 - UEBERLAPPUNG)));
    const zeilen = Math.ceil((hoehePt * skala) / (KACHEL_PX * (1 - UEBERLAPPUNG)));
    if (spalten * zeilen <= MAX_KACHELN || skala < 0.8) return { spalten, zeilen, skala };
    skala *= 0.9;
  }
}

async function kachelnFuer(
  seite: import("pdfjs-dist").PDFPageProxy,
  nummer: number,
  budget: { rest: number },
): Promise<File[]> {
  const roh = seite.getViewport({ scale: 1 });
  if (Math.max(roh.width, roh.height) < KACHEL_AB_PT) return [];

  const { spalten, zeilen, skala } = kachelRaster(roh.width, roh.height);
  const viewport = seite.getViewport({ scale: skala });
  const gross = document.createElement("canvas");
  gross.width = Math.round(viewport.width);
  gross.height = Math.round(viewport.height);
  const ctx = gross.getContext("2d");
  if (!ctx) return [];
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, gross.width, gross.height);
  await seite.render({ canvas: gross, viewport }).promise;

  const kw = Math.min(gross.width, Math.ceil(gross.width / spalten / (1 - UEBERLAPPUNG)));
  const kh = Math.min(gross.height, Math.ceil(gross.height / zeilen / (1 - UEBERLAPPUNG)));
  const kacheln: File[] = [];
  try {
    for (let z = 0; z < zeilen; z++) {
      for (let s = 0; s < spalten; s++) {
        const x = spalten === 1 ? 0 : Math.round((s * (gross.width - kw)) / (spalten - 1));
        const y = zeilen === 1 ? 0 : Math.round((z * (gross.height - kh)) / (zeilen - 1));
        const stueck = document.createElement("canvas");
        stueck.width = kw;
        stueck.height = kh;
        stueck.getContext("2d")!.drawImage(gross, x, y, kw, kh, 0, 0, kw, kh);
        const datei = await alsJpeg(stueck, `blatt-${nummer}-kachel-${z + 1}-${s + 1}.jpg`);
        stueck.width = 0;
        // Reicht das Budget nicht, lieber weniger Kacheln als eine abgewiesene Anfrage.
        if (datei.size > budget.rest) return kacheln;
        budget.rest -= datei.size;
        kacheln.push(datei);
      }
    }
    return kacheln;
  } finally {
    gross.width = 0;
    gross.height = 0;
  }
}

async function pdfZuBlaettern(
  datei: File,
  melde: (seite: number, von: number) => void,
): Promise<Blatt[]> {
  const pdfjs = await ladePdfjs();
  const dokument = await pdfjs.getDocument({
    data: new Uint8Array(await datei.arrayBuffer()),
    isEvalSupported: false,
    ...PDFJS_DOKUMENT_OPTIONEN,
  }).promise;

  try {
    const blaetter: Blatt[] = [];
    const uebersichten: File[] = [];
    const seiten = [];
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

      const datei = await alsJpeg(leinwand, `blatt-${nummer}.jpg`);
      uebersichten.push(datei);
      seiten.push(seite);
      blaetter.push({ nummer, datei, kacheln: [] });
      leinwand.width = 0;
      leinwand.height = 0;
    }

    // Erst wenn alle Übersichten stehen, ist klar, wie viel Platz für Kacheln bleibt.
    const budget = { rest: BILDBUDGET_BYTE - uebersichten.reduce((s, d) => s + d.size, 0) };
    for (let i = 0; i < seiten.length && budget.rest > 0; i++) {
      blaetter[i].kacheln = await kachelnFuer(seiten[i], i + 1, budget);
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
    // Passt es ohnehin, bleibt die Datei unangetastet, erneutes Kodieren
    // kostet nur Schärfe.
    if (faktor === 1 && datei.size < 4 * 1024 * 1024) {
      return [{ nummer: 1, datei, kacheln: [] }];
    }

    const leinwand = document.createElement("canvas");
    leinwand.width = Math.round(bitmap.width * faktor);
    leinwand.height = Math.round(bitmap.height * faktor);
    const ctx = leinwand.getContext("2d");
    if (!ctx) throw new Error("Der Browser stellt keine Zeichenfläche bereit.");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, leinwand.width, leinwand.height);
    ctx.drawImage(bitmap, 0, 0, leinwand.width, leinwand.height);

    return [{ nummer: 1, datei: await alsJpeg(leinwand, "blatt-1.jpg"), kacheln: [] }];
  } finally {
    bitmap.close();
  }
}

/** Kleines Vorschaubild des ersten Blatts für die Scan-Animation, als Objekt-URL. */
export async function vorschauBild(datei: File): Promise<string> {
  const name = datei.name.toLowerCase();
  if (!(name.endsWith(".pdf") || datei.type === "application/pdf")) {
    return URL.createObjectURL(datei);
  }
  const pdfjs = await ladePdfjs();
  const dokument = await pdfjs.getDocument({
    data: new Uint8Array(await datei.arrayBuffer()),
    isEvalSupported: false,
    ...PDFJS_DOKUMENT_OPTIONEN,
  }).promise;
  try {
    const seite = await dokument.getPage(1);
    const roh = seite.getViewport({ scale: 1 });
    const viewport = seite.getViewport({ scale: Math.min(2, 1200 / Math.max(roh.width, roh.height)) });
    const leinwand = document.createElement("canvas");
    leinwand.width = Math.round(viewport.width);
    leinwand.height = Math.round(viewport.height);
    const ctx = leinwand.getContext("2d");
    if (!ctx) throw new Error("Der Browser stellt keine Zeichenfläche bereit.");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, leinwand.width, leinwand.height);
    await seite.render({ canvas: leinwand, viewport }).promise;
    const bild = await alsJpeg(leinwand, "vorschau.jpg");
    return URL.createObjectURL(bild);
  } finally {
    await dokument.destroy();
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
