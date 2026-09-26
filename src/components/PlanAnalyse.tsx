"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
} from "motion/react";

// Plan-Einheiten: 440 Einheiten = 12,10 m Außenmaß.
const PX_M = 440 / 12.1;
const PLAN_W = 600;
const PLAN_H = 420;

const FARBE = {
  wohn: "#f6d5bf",
  nass: "#bfe0e6",
  neben: "#e6e1d6",
  wand: "#2f2b27",
  linie: "#5b5750",
};

type Oeffnung = [number, number, "fenster" | "tuer"];
type Box = { x: number; y: number; w: number; d: number; k: number; z0: number; aussen: boolean };
type Schlitz = { x: number; y: number; w: number; d: number; art: "fenster" | "tuer"; vertikal: boolean };

const boxen: Box[] = [];
const schlitze: Schlitz[] = [];

function wand(
  vertikal: boolean,
  fest: number,
  von: number,
  bis: number,
  t: number,
  oeffnungen: Oeffnung[],
  aussen: boolean,
) {
  const rect = (a: number, b: number, k: number, z0: number) =>
    boxen.push(
      vertikal
        ? { x: fest, y: a, w: t, d: b - a, k, z0, aussen }
        : { x: a, y: fest, w: b - a, d: t, k, z0, aussen },
    );
  let lauf = von;
  for (const [a, b, art] of oeffnungen) {
    rect(lauf, a, 1, 0);
    if (art === "fenster") rect(a, b, 0.36, 0);
    rect(a, b, art === "fenster" ? 0.2 : 0.16, art === "fenster" ? 0.8 : 0.84);
    schlitze.push(
      vertikal
        ? { x: fest, y: a, w: t, d: b - a, art, vertikal }
        : { x: a, y: fest, w: b - a, d: t, art, vertikal },
    );
    lauf = b;
  }
  rect(lauf, bis, 1, 0);
}

// Außenwände 30 cm
wand(false, 40, 80, 520, 12, [[120, 180, "fenster"], [210, 260, "fenster"], [330, 380, "fenster"], [450, 480, "fenster"]], true);
wand(false, 358, 80, 520, 12, [[130, 200, "fenster"], [300, 360, "fenster"]], true);
wand(true, 80, 52, 358, 12, [[90, 150, "fenster"], [192, 226, "tuer"], [270, 330, "fenster"]], true);
wand(true, 508, 52, 358, 12, [[100, 140, "fenster"], [310, 340, "fenster"]], true);
// Innenwände
wand(false, 180, 92, 508, 7, [[200, 230, "tuer"], [330, 358, "tuer"], [440, 466, "tuer"]], false);
wand(false, 230, 92, 508, 7, [[150, 178, "tuer"], [300, 328, "tuer"]], false);
wand(true, 290, 52, 180, 7, [], false);
wand(true, 410, 52, 180, 7, [], false);
wand(true, 250, 237, 358, 7, [], false);
wand(true, 400, 237, 358, 7, [[250, 275, "tuer"], [310, 336, "tuer"]], false);
wand(false, 290, 407, 508, 7, [], false);

const RAEUME = [
  { name: "Wohnen / Essen", x: 92, y: 52, w: 198, h: 128, fill: FARBE.wohn },
  { name: "Küche", x: 297, y: 52, w: 113, h: 128, fill: FARBE.wohn },
  { name: "Bad", x: 417, y: 52, w: 91, h: 128, fill: FARBE.nass },
  { name: "Vorraum / Gang", x: 92, y: 187, w: 416, h: 43, fill: FARBE.neben },
  { name: "Schlafen", x: 92, y: 237, w: 158, h: 121, fill: FARBE.wohn },
  { name: "Kind", x: 257, y: 237, w: 143, h: 121, fill: FARBE.wohn },
  { name: "WC", x: 407, y: 237, w: 101, h: 53, fill: FARBE.nass },
  { name: "HWR", x: 407, y: 297, w: 101, h: 61, fill: FARBE.neben },
].map((r) => ({ ...r, flaeche: (r.w / PX_M) * (r.h / PX_M) }));

