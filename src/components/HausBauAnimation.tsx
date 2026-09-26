"use client";

import { useRef, useState } from "react";
import { motion, useScroll, useTransform, useMotionValueEvent } from "motion/react";

const RAEUME = [
  { id: "wohnen", label: "Wohnzimmer", flaeche: "28.4 m²", x: 40, y: 40, w: 200, h: 160, fill: "#4f9cf9" },
  { id: "kueche", label: "Küche", flaeche: "14.2 m²", x: 240, y: 40, w: 120, h: 100, fill: "#f97316" },
  { id: "bad", label: "Bad", flaeche: "8.6 m²", x: 240, y: 140, w: 120, h: 60, fill: "#22d3ee" },
  { id: "schlafen", label: "Schlafzimmer", flaeche: "18.9 m²", x: 40, y: 200, w: 160, h: 100, fill: "#a78bfa" },
  { id: "kind", label: "Kinderzimmer", flaeche: "13.5 m²", x: 200, y: 200, w: 160, h: 100, fill: "#34d399" },
  { id: "flur", label: "Flur", flaeche: "6.2 m²", x: 360, y: 40, w: 20, h: 260, fill: "#e2e8f0" },
];

const WAND_FARBE = "var(--line-strong)";
const GRUNDRISS_W = 380;
const GRUNDRISS_H = 300;

