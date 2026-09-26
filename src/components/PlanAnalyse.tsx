"use client";

import { useRef, useState } from "react";
import { motion, useScroll, useTransform, useMotionValueEvent } from "motion/react";

// ─── Farben wie echte österreichische Einreichpläne ─────────────────────────
const C = {
  wohnraum: "#f9e4d0",   // Wohn-/Schlaf-/Kinderzimmer: warmes Lachs
  nassraum: "#c8e8ed",   // Bad, WC: kühles Türkis
  nebenraum: "#e8e4dc",  // Flur, HWR, Abstellraum: neutrales Grau-Beige
  garage:   "#f5d8a0",   // Garage/Carport: Gelb-Orange
  wand:     "#2a2724",   // Wandfarbe: fast Schwarz (wie gedruckt)
  massline: "#555",      // Maßketten
  massbg:   "#f7f6f1",   // Plan-Hintergrund
};

// ─── Grundriss-Geometrie ─────────────────────────────────────────────────────
// Viewbox: 0 0 560 400  — EFH ca. 14m × 9m, Maßstab 1:50 ~ 36px/m
const W = 12; // Wandstärke Außenwand px
const IW = 8; // Innenwand px

// Räume: { id, x, y, w, h, name, flaeche, fill }
// Koordinaten = Innenmaß des Raums
const RAEUME = [
  { id: "wohnzimmer", x: 94,  y: 48,  w: 195, h: 160, name: "Wohnzimmer",   flaeche: "28,4",  fill: C.wohnraum },
  { id: "kueche",     x: 289, y: 48,  w: 140, h: 90,  name: "Küche",        flaeche: "14,2",  fill: C.wohnraum },
  { id: "abst",       x: 429, y: 48,  w: 89,  h: 90,  name: "Abstell",      flaeche: "5,8",   fill: C.nebenraum },
  { id: "bad",        x: 289, y: 136, w: 140, h: 72,  name: "Badezimmer",   flaeche: "9,8",   fill: C.nassraum },
  { id: "wc",         x: 429, y: 136, w: 89,  h: 72,  name: "WC",           flaeche: "3,6",   fill: C.nassraum },
  { id: "flur",       x: 94,  y: 208, w: 424, h: 44,  name: "Flur / Gang",  flaeche: "12,2",  fill: C.nebenraum },
  { id: "schlaf1",    x: 94,  y: 252, w: 195, h: 100, name: "Schlafzimmer", flaeche: "18,9",  fill: C.wohnraum },
  { id: "schlaf2",    x: 289, y: 252, w: 160, h: 100, name: "Kinderzimmer", flaeche: "16,4",  fill: C.wohnraum },
  { id: "hwr",        x: 449, y: 252, w: 69,  h: 100, name: "HWR",          flaeche: "4,2",   fill: C.nebenraum },
];

// Außenmaß des Gebäudes (px)
const GEB = { x: 82, y: 36, w: 436, h: 316 };

// Fenster: { x, y, w } – eingebaute Nische in Wand
const FENSTER = [
  { x: 120, y: 36, w: 55 },   // Wohnzimmer Nord
  { x: 200, y: 36, w: 55 },   // Wohnzimmer Nord
  { x: 310, y: 36, w: 45 },   // Küche Nord
  { x: 82,  y: 80, w: 0, h: 40, vert: true },  // Wohnzimmer West
  { x: 82,  y: 270, w: 0, h: 40, vert: true }, // Schlafzimmer West
  { x: 180, y: 352, w: 50 },  // Schlaf Süd
  { x: 310, y: 352, w: 50 },  // Kinderzimmer Süd
  { x: 518, y: 90, w: 0, h: 35, vert: true },  // Abst Ost
  { x: 518, y: 270, w: 0, h: 35, vert: true }, // HWR Ost
];