const m2 = (n: number) => n.toLocaleString("de-AT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const NUTZFLAECHE = RAEUME.reduce((s, r) => s + r.flaeche, 0);

const harc = (a: number, b: number, y: number, dir: 1 | -1) => {
  const r = b - a;
  return `M${a},${y} L${a},${y + dir * r} A${r},${r} 0 0 ${dir > 0 ? 0 : 1} ${b},${y}`;
};
const varc = (a: number, b: number, x: number, dir: 1 | -1) => {
  const r = b - a;
  return `M${x},${a} L${x + dir * r},${a} A${r},${r} 0 0 ${dir > 0 ? 1 : 0} ${x},${b}`;
};
const TUERBOEGEN = [
  harc(200, 230, 180, -1),
  harc(330, 358, 180, -1),
  harc(440, 466, 180, -1),
  harc(150, 178, 237, 1),
  harc(300, 328, 237, 1),
  varc(250, 275, 407, 1),
  varc(310, 336, 407, 1),
  varc(192, 226, 92, 1),
];

const FOTOS = [
  { src: "/animation/rohbau.jpg", alt: "Ziegel-Rohbau eines eingeschossigen Hauses", deckung: "--f1", zoom: "--k1", lage: "center 72%" },
  { src: "/animation/fertig.jpg", alt: "Fertiges Einfamilienhaus mit Rasen und Baum", deckung: "--f2", zoom: "--k2", lage: "68% 60%" },
];

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
    marke: "Schritt 2 · Kubatur",
    titel: "Aus Linien werden Wände.",
    text: "Wandlängen × Schnitthöhe, abzüglich Öffnungen — jede Zahl mit sichtbarem Rechenweg.",
  },
  {
    marke: "Schritt 3 · Rohbau",
    titel: "Mengen, die auf der Baustelle stimmen.",
    text: "142,80 m² Mauerwerk, 34,20 m³ Beton, 11 Fensteröffnungen — so gerechnet, wie gebaut wird.",
  },
  {
    marke: "Das Ergebnis",
    titel: "Vom Plan zum fertigen Haus.",
    text: "47 Positionen in 12 Gewerken nach LB-HB 023 — fertig zum Bepreisen, in Minuten statt Tagen.",
  },
];

function Wandbox({ b }: { b: Box }) {
  const hoehe = `calc(var(--h) * ${b.k})`;
  const ns = b.aussen
    ? "repeating-linear-gradient(0deg, #bf7654 0 5px, #ead9c6 5px 6px)"
    : "linear-gradient(#efe9df, #e2dacd)";
  const ow = b.aussen
    ? "repeating-linear-gradient(90deg, #a5603f 0 5px, #d9c5b0 5px 6px)"
    : "linear-gradient(90deg, #d6cdbf, #c9bfb0)";
  const flaeche: CSSProperties = { position: "absolute", backfaceVisibility: "visible" };
  return (
    <div
      style={{
        position: "absolute",
        left: b.x,
        top: b.y,
        width: b.w,
        height: b.d,
        transformStyle: "preserve-3d",
        transform: `translateZ(calc(var(--h) * ${b.z0}))`,
      }}
    >
      <div style={{ ...flaeche, left: 0, top: 0, width: b.w, height: hoehe, background: ns, transformOrigin: "top", transform: "rotateX(90deg)" }} />
      <div style={{ ...flaeche, left: 0, top: b.d, width: b.w, height: hoehe, background: ns, transformOrigin: "top", transform: "rotateX(90deg)" }} />
      <div style={{ ...flaeche, left: 0, top: 0, width: hoehe, height: b.d, background: ow, transformOrigin: "left", transform: "rotateY(-90deg)" }} />
      <div style={{ ...flaeche, left: b.w, top: 0, width: hoehe, height: b.d, background: ow, transformOrigin: "left", transform: "rotateY(-90deg)" }} />
      <div style={{ ...flaeche, inset: 0, background: FARBE.wand, transform: `translateZ(${hoehe})` }}>
        <div style={{ position: "absolute", inset: 0, opacity: "var(--t)", background: b.aussen ? "#d49a7b" : "#ece5da" }} />
      </div>
    </div>
  );
}