export function HausBauAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Stage breakpoints
  const grundrissOpacity = useTransform(scrollYProgress, [0, 0.1], [0, 1]);
  const raumFuellung = useTransform(scrollYProgress, [0.1, 0.3], [0, 1]);
  const wandHoehe = useTransform(scrollYProgress, [0.3, 0.55], [0, 1]);
  const dachOpacity = useTransform(scrollYProgress, [0.55, 0.75], [0, 1]);
  const labelOpacity = useTransform(scrollYProgress, [0.75, 0.9], [0, 1]);

  // Skew for pseudo-3D wall effect
  const sceneSkewX = useTransform(scrollYProgress, [0.3, 0.55], [0, -6]);
  const sceneScaleY = useTransform(scrollYProgress, [0.3, 0.55], [1, 0.72]);
  const sceneTranslateY = useTransform(scrollYProgress, [0.3, 0.55], [0, -40]);

  const [stage, setStage] = useState("Grundriss laden …");
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (v < 0.1) setStage("Grundriss laden …");
    else if (v < 0.3) setStage("Räume erkennen …");
    else if (v < 0.55) setStage("Wände hochziehen …");
    else if (v < 0.75) setStage("Dach setzen …");
    else setStage("Massenauszug bereit");
  });

  return (
    <section ref={containerRef} className="relative" style={{ height: "400vh" }}>
      <div className="sticky top-0 h-screen flex flex-col items-center justify-center overflow-hidden px-6">
        {/* Stage label */}
        <motion.p
          className="font-mono text-xs uppercase tracking-widest text-fg-muted mb-8"
          style={{ opacity: grundrissOpacity }}
        >
          {stage as string}
        </motion.p>

        {/* Scene */}
        <motion.div
          className="relative"
          style={{
            skewX: sceneSkewX,
            scaleY: sceneScaleY,
            translateY: sceneTranslateY,
          }}
        >
          {/* Floor plan SVG */}
          <motion.svg
            viewBox={`0 0 ${GRUNDRISS_W} ${GRUNDRISS_H}`}
            className="w-full max-w-lg"
            style={{ opacity: grundrissOpacity }}
          >
            {/* Background */}
            <rect width={GRUNDRISS_W} height={GRUNDRISS_H} fill="var(--surface-2)" rx="2" />

            {/* Room fills */}
            {RAEUME.map((r) => (
              <motion.rect
                key={r.id}
                x={r.x}
                y={r.y}
                width={r.w}
                height={r.h}
                fill={r.fill}
                style={{ opacity: raumFuellung, fillOpacity: 0.25 }}
              />
            ))}

            {/* Room outlines */}
            {RAEUME.map((r) => (
              <rect
                key={r.id + "-outline"}
                x={r.x}
                y={r.y}
                width={r.w}
                height={r.h}
                fill="none"
                stroke={WAND_FARBE}
                strokeWidth="1.5"
              />
            ))}

            {/* Maßketten */}
            <line x1="40" y1="280" x2="380" y2="280" stroke="var(--fg-muted)" strokeWidth="0.8" />
            <line x1="40" y1="275" x2="40" y2="285" stroke="var(--fg-muted)" strokeWidth="0.8" />
            <line x1="380" y1="275" x2="380" y2="285" stroke="var(--fg-muted)" strokeWidth="0.8" />
            <text x="210" y="295" fill="var(--fg-muted)" fontFamily="var(--font-mono)" fontSize="9" textAnchor="middle">
              11.35 m
            </text>
            <line x1="10" y1="40" x2="10" y2="300" stroke="var(--fg-muted)" strokeWidth="0.8" />
            <line x1="5" y1="40" x2="15" y2="40" stroke="var(--fg-muted)" strokeWidth="0.8" />
            <line x1="5" y1="300" x2="15" y2="300" stroke="var(--fg-muted)" strokeWidth="0.8" />
            <text
              x="22"
              y="175"
              fill="var(--fg-muted)"
              fontFamily="var(--font-mono)"
              fontSize="9"
              textAnchor="middle"
              transform="rotate(-90 22 175)"
            >
              9.00 m
            </text>

            {/* Room labels */}
            {RAEUME.map((r) => (
              <motion.g key={r.id + "-label"} style={{ opacity: raumFuellung }}>
                <text
                  x={r.x + r.w / 2}
                  y={r.y + r.h / 2 - 5}
                  fill="var(--fg)"
                  fontFamily="var(--font-mono)"
                  fontSize="8"
                  textAnchor="middle"
                  fontWeight="600"
                >
                  {r.label}
                </text>
                <text
                  x={r.x + r.w / 2}
                  y={r.y + r.h / 2 + 8}
                  fill="var(--fg-muted)"
                  fontFamily="var(--font-mono)"
                  fontSize="7"
                  textAnchor="middle"
                >
                  {r.flaeche}
                </text>
              </motion.g>
            ))}
          </motion.svg>

          {/* Extruded walls (pseudo-3D) */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{ opacity: wandHoehe }}
          >
            <svg
              viewBox={`0 0 ${GRUNDRISS_W} ${GRUNDRISS_H}`}
              className="w-full max-w-lg absolute inset-0"
              style={{ overflow: "visible" }}
            >
              {RAEUME.map((r) => (
                <motion.rect
                  key={r.id + "-wall"}
                  x={r.x}
                  y={r.y - 60}
                  width={r.w}
                  height={r.h}
                  fill={r.fill}
                  fillOpacity={0.08}
                  stroke={r.fill}
                  strokeWidth="1"
                  strokeOpacity={0.5}
                  style={{ opacity: wandHoehe }}
                />
              ))}
              {/* Vertical wall lines connecting floors */}
              {RAEUME.map((r) => (
                <g key={r.id + "-vert"}>
                  <motion.line
                    x1={r.x} y1={r.y}
                    x2={r.x} y2={r.y - 60}
                    stroke={WAND_FARBE} strokeWidth="1" strokeOpacity={0.6}
                    style={{ opacity: wandHoehe }}
                  />
                  <motion.line
                    x1={r.x + r.w} y1={r.y}
                    x2={r.x + r.w} y2={r.y - 60}
                    stroke={WAND_FARBE} strokeWidth="1" strokeOpacity={0.6}
                    style={{ opacity: wandHoehe }}
                  />
                </g>
              ))}
            </svg>
          </motion.div>

          {/* Roof */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{ opacity: dachOpacity }}
          >
            <svg
              viewBox={`0 0 ${GRUNDRISS_W} ${GRUNDRISS_H}`}
              className="w-full max-w-lg absolute inset-0"
              style={{ overflow: "visible" }}
            >
              <motion.polygon
                points={`40,-120 210,-200 380,-120`}
                fill="var(--accent)"
                fillOpacity={0.2}
                stroke="var(--accent)"
                strokeWidth="2"
                style={{ opacity: dachOpacity }}
              />
              <motion.line
                x1="210" y1="-200"
                x2="210" y2="-120"
                stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="4 3"
                style={{ opacity: dachOpacity }}
              />
              {/* Ridge label */}
              <motion.text
                x="218" y="-155"
                fill="var(--accent)"
                fontFamily="var(--font-mono)"
                fontSize="8"
                style={{ opacity: dachOpacity }}
              >
                First
              </motion.text>
            </svg>
          </motion.div>
        </motion.div>

        {/* Bottom stats */}
        <motion.div
          className="mt-10 flex gap-8 font-mono text-xs text-fg-muted uppercase tracking-wide"
          style={{ opacity: labelOpacity }}
        >
          <span>Wohnfläche <strong className="text-fg">89.8 m²</strong></span>
          <span>Volumen <strong className="text-fg">386 m³</strong></span>
          <span>Positionen <strong className="text-highlight">47</strong></span>
        </motion.div>

        {/* Progress bar */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-48 h-px bg-line">
          <motion.div
            className="h-full bg-highlight origin-left"
            style={{ scaleX: scrollYProgress }}
          />
        </div>
      </div>
    </section>
  );
}
