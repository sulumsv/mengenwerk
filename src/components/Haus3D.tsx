"use client";

import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Edges, Line } from "@react-three/drei";
import { motion, useScroll, useMotionValueEvent } from "motion/react";
import * as THREE from "three";

/**
 * Baustufen des Hauses, jede mit dem Scrollfortschritt (0–1), ab dem sie
 * erscheint. So wie ein CAD-Modell schrittweise aufgebaut wird, bis am Ende
 * ein fertiges, bezugsfertiges Haus steht — nicht nur ein Rohbau-Volumen.
 */
const STUFEN = {
  fundament: 0.05,
  waende: 0.2,
  dach: 0.42,
  oeffnungen: 0.6,
  fassade: 0.78,
  vermassung: 0.9,
} as const;

const WAND_H = 1.6;
const HAUS_W = 3.2;
const HAUS_T = 2.4;
const DACH_H = 1.05;
const UEBERSTAND_Z = 0.32;
const UEBERSTAND_X = 0.32;

/** Weiche Einblendung: 0 vor der Stufe, 1 einen Abschnitt danach. */
function nutzeStufe(progress: number, ab: number, dauer = 0.12) {
  return THREE.MathUtils.clamp((progress - ab) / dauer, 0, 1);
}

function Bauteil({
  progress,
  ab,
  children,
  von,
  nach,
}: {
  progress: number;
  ab: number;
  children: React.ReactNode;
  von: [number, number, number];
  nach: [number, number, number];
}) {
  const t = nutzeStufe(progress, ab);
  const eased = t * t * (3 - 2 * t); // smoothstep — wirkt weniger mechanisch als linear
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!ref.current) return;
    ref.current.position.set(
      von[0] + (nach[0] - von[0]) * eased,
      von[1] + (nach[1] - von[1]) * eased,
      von[2] + (nach[2] - von[2]) * eased,
    );
    ref.current.visible = t > 0.001;
    ref.current.scale.setScalar(0.85 + 0.15 * eased);
  });
  return <group ref={ref}>{children}</group>;
}

function Wand({ position, args }: { position: [number, number, number]; args: [number, number, number] }) {
  return (
    <mesh position={position}>
      <boxGeometry args={args} />
      <meshStandardMaterial color="#f2ede1" roughness={0.85} metalness={0.02} />
      <Edges scale={1.001} color="#14130f" />
    </mesh>
  );
}

/** Dreieckige Giebelwand — schließt die Lücke zwischen Wandoberkante und First. */
function Giebelwand({ seite }: { seite: 1 | -1 }) {
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const halbTiefe = HAUS_T / 2;
    const vertices = new Float32Array([
      -halbTiefe, 0, 0,
      halbTiefe, 0, 0,
      0, DACH_H, 0,
    ]);
    geo.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
    geo.setIndex([0, 1, 2]);
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <mesh
      geometry={geometry}
      position={[seite * (HAUS_W / 2), WAND_H, 0]}
      rotation={[0, Math.PI / 2, 0]}
    >
      <meshStandardMaterial color="#f2ede1" roughness={0.85} side={THREE.DoubleSide} />
      <Edges color="#14130f" />
    </mesh>
  );
}

const DACH_HALBTIEFE = HAUS_T / 2 + UEBERSTAND_Z;
const DACH_LAENGE = Math.sqrt(DACH_HALBTIEFE ** 2 + DACH_H ** 2);
const DACH_WINKEL = Math.atan2(DACH_H, DACH_HALBTIEFE);
const DACH_FIRST_Y = WAND_H + DACH_H;

/** Dachfläche: geneigte Platte vom First zur Traufe, mit Dachüberstand. */
function Dachflaeche({ seite }: { seite: 1 | -1 }) {
  const rotationX = seite === 1 ? DACH_WINKEL : Math.PI - DACH_WINKEL;
  return (
    <mesh
      position={[0, DACH_FIRST_Y - DACH_H / 2, (seite * DACH_HALBTIEFE) / 2]}
      rotation={[rotationX, 0, 0]}
    >
      <boxGeometry args={[HAUS_W + UEBERSTAND_X * 2, 0.07, DACH_LAENGE]} />
      <meshStandardMaterial color="#b4482f" roughness={0.65} />
      <Edges color="#14130f" />
    </mesh>
  );
}