// Türen: { x, y, size, rot } – Drehpunkt + Bogen-Winkel
const TUEREN = [
  { cx: 289, cy: 175, r: 30, fromDeg: 90,  toDeg: 0   }, // Bad links
  { cx: 429, cy: 175, r: 28, fromDeg: 90,  toDeg: 180 }, // WC links
  { cx: 140, cy: 208, r: 30, fromDeg: 270, toDeg: 180 }, // Wohnzimmer → Flur
  { cx: 145, cy: 252, r: 30, fromDeg: 90,  toDeg: 0   }, // Schlafzimmer → Flur
  { cx: 310, cy: 252, r: 30, fromDeg: 90,  toDeg: 180 }, // Kinderzimmer → Flur
  { cx: 449, cy: 252, r: 28, fromDeg: 90,  toDeg: 0   }, // HWR → Flur
  { cx: 200, cy: 208, r: 30, fromDeg: 270, toDeg: 360 }, // Eingang
];

function doorArc(cx: number, cy: number, r: number, fromDeg: number, toDeg: number) {
  const f = (fromDeg * Math.PI) / 180;
  const t = (toDeg * Math.PI) / 180;
  const x1 = cx + r * Math.cos(f);
  const y1 = cy + r * Math.sin(f);
  const x2 = cx + r * Math.cos(t);
  const y2 = cy + r * Math.sin(t);
  const large = Math.abs(toDeg - fromDeg) > 180 ? 1 : 0;
  const sweep = toDeg > fromDeg ? 1 : 0;
  return `M ${cx},${cy} L ${x1},${y1} A ${r},${r} 0 ${large} ${sweep} ${x2},${y2} Z`;
}

// ─── Analyse-Phasen ──────────────────────────────────────────────────────────
const PHASEN = [
  {
    trigger: 0.15,
    highlight: ["wohnzimmer", "schlaf1", "schlaf2"],
    label: "Räume erkannt",
    ergebnis: { pos: "LG 10 / 11", text: "Putz + Estrich", menge: "298,6 m²", icon: "▦" },
  },
  {
    trigger: 0.35,
    highlight: ["bad", "wc"],
    label: "Nassräume erkannt",
    ergebnis: { pos: "LG 24", text: "Fliesenbelag Bad + WC", menge: "13,4 m²", icon: "▦" },
  },
  {
    trigger: 0.55,
    highlight: [],
    label: "Fenster + Türen erkannt",
    ergebnis: { pos: "LG 71 / 43", text: "Fenster (7 Stk.) + Türen (7 Stk.)", menge: "14 Stk.", icon: "⬚" },
  },
  {
    trigger: 0.72,
    highlight: [],
    label: "Außenwände ausgemessen",
    ergebnis: { pos: "LG 08", text: "Mauerwerk Außenwand 30cm", menge: "142,8 m²", icon: "▤" },
  },
  {
    trigger: 0.86,
    highlight: [],
    label: "Massenauszug fertig",
    ergebnis: { pos: "LG 07", text: "Stahlbeton Bodenplatte C25/30", menge: "34,2 m³", icon: "■" },
  },
];

