"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useSpring } from "motion/react";

/**
 * Bauphasen vom Einreichplan bis zum fertigen Haus. Die Bilder teilen sich
 * (bis auf die Detailaufnahmen) dieselbe Kameraposition, deshalb wirkt das
 * Überblenden wie ein Zeitraffer, in dem das Haus Schritt für Schritt wächst.
 */
const BAUPHASEN = [
  "Einreichplan",
  "Fundament & Wände",
  "Wände wachsen",
  "Innenräume entstehen",
  "Böden & Rohbau",
  "Stahlbetondecke",
  "Dach & Beleuchtung",
  "Interieur",
  "Außenanlagen & Garten",
  "Pool",
  "Terrasse & Outdoor",
  "Beleuchtung außen",
  "Garage & Zufahrt",
  "Detailaufnahmen",
  "Terrasse & Pool",
  "Fertiges Traumhaus",
].map((titel, i) => ({ titel, src: `/animation/bauphasen/${String(i + 1).padStart(2, "0")}.jpg` }));

const KAPITEL = [
  {
    ab: 0,
    marke: "Beispielprojekt · EFH Neubau",
    titel: "Ein Einreichplan.",
    text: "Das ist alles, was MengenWerk braucht — ein PDF aus dem CAD oder ein Scan.",
  },
  {
    ab: 1,
    marke: "Schritt 1 · Rohbau",
    titel: "Aus Linien werden Wände.",
    text: "Wandlängen × Schnitthöhe, abzüglich Öffnungen: Mauerwerk und Beton mit sichtbarem Rechenweg.",
  },
  {
    ab: 5,
    marke: "Schritt 2 · Decke, Dach, Ausbau",
    titel: "Decke, Dach, Innenausbau.",
    text: "Stahlbetondecke, Flachdach, Estrich, Putz, Fliesen — jede Menge aus dem Plan abgeleitet.",
  },
  {
    ab: 8,
    marke: "Schritt 3 · Außenanlagen",
    titel: "Garten, Pool, Zufahrt.",
    text: "Erdarbeiten, Pflaster, Pool und Terrasse — auch die Außenanlagen landen im Massenauszug.",
  },
  {
    ab: 13,
    marke: "Das Ergebnis",
    titel: "Vom Plan zum Haus. 47 Positionen.",
    text: "Der vollständige Massenauszug nach LB-HB 023 — fertig zum Bepreisen, in Minuten statt Tagen.",
  },
];

const glatt = (v: number) => v * v * (3 - 2 * v);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export function PlanAnalyseSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const buehne = useRef<HTMLDivElement>(null);
  // Segment: das Bild, über das gerade das nächste geblendet wird. Bild: die angezeigte Bauphase.
  const [segment, setSegment] = useState(0);
  const [bild, setBild] = useState(0);

  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] });
  // Gedämpft wie eine Kamerafahrt: jeder Scroll-Ruck wird zu einer weichen Bewegung.
  const weich = useSpring(scrollYProgress, { stiffness: 60, damping: 20, mass: 0.6, restDelta: 0.0002 });

  // Überblendung und Zoom laufen über CSS-Variablen, ohne React bei jedem Frame neu zu rendern.
  useMotionValueEvent(weich, "change", (p) => {
    const f = clamp01(p) * (BAUPHASEN.length - 1);
    const i = Math.min(BAUPHASEN.length - 2, Math.floor(f));
    // Jedes Bild steht eine Weile, dann blendet das nächste darüber
    const blende = glatt(clamp01((f - i - 0.35) / 0.65));
    buehne.current?.style.setProperty("--blende", String(blende));
    buehne.current?.style.setProperty("--zoom", String(1.02 + 0.1 * clamp01(p)));
    setSegment(i);
    setBild(blende > 0.5 ? i + 1 : i);
  });

  // Alle Bilder vorab laden, damit beim Scrollen nichts nachlädt
  useEffect(() => {
    for (const b of BAUPHASEN) {
      const img = new Image();
      img.src = b.src;
    }
  }, []);

  const kapitelIndex = KAPITEL.findLastIndex((k) => bild >= k.ab);
  const k = KAPITEL[kapitelIndex];

  return (
    <section ref={containerRef} className="relative" style={{ height: "800vh" }}>
      <div className="sticky top-0 h-screen overflow-hidden bg-[#0c0c0b]">
        <div
          ref={buehne}
          className="absolute inset-0"
          style={{
            ["--blende" as string]: "0",
            ["--zoom" as string]: "1.02",
            transform: "scale(var(--zoom))",
            willChange: "transform",
          }}
        >
          {/* Nur das aktuelle und das nächste Bild liegen im DOM: spart Grafikspeicher auf Tablets */}
          {BAUPHASEN.map((b, i) =>
            i === segment || i === segment + 1 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={b.src}
                src={b.src}
                alt={b.titel}
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover"
                style={{ opacity: i === segment ? 1 : "var(--blende)" }}
              />
            ) : null,
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none" />

        <div className="absolute top-6 left-4 md:top-8 md:left-10 flex items-center gap-2.5 rounded-full bg-black/45 backdrop-blur px-4 py-2 border border-white/10">
          <span className="w-1.5 h-1.5 rounded-full bg-[#f4c400]" />
          <span className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.18em] text-white/80">
            Bauphase {bild + 1}/{BAUPHASEN.length} · {BAUPHASEN[bild].titel}
          </span>
        </div>

        <div className="absolute left-4 right-4 bottom-4 md:left-10 md:right-auto md:bottom-10 md:w-[440px]">
          <div className="rounded-2xl bg-[#14130f]/90 text-white p-6 md:p-8 shadow-2xl backdrop-blur">
            <AnimatePresence mode="wait">
              <motion.div
                key={kapitelIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#f4c400]">{k.marke}</p>
                <h3 className="mt-3 font-display font-black text-[clamp(1.8rem,3.4vw,2.6rem)] leading-[1.02] tracking-tight">
                  {k.titel}
                </h3>
                <p className="mt-3 text-sm md:text-[0.95rem] text-white/60 leading-relaxed">{k.text}</p>
                {kapitelIndex === KAPITEL.length - 1 && (
                  <div className="mt-6 flex gap-3 flex-wrap">
                    <a
                      href="/app"
                      className="rounded-lg bg-[#f4c400] text-[#14130f] font-display font-black uppercase text-xs tracking-wide px-5 py-3 hover:brightness-105"
                    >
                      Eigenen Plan analysieren →
                    </a>
                    <a
                      href="/vorschau"
                      className="rounded-lg border border-white/20 text-white/70 font-mono text-[11px] uppercase tracking-widest px-5 py-3 hover:border-white/40"
                    >
                      Auszug ansehen
                    </a>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
            <div className="mt-6 flex gap-1.5">
              {KAPITEL.map((_, i) => (
                <div
                  key={i}
                  className={`h-0.5 flex-1 rounded-full transition-colors duration-300 ${i <= kapitelIndex ? "bg-[#f4c400]" : "bg-white/15"}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
