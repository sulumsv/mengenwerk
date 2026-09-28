"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useSpring } from "motion/react";
import { boxen, schlitze, RAEUME, FARBE, PLAN_W, PLAN_H, m2, NUTZFLAECHE, TUERBOEGEN } from "./haus/plan";

// WebGL läuft nur im Browser; die Szene lädt ihre Modelle, während die ersten Kapitel gelesen werden.
const HausSzene = dynamic(() => import("./haus/HausSzene"), { ssr: false });

const KAPITEL = [
  {
    marke: "Beispielprojekt · EFH Neubau, NÖ",
    titel: "Ein Einreichplan.",
    text: "Das ist alles, was MengenWerk braucht — ein PDF aus dem CAD oder ein Scan.",
  },
  {
    marke: "Schritt 1 · Erkennung",
    titel: "Jeder Raum. Jede Öffnung.",
    text: `${RAEUME.length} Räume mit ${m2(NUTZFLAECHE)} m² Nutzfläche, 11 Fenster und 8 Türen — gelesen aus Raumstempeln und Plansymbolen.`,
  },
  {
    marke: "Schritt 2 · Rohbau",
    titel: "Aus Linien werden Mengen.",
    text: "Wandlängen × Schnitthöhe, abzüglich Öffnungen: 142,80 m² Mauerwerk, 34,20 m³ Beton — jede Zahl mit Rechenweg.",
  },
  {
    marke: "Schritt 3 · Ausbau",
    titel: "Putz, Fenster, Dach.",
    text: "226,5 m² Fassade über zwei Geschosse, 17 Fenster, 130,6 m² Flachdach mit Kiesbett und Attika — jedes Gewerk mit Menge und LB-HB-Position.",
  },
  {
    marke: "Das Ergebnis",
    titel: "Vom Plan zum Haus. 47 Positionen.",
    text: "Der vollständige Massenauszug nach LB-HB 023 — fertig zum Bepreisen, in Minuten statt Tagen.",
  },
];