export function PlanAnalyseSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const [phase, setPhase] = useState(-1);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    let p = -1;
    for (let i = PHASEN.length - 1; i >= 0; i--) {
      if (v >= PHASEN[i].trigger) { p = i; break; }
    }
    setPhase(p);
  });

  const planOpacity = useTransform(scrollYProgress, [0, 0.08], [0, 1]);
  const overlayOpacity = useTransform(scrollYProgress, [0.08, 0.18], [0, 1]);
  const outputOpacity = useTransform(scrollYProgress, [0.12, 0.22], [0, 1]);

  const activeRooms = phase >= 0 ? PHASEN[phase].highlight : [];
  const visibleResults = PHASEN.slice(0, phase + 1);

  return (
    <section ref={containerRef} className="relative" style={{ height: "380vh" }}>
      <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden bg-[#0c0c0b]">

        {/* Status-Label oben */}
        <motion.div
          className="absolute top-8 left-1/2 -translate-x-1/2 z-10"
          style={{ opacity: overlayOpacity }}
        >
          <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-full px-5 py-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#f4c400] animate-pulse" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/50">
              {phase >= 0 ? PHASEN[phase].label : "Plan wird analysiert …"}
            </span>
          </div>
        </motion.div>

        <div className="w-full max-w-6xl mx-auto px-6 grid grid-cols-[1fr_320px] gap-8 items-center">

          {/* ── GRUNDRISS ── */}
          <motion.div style={{ opacity: planOpacity }} className="relative">
            <svg
              viewBox="0 0 600 390"
              className="w-full max-w-[620px] mx-auto drop-shadow-2xl"
              style={{ filter: "drop-shadow(0 20px 60px rgba(0,0,0,0.5))" }}
            >
              {/* Hintergrund wie echtes Papier */}
              <rect width="600" height="390" fill={C.massbg} />

              {/* Maßketten-Hintergrund */}
              <rect width="600" height="390" fill="white" opacity="0.6" />

              {/* Titelblock unten */}
              <line x1="82" y1="362" x2="518" y2="362" stroke={C.massline} strokeWidth="0.5" />
              <text x="86" y="375" fill={C.massline} fontFamily="monospace" fontSize="7" letterSpacing="0.5">
                EFH NEUBAU · GRUNDRISS EG · M 1:50 · PROJEKT-NR. 2025-047
              </text>
              <text x="500" y="375" fill={C.massline} fontFamily="monospace" fontSize="7" textAnchor="end" letterSpacing="0.5">
                BLATT 3/8
              </text>

              {/* Maßkette horizontal oben */}
              <line x1="82" y1="16" x2="518" y2="16" stroke={C.massline} strokeWidth="0.8" />
              <line x1="82" y1="12" x2="82" y2="20" stroke={C.massline} strokeWidth="0.8" />
              <line x1="518" y1="12" x2="518" y2="20" stroke={C.massline} strokeWidth="0.8" />
              <text x="300" y="13" fill={C.massline} fontFamily="monospace" fontSize="8" textAnchor="middle">
                12,10 m
              </text>

              {/* Maßkette vertikal links */}
              <line x1="60" y1="36" x2="60" y2="352" stroke={C.massline} strokeWidth="0.8" />
              <line x1="56" y1="36" x2="64" y2="36" stroke={C.massline} strokeWidth="0.8" />
              <line x1="56" y1="352" x2="64" y2="352" stroke={C.massline} strokeWidth="0.8" />
              <text
                x="50" y="194"
                fill={C.massline}
                fontFamily="monospace"
                fontSize="8"
                textAnchor="middle"
                transform="rotate(-90 50 194)"
              >
                8,80 m
              </text>

              {/* Raumfüllungen */}
              {RAEUME.map((r) => (
                <motion.rect
                  key={r.id}
                  x={r.x} y={r.y} width={r.w} height={r.h}
                  fill={r.fill}
                  animate={{
                    opacity: activeRooms.length === 0 || activeRooms.includes(r.id) ? 1 : 0.35,
                  }}
                  transition={{ duration: 0.4 }}
                />
              ))}

              {/* Außenwände (Füllung) */}
              <path
                d={`M ${GEB.x},${GEB.y} h ${GEB.w} v ${GEB.h} h -${GEB.w} Z
                    M ${GEB.x + W},${GEB.y + W} h ${GEB.w - 2 * W} v ${GEB.h - 2 * W} h -${GEB.w - 2 * W} Z`}
                fill={C.wand}
                fillRule="evenodd"
              />

              {/* Innenwände horizontal */}
              {/* Trennwand zwischen OG und UG (Flur-Linie) */}
              <rect x={GEB.x + W} y={208} width={GEB.w - 2 * W} height={IW} fill={C.wand} />
              {/* Wand über Bad/WC */}
              <rect x={289} y={GEB.y + W} width={IW} height={160} fill={C.wand} />
              {/* Trennwand Bad | WC */}
              <rect x={429} y={GEB.y + W} width={IW} height={172} fill={C.wand} />
              {/* Trennwand Küche | Abstellraum */}
              <rect x={429} y={GEB.y + W} width={0} height={90} fill={C.wand} />
              <rect x={289} y={136} width={140 + IW} height={IW} fill={C.wand} />
              {/* Trennwand Schlaf 1 | 2 */}
              <rect x={289} y={208 + IW} width={IW} height={144} fill={C.wand} />
              {/* Trennwand Schlaf 2 | HWR */}
              <rect x={449} y={208 + IW} width={IW} height={144} fill={C.wand} />

              {/* Fensterschlitze (weiß über Wand) */}
              {FENSTER.map((f, i) =>
                f.vert ? (
                  <rect key={i} x={f.x! - 1} y={f.y} width={W + 2} height={f.h} fill="white" />
                ) : (
                  <rect key={i} x={f.x} y={f.y! - 1} width={f.w} height={W + 2} fill="white" />
                )
              )}

              {/* Fenstersymbol (3 Linien) */}
              {FENSTER.map((f, i) =>
                f.vert ? (
                  <g key={`fs-${i}`}>
                    <line x1={f.x! + 2} y1={f.y + 2} x2={f.x! + 2} y2={f.y + f.h! - 2} stroke={C.wand} strokeWidth="0.8" />
                    <line x1={f.x! + 5} y1={f.y + 2} x2={f.x! + 5} y2={f.y + f.h! - 2} stroke={C.wand} strokeWidth="0.8" />
                    <line x1={f.x! + 8} y1={f.y + 2} x2={f.x! + 8} y2={f.y + f.h! - 2} stroke={C.wand} strokeWidth="0.8" />
                  </g>
                ) : (
                  <g key={`fs-${i}`}>
                    <line x1={f.x + 2} y1={f.y + 2} x2={f.x + f.w - 2} y2={f.y + 2} stroke={C.wand} strokeWidth="0.8" />
                    <line x1={f.x + 2} y1={f.y + 5} x2={f.x + f.w - 2} y2={f.y + 5} stroke={C.wand} strokeWidth="0.8" />
                    <line x1={f.x + 2} y1={f.y + 8} x2={f.x + f.w - 2} y2={f.y + 8} stroke={C.wand} strokeWidth="0.8" />
                  </g>
                )
              )}

              {/* Türbögen */}
              {TUEREN.map((t, i) => (
                <path
                  key={`tuer-${i}`}
                  d={doorArc(t.cx, t.cy, t.r, t.fromDeg, t.toDeg)}
                  fill="white"
                  fillOpacity="0.7"
                  stroke={C.wand}
                  strokeWidth="0.6"
                />
              ))}

              {/* Raumstempel (Name + Fläche) */}
              {RAEUME.map((r) => (
                <motion.g
                  key={`label-${r.id}`}
                  animate={{ opacity: activeRooms.length === 0 || activeRooms.includes(r.id) ? 1 : 0.25 }}
                  transition={{ duration: 0.4 }}
                >
                  <text
                    x={r.x + r.w / 2}
                    y={r.y + r.h / 2 - 5}
                    textAnchor="middle"
                    fill="#333"
                    fontFamily="Georgia, serif"
                    fontSize={r.w < 80 ? "7" : "9"}
                    fontStyle="italic"
                  >
                    {r.name}
                  </text>
                  <text
                    x={r.x + r.w / 2}
                    y={r.y + r.h / 2 + 9}
                    textAnchor="middle"
                    fill="#555"
                    fontFamily="monospace"
                    fontSize="8"
                  >
                    {r.flaeche} m²
                  </text>
                </motion.g>
              ))}

              {/* Highlight-Ringe bei aktiven Räumen */}
              {RAEUME.filter((r) => activeRooms.includes(r.id)).map((r) => (
                <motion.rect
                  key={`hl-${r.id}`}
                  x={r.x - 3} y={r.y - 3}
                  width={r.w + 6} height={r.h + 6}
                  fill="none"
                  stroke="#f4c400"
                  strokeWidth="2.5"
                  rx="2"
                  initial={{ opacity: 0, strokeDashoffset: 500 }}
                  animate={{ opacity: 1, strokeDashoffset: 0 }}
                  style={{ strokeDasharray: 500 }}
                  transition={{ duration: 0.6 }}
                />
              ))}

              {/* Fenster-Highlight wenn Phase 2 */}
              {phase >= 2 && FENSTER.map((f, i) => (
                <motion.circle
                  key={`fhl-${i}`}
                  cx={f.vert ? f.x! + 5 : f.x + f.w / 2}
                  cy={f.vert ? f.y + f.h! / 2 : f.y + 5}
                  r="12"
                  fill="#f4c400"
                  fillOpacity="0.15"
                  stroke="#f4c400"
                  strokeWidth="1.5"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.08, duration: 0.3 }}
                />
              ))}

              {/* Nordpfeil */}
              <g transform="translate(556 56)">
                <circle cx="0" cy="0" r="14" fill="none" stroke={C.massline} strokeWidth="0.8" />
                <text x="0" y="-18" textAnchor="middle" fill={C.massline} fontFamily="monospace" fontSize="9" fontWeight="bold">N</text>
                <path d="M 0,-12 L 4,4 L 0,1 L -4,4 Z" fill={C.wand} />
              </g>
            </svg>
          </motion.div>

          {/* ── ANALYSE-OUTPUT ── */}
          <motion.div style={{ opacity: outputOpacity }} className="space-y-3">
            <div className="mb-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/30 mb-1">Massenauszug</p>
              <p className="font-display font-bold text-white text-lg leading-tight">
                {phase < PHASEN.length - 1 ? "Positionen werden erkannt …" : "Massenauszug vollständig"}
              </p>
            </div>

            {/* Erkannte Positionen */}
            <div className="space-y-2">
              {visibleResults.map((p, i) => (
                <motion.div
                  key={i}
                  className="rounded-xl border border-white/10 bg-white/[0.04] p-4"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="font-mono text-[10px] text-[#f4c400]/70 uppercase tracking-wide">
                      {p.ergebnis.pos}
                    </span>
                    <span className="font-mono text-[11px] text-white/70 tabular-nums shrink-0">
                      {p.ergebnis.menge}
                    </span>
                  </div>
                  <p className="font-mono text-[11px] text-white/50 leading-snug">{p.ergebnis.text}</p>
                </motion.div>
              ))}
            </div>

            {/* Fortschrittsanzeige */}
            <div className="pt-2">
              <div className="flex justify-between mb-2">
                <span className="font-mono text-[10px] text-white/25 uppercase tracking-wide">Fortschritt</span>
                <span className="font-mono text-[10px] text-white/40">
                  {phase + 1} / {PHASEN.length} Gewerke
                </span>
              </div>
              <div className="h-px bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-[#f4c400] origin-left"
                  animate={{ scaleX: phase < 0 ? 0 : (phase + 1) / PHASEN.length }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            {/* CTA wenn fertig */}
            {phase >= PHASEN.length - 1 && (
              <motion.div
                className="pt-3"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <a
                  href="/app"
                  className="flex items-center justify-center gap-2 w-full rounded-lg bg-[#f4c400] text-[#0c0c0b] font-display font-black uppercase tracking-wide text-sm py-3.5 hover:brightness-105 transition-all"
                >
                  Eigenen Plan analysieren →
                </a>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Scroll-Indikator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <div className="w-36 h-px bg-white/10">
            <motion.div className="h-full bg-[#f4c400]/50 origin-left" style={{ scaleX: scrollYProgress }} />
          </div>
        </div>
      </div>
    </section>
  );
}
