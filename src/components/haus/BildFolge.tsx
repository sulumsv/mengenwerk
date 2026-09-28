"use client";

// Fließender Fotoübergang für die Startseite: Baustelle → fertiges Haus.
// Beide Fotos sind echte, lizenzfreie Aufnahmen (Pixabay-Inhaltslizenz, kostenlose
// kommerzielle Nutzung), zeigen aber zwei unterschiedliche Gebäude – deshalb bleibt
// die Bezeichnung "Beispielprojekt" in den Kapiteltexten stehen, statt zu behaupten,
// es sei durchgehend dasselbe Haus.
//
// Statt eines harten Schnitts zwischen den Fotos überlappt eine lange Überblend-Zone,
// und jedes Bild bekommt einen eigenen, durchgehenden Ken-Burns-Zoom über seine ganze
// Sichtbarkeitsspanne, damit die Bewegung nie stehen bleibt und nie abrupt springt.

import { motion, useTransform, type MotionValue } from "motion/react";

function Ebene({
  fortschritt,
  src,
  ein,
  aus,
  zoomVon = 1,
  zoomBis = 1.14,
  versatzX = 0,
}: {
  fortschritt: MotionValue<number>;
  src: string;
  ein: [number, number];
  aus: [number, number];
  zoomVon?: number;
  zoomBis?: number;
  versatzX?: number;
}) {
  const opacity = useTransform(fortschritt, [ein[0], ein[1], aus[0], aus[1]], [0, 1, 1, 0]);
  const scale = useTransform(fortschritt, [ein[0], aus[1]], [zoomVon, zoomBis]);
  const x = useTransform(fortschritt, [ein[0], aus[1]], [0, versatzX]);
  return (
    <motion.div className="absolute inset-0" style={{ opacity }}>
      <motion.div
        className="absolute inset-0 bg-center bg-cover"
        style={{ backgroundImage: `url(${src})`, scale, x }}
      />
    </motion.div>
  );
}

export function BildFolge({ fortschritt }: { fortschritt: MotionValue<number> }) {
  // Überlappende Fenster: Baustelle blendet schon ein, während der Plan noch verblasst;
  // die Villa blendet lange bevor die Baustelle ganz weg ist ein — nirgends ein harter Schnitt.
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#eeece5]">
      <Ebene fortschritt={fortschritt} src="/animation/02-baustelle.webp" ein={[0.16, 0.3]} aus={[0.62, 0.78]} zoomVon={1.05} zoomBis={1.22} versatzX={-14} />
      <Ebene fortschritt={fortschritt} src="/animation/03-fertig.webp" ein={[0.66, 0.82]} aus={[1, 1]} zoomVon={1.02} zoomBis={1.16} versatzX={10} />
      {/* dezente Staubschleier über der Übergangszone, kaschiert den Bruch zwischen den zwei Gebäuden */}
      <motion.div
        className="absolute inset-0 bg-white pointer-events-none"
        style={{ opacity: useTransform(fortschritt, [0.6, 0.72, 0.84], [0, 0.22, 0]) }}
      />
    </div>
  );
}