// `statisch`: ohne Animation, für die Textur des Planblatts in der 3D-Szene
function Grundriss({ kapitel, statisch = false }: { kapitel: number; statisch?: boolean }) {
  const erkennung = kapitel === 1;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${PLAN_W} ${PLAN_H}`} width={PLAN_W} height={PLAN_H} className="absolute inset-0">
      <rect width={PLAN_W} height={PLAN_H} fill="#fdfcf9" />

      {RAEUME.map((r) => (
        <rect key={r.name} x={r.x} y={r.y} width={r.w} height={r.h} fill={r.fill} />
      ))}

      {boxen
        .filter((b) => b.k === 1)
        .map((b, i) => (
          <rect key={i} x={b.x} y={b.y} width={b.w} height={b.d} fill={FARBE.wand} />
        ))}

      {schlitze
        .filter((s) => s.art === "fenster")
        .map((s, i) => (
          <g key={i}>
            <rect x={s.x} y={s.y} width={s.w} height={s.d} fill="#fdfcf9" stroke={FARBE.wand} strokeWidth="0.8" />
            {[0.3, 0.5, 0.7].map((f) =>
              s.vertikal ? (
                <line key={f} x1={s.x + s.w * f} y1={s.y} x2={s.x + s.w * f} y2={s.y + s.d} stroke={FARBE.wand} strokeWidth="0.6" />
              ) : (
                <line key={f} x1={s.x} y1={s.y + s.d * f} x2={s.x + s.w} y2={s.y + s.d * f} stroke={FARBE.wand} strokeWidth="0.6" />
              ),
            )}
          </g>
        ))}

      {TUERBOEGEN.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={FARBE.wand} strokeWidth="0.7" />
      ))}

      {RAEUME.map((r) => (
        <g key={`l-${r.name}`}>
          <text x={r.x + r.w / 2} y={r.y + r.h / 2 - 3} textAnchor="middle" fill="#2b2824" fontFamily="Georgia, serif" fontStyle="italic" fontSize={r.w < 110 ? 8.5 : 10}>
            {r.name}
          </text>
          <text x={r.x + r.w / 2} y={r.y + r.h / 2 + 10} textAnchor="middle" fill="#4a463f" fontFamily="ui-monospace, monospace" fontSize="8">
            {m2(r.flaeche)} m²
          </text>
        </g>
      ))}

      {/* Maßketten */}
      <g stroke={FARBE.linie} strokeWidth="0.7" fill={FARBE.linie} fontFamily="ui-monospace, monospace" fontSize="8">
        <line x1="80" y1="20" x2="520" y2="20" />
        {[80, 120, 180, 210, 260, 330, 380, 450, 480, 520].map((x) => (
          <line key={x} x1={x - 3} y1="23" x2={x + 3} y2="17" />
        ))}
        <text x="300" y="14" textAnchor="middle" stroke="none">12,10</text>
        <line x1="56" y1="40" x2="56" y2="370" />
        {[40, 90, 150, 192, 226, 270, 330, 370].map((y) => (
          <line key={y} x1="53" y1={y + 3} x2="59" y2={y - 3} />
        ))}
        <text x="46" y="205" textAnchor="middle" stroke="none" transform="rotate(-90 46 205)">9,07</text>
      </g>

      {/* Nordpfeil */}
      <g transform="translate(556 60)">
        <circle r="13" fill="none" stroke={FARBE.linie} strokeWidth="0.8" />
        <path d="M0,-11 L4,5 L0,2 L-4,5 Z" fill={FARBE.wand} />
        <text y="-17" textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="8" fontWeight="bold" fill={FARBE.wand}>N</text>
      </g>

      <g fontFamily="ui-monospace, monospace" fontSize="7" fill={FARBE.linie} letterSpacing="0.6">
        <line x1="80" y1="392" x2="520" y2="392" stroke={FARBE.linie} strokeWidth="0.5" />
        <text x="80" y="404">EFH NEUBAU · GRUNDRISS EG · M 1:100 · EINREICHPLAN</text>
        <text x="520" y="404" textAnchor="end">BLATT 2/6</text>
      </g>

      {/* Erkennung: Räume und Öffnungen markieren */}
      {statisch && erkennung && (
        <g>
          {RAEUME.map((r) => (
            <rect key={r.name} x={r.x + 2} y={r.y + 2} width={r.w - 4} height={r.h - 4} fill="#b6e36b" fillOpacity="0.12" stroke="#8fbf45" strokeWidth="1.6" />
          ))}
          {schlitze.map((s, i) => (
            <circle key={i} cx={s.x + s.w / 2} cy={s.y + s.d / 2} r="9" fill="none" stroke={s.art === "fenster" ? "#2f5fd0" : "#8fbf45"} strokeWidth="1.6" />
          ))}
        </g>
      )}
      <AnimatePresence>
        {!statisch && erkennung && (
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
            {RAEUME.map((r, i) => (
              <motion.rect
                key={r.name}
                x={r.x + 2}
                y={r.y + 2}
                width={r.w - 4}
                height={r.h - 4}
                fill="#b6e36b"
                fillOpacity="0.12"
                stroke="#8fbf45"
                strokeWidth="1.6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.06, duration: 0.3 }}
              />
            ))}
            {schlitze.map((s, i) => (
              <motion.circle
                key={i}
                cx={s.x + s.w / 2}
                cy={s.y + s.d / 2}
                r="9"
                fill="none"
                stroke={s.art === "fenster" ? "#2f5fd0" : "#8fbf45"}
                strokeWidth="1.6"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 + i * 0.04, duration: 0.25 }}
              />
            ))}
          </motion.g>
        )}
      </AnimatePresence>
    </svg>
  );
}

export function PlanAnalyseSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [kapitel, setKapitel] = useState(0);
  const [fit, setFit] = useState(1);
  const [bereit, setBereit] = useState(false);
  const [planSvg, setPlanSvg] = useState<{ normal: string; markiert: string } | null>(null);
  const svgNormal = useRef<HTMLDivElement>(null);
  const svgMarkiert = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const lies = (el: HTMLDivElement | null) => (el?.firstElementChild ? new XMLSerializer().serializeToString(el.firstElementChild) : "");
    setPlanSvg({ normal: lies(svgNormal.current), markiert: lies(svgMarkiert.current) });
  }, []);

  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] });
  // Gedämpft wie eine Kamerafahrt: jeder Scroll-Ruck wird zu einer weichen Bewegung.
  const weich = useSpring(scrollYProgress, { stiffness: 55, damping: 20, mass: 0.7, restDelta: 0.0002 });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setKapitel(v < 0.12 ? 0 : v < 0.32 ? 1 : v < 0.56 ? 2 : v < 0.84 ? 3 : 4);
  });

  useEffect(() => {
    const anpassen = () =>
      setFit(Math.min(1.45, (window.innerWidth - 32) / PLAN_W, (window.innerHeight * 0.7) / PLAN_H));
    anpassen();
    window.addEventListener("resize", anpassen);
    return () => window.removeEventListener("resize", anpassen);
  }, []);

  const k = KAPITEL[kapitel];

  return (
    <section ref={containerRef} className="relative" style={{ height: "600vh" }}>
      <div
        className="sticky top-0 h-screen overflow-hidden"
        style={{
          backgroundColor: "#eef2f7",
          backgroundImage:
            "linear-gradient(rgba(18,27,48,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(18,27,48,0.05) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      >
        {/* Vorlagen für die Planblatt-Textur (unsichtbar) */}
        <div aria-hidden className="absolute -left-[9999px] top-0">
          <div ref={svgNormal}>
            <Grundriss kapitel={0} statisch />
          </div>
          <div ref={svgMarkiert}>
            <Grundriss kapitel={1} statisch />
          </div>
        </div>

        {/* Die 3D-Szene zeigt von Anfang an den Plan von oben; daraus wächst das Haus. */}
        <div className="absolute inset-0">
          {planSvg && <HausSzene fortschritt={weich} planSvg={planSvg} onBereit={() => setBereit(true)} />}
        </div>

        {/* 2D-Plan nur als Platzhalter, bis die 3D-Szene geladen ist */}
        <div
          className="absolute inset-0 flex items-center justify-center pb-40 md:pb-0 pointer-events-none"
          style={{ display: bereit ? "none" : undefined }}
        >
          <div style={{ width: PLAN_W * fit, height: PLAN_H * fit }}>
            <div style={{ width: PLAN_W, height: PLAN_H, transform: `scale(${fit})`, transformOrigin: "top left" }}>
              <div className="relative" style={{ width: PLAN_W, height: PLAN_H }}>
                <Grundriss kapitel={kapitel} />
              </div>
            </div>
          </div>
        </div>

        <div className="absolute left-4 right-4 bottom-4 md:left-10 md:right-auto md:bottom-10 md:w-[440px]">
          <div className="rounded-2xl bg-[#121b30]/95 text-white p-6 md:p-8 shadow-2xl backdrop-blur">
            <AnimatePresence mode="wait">
              <motion.div
                key={kapitel}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#b6e36b]">{k.marke}</p>
                <h3 className="mt-3 font-display font-black text-[clamp(1.8rem,3.4vw,2.6rem)] leading-[1.02] tracking-tight">
                  {k.titel}
                </h3>
                <p className="mt-3 text-sm md:text-[0.95rem] text-white/60 leading-relaxed">{k.text}</p>
                {kapitel === 4 && (
                  <div className="mt-6 flex gap-3 flex-wrap">
                    <a
                      href="/app"
                      className="rounded-lg bg-[#b6e36b] text-[#121b30] font-display font-black uppercase text-xs tracking-wide px-5 py-3 hover:brightness-105"
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
                <div key={i} className={`h-0.5 flex-1 rounded-full transition-colors duration-300 ${i <= kapitel ? "bg-[#b6e36b]" : "bg-white/15"}`} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