function Fenster({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[0.5, 0.5, 0.05]} />
        <meshStandardMaterial color="#bfe3ff" roughness={0.1} metalness={0.3} transparent opacity={0.8} />
        <Edges color="#14130f" />
      </mesh>
      {/* Sprosse */}
      <mesh>
        <boxGeometry args={[0.5, 0.04, 0.06]} />
        <meshStandardMaterial color="#f7f6f1" />
      </mesh>
      <mesh>
        <boxGeometry args={[0.04, 0.5, 0.06]} />
        <meshStandardMaterial color="#f7f6f1" />
      </mesh>
    </group>
  );
}

function HausModell({ progress }: { progress: number }) {
  const bodenY = -1.2;

  return (
    <group position={[0, bodenY, 0]}>
      {/* Grundstück */}
      <mesh position={[0, -0.06, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[6.5, 5]} />
        <meshStandardMaterial color="#dfe6d8" roughness={1} />
      </mesh>

      {/* Fundament */}
      <Bauteil progress={progress} ab={STUFEN.fundament} von={[0, -0.6, 0]} nach={[0, 0.05, 0]}>
        <mesh>
          <boxGeometry args={[HAUS_W + 0.3, 0.1, HAUS_T + 0.3]} />
          <meshStandardMaterial color="#8a8578" roughness={0.9} />
          <Edges color="#14130f" />
        </mesh>
      </Bauteil>

      {/* Wände + Giebel — wachsen von der Bodenplatte hoch */}
      <Bauteil progress={progress} ab={STUFEN.waende} von={[0, WAND_H / 2, 0]} nach={[0, WAND_H / 2 + 0.1, 0]}>
        <group>
          <Wand position={[0, 0, HAUS_T / 2]} args={[HAUS_W, WAND_H, 0.12]} />
          <Wand position={[0, 0, -HAUS_T / 2]} args={[HAUS_W, WAND_H, 0.12]} />
          <Wand position={[HAUS_W / 2, 0, 0]} args={[0.12, WAND_H, HAUS_T]} />
          <Wand position={[-HAUS_W / 2, 0, 0]} args={[0.12, WAND_H, HAUS_T]} />
          <group position={[0, -WAND_H / 2, 0]}>
            <Giebelwand seite={1} />
            <Giebelwand seite={-1} />
          </group>
        </group>
      </Bauteil>

      {/* Satteldach — setzt sich von oben auf die Giebel, inklusive Kamin */}
      <Bauteil progress={progress} ab={STUFEN.dach} von={[0, 1.4, 0]} nach={[0, 0, 0]}>
        <group>
          <Dachflaeche seite={1} />
          <Dachflaeche seite={-1} />
          <mesh position={[HAUS_W / 2 - 0.7, DACH_FIRST_Y - 0.35, DACH_HALBTIEFE * 0.35]}>
            <boxGeometry args={[0.3, 0.7, 0.3]} />
            <meshStandardMaterial color="#8a8578" roughness={0.9} />
            <Edges color="#14130f" />
          </mesh>
        </group>
      </Bauteil>

      {/* Tür + Eingangsstufe */}
      <Bauteil progress={progress} ab={STUFEN.oeffnungen} von={[0, 0.15, HAUS_T / 2 + 0.4]} nach={[0, 0.15, HAUS_T / 2 + 0.07]}>
        <mesh>
          <boxGeometry args={[0.55, 1.0, 0.06]} />
          <meshStandardMaterial color="#1f7a33" roughness={0.5} />
          <Edges color="#14130f" />
        </mesh>
      </Bauteil>
      <Bauteil progress={progress} ab={STUFEN.oeffnungen} von={[0, -0.5, HAUS_T / 2 + 0.6]} nach={[0, -0.55, HAUS_T / 2 + 0.35]}>
        <mesh>
          <boxGeometry args={[0.85, 0.1, 0.5]} />
          <meshStandardMaterial color="#c9c3b4" roughness={0.9} />
          <Edges color="#14130f" />
        </mesh>
      </Bauteil>

      {/* Fenster — Front, Rückseite und beide Giebelseiten */}
      {[
        [-0.95, 0.35, HAUS_T / 2 + 0.35] as const,
        [0.95, 0.35, HAUS_T / 2 + 0.35] as const,
        [-0.95, 0.35, -(HAUS_T / 2 + 0.35)] as const,
        [0.95, 0.35, -(HAUS_T / 2 + 0.35)] as const,
        [HAUS_W / 2 + 0.35, 0.35, -0.5] as const,
        [HAUS_W / 2 + 0.35, 0.35, 0.5] as const,
        [-(HAUS_W / 2 + 0.35), 0.35, -0.5] as const,
        [-(HAUS_W / 2 + 0.35), 0.35, 0.5] as const,
      ].map((pos, i) => (
        <Bauteil
          key={i}
          progress={progress}
          ab={STUFEN.oeffnungen + 0.03}
          von={[pos[0] * 1.15, pos[1], pos[2] * 1.15]}
          nach={pos}
        >
          <Fenster position={[0, 0, 0]} />
        </Bauteil>
      ))}

      {/* Fassade fertigstellen — Sockelfarbe und Dachrinne als letzter Feinschliff */}
      <Bauteil progress={progress} ab={STUFEN.fassade} von={[0, -0.3, 0]} nach={[0, 0, 0]}>
        <group>
          <mesh position={[0, -0.75, HAUS_T / 2]}>
            <boxGeometry args={[HAUS_W, 0.15, 0.14]} />
            <meshStandardMaterial color="#8a8578" roughness={0.9} />
          </mesh>
          <mesh position={[0, -0.75, -HAUS_T / 2]}>
            <boxGeometry args={[HAUS_W, 0.15, 0.14]} />
            <meshStandardMaterial color="#8a8578" roughness={0.9} />
          </mesh>
        </group>
      </Bauteil>

      {/* Vermaßung — CAD-typische Maßketten entlang der Grundfläche */}
      <group visible={nutzeStufe(progress, STUFEN.vermassung) > 0.01}>
        <Line
          points={[
            [-HAUS_W / 2, -0.55, HAUS_T / 2 + 0.9],
            [HAUS_W / 2, -0.55, HAUS_T / 2 + 0.9],
          ]}
          color="#1f7a33"
          lineWidth={1}
          transparent
          opacity={nutzeStufe(progress, STUFEN.vermassung)}
        />
      </group>
    </group>
  );
}

function Szene({ progress }: { progress: number }) {
  const gruppe = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (gruppe.current) gruppe.current.rotation.y += delta * 0.15; // langsame CAD-Turntable-Rotation
  });
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[4, 6, 4]} intensity={1.2} castShadow />
      <directionalLight position={[-4, 3, -3]} intensity={0.4} />
      <group ref={gruppe}>
        <HausModell progress={progress} />
      </group>
    </>
  );
}