function Grundriss({ kapitel }: { kapitel: number }) {
  const erkennung = kapitel === 1;
  return (
    <svg viewBox={`0 0 ${PLAN_W} ${PLAN_H}`} width={PLAN_W} height={PLAN_H} className="absolute inset-0">
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
      <AnimatePresence>
        {erkennung && (
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
            {RAEUME.map((r, i) => (
              <motion.rect
                key={r.name}
                x={r.x + 2}
                y={r.y + 2}
                width={r.w - 4}
                height={r.h - 4}
                fill="#f4c400"
                fillOpacity="0.12"
                stroke="#d9a900"
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
                stroke={s.art === "fenster" ? "#1f7a33" : "#d9a900"}
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
  const rootRef = useRef<HTMLDivElement>(null);
  const [kapitel, setKapitel] = useState(0);
  const [fit, setFit] = useState(1);

  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] });

  const rotateX = useTransform(scrollYProgress, [0.12, 0.34], [0, 56]);
  const rotateZ = useTransform(scrollYProgress, [0.12, 0.34, 1], [0, -36, -52]);
  const scale = useTransform(scrollYProgress, [0.12, 0.34, 0.58, 1], [1, 0.95, 0.9, 0.78]);
  const y = useTransform(scrollYProgress, [0.12, 0.34, 1], [0, 40, 70]);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const el = rootRef.current;
    if (el) {
      const lerp = (a: number, b: number) => Math.min(1, Math.max(0, (v - a) / (b - a)));
      const h = lerp(0.34, 0.54) * 74;
      el.style.setProperty("--h", `${h}px`);
      el.style.setProperty("--t", `${Math.min(1, h / 20)}`);
      el.style.setProperty("--f1", `${lerp(0.52, 0.6)}`);
      el.style.setProperty("--k1", `${1.14 - 0.14 * lerp(0.52, 0.8)}`);
      el.style.setProperty("--f2", `${lerp(0.76, 0.84)}`);
      el.style.setProperty("--k2", `${1.16 - 0.16 * lerp(0.76, 1)}`);
    }
    setKapitel(v < 0.12 ? 0 : v < 0.32 ? 1 : v < 0.54 ? 2 : v < 0.78 ? 3 : 4);
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
        ref={rootRef}
        className="sticky top-0 h-screen overflow-hidden"
        style={{
          backgroundColor: "#eeece5",
          backgroundImage:
            "linear-gradient(rgba(20,19,15,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(20,19,15,0.05) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          ["--h" as string]: "0px",
          ["--t" as string]: "0",
          ["--f1" as string]: "0",
          ["--k1" as string]: "1.14",
          ["--f2" as string]: "0",
          ["--k2" as string]: "1.16",
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center md:justify-end md:pr-[6vw] pb-40 md:pb-0">
          <div style={{ width: PLAN_W * fit, height: PLAN_H * fit }}>
            <div style={{ width: PLAN_W, height: PLAN_H, transform: `scale(${fit})`, transformOrigin: "top left" }}>
              <motion.div
                className="relative"
                style={{
                  width: PLAN_W,
                  height: PLAN_H,
                  transformStyle: "preserve-3d",
                  transformPerspective: 1600,
                  rotateX,
                  rotateZ,
                  scale,
                  y,
                }}
              >
                <Grundriss kapitel={kapitel} />
                {boxen.map((b, i) => (
                  <Wandbox key={i} b={b} />
                ))}

              </motion.div>
            </div>
          </div>
        </div>

        {FOTOS.map((f) => (
          <div key={f.src} className="absolute inset-0 overflow-hidden" style={{ opacity: `var(${f.deckung})` }}>
            <div className="absolute inset-0" style={{ transform: `scale(var(${f.zoom}))`, willChange: "transform" }}>
              <Image src={f.src} alt={f.alt} fill sizes="100vw" className="object-cover" style={{ objectPosition: f.lage }} />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
          </div>
        ))}

        <div className="absolute left-4 right-4 bottom-4 md:left-10 md:right-auto md:bottom-10 md:w-[440px]">
          <div className="rounded-2xl bg-[#14130f]/95 text-white p-6 md:p-8 shadow-2xl backdrop-blur">
            <AnimatePresence mode="wait">
              <motion.div
                key={kapitel}
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
                {kapitel === 4 && (
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
                <div key={i} className={`h-0.5 flex-1 rounded-full transition-colors duration-300 ${i <= kapitel ? "bg-[#f4c400]" : "bg-white/15"}`} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