export function Haus3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("Fundament setzen …");
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setProgress(v);
    if (v < STUFEN.waende) setStage("Fundament setzen …");
    else if (v < STUFEN.dach) setStage("Wände hochziehen …");
    else if (v < STUFEN.oeffnungen) setStage("Satteldach aufsetzen …");
    else if (v < STUFEN.fassade) setStage("Türen und Fenster setzen …");
    else if (v < STUFEN.vermassung) setStage("Fassade fertigstellen …");
    else setStage("Haus fertig — Massenauszug bereit");
  });

  return (
    <section ref={containerRef} className="relative" style={{ height: "400vh" }}>
      <div className="sticky top-0 h-screen flex flex-col items-center justify-center overflow-hidden px-6">
        <motion.p className="font-mono text-xs uppercase tracking-widest text-fg-muted mb-6">{stage}</motion.p>

        <div className="w-full max-w-xl h-[55vh]">
          <Canvas camera={{ position: [4.6, 2.6, 4.9], fov: 38 }} shadows>
            <Szene progress={progress} />
          </Canvas>
        </div>

        <div className="mt-6 flex gap-8 font-mono text-xs text-fg-muted uppercase tracking-wide">
          <span>
            Wohnfläche <strong className="text-fg">89.8 m²</strong>
          </span>
          <span>
            Volumen <strong className="text-fg">386 m³</strong>
          </span>
          <span>
            Positionen <strong className="text-highlight">47</strong>
          </span>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-48 h-px bg-line">
          <motion.div className="h-full bg-highlight origin-left" style={{ scaleX: scrollYProgress }} />
        </div>
      </div>
    </section>
  );
}
