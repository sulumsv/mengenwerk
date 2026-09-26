"use client";

// Fotorealistische 3D-Szene der Startseite (three.js / React Three Fiber).
// Das Haus wird aus denselben Plandaten gebaut wie der 2D-Grundriss; die
// Scroll-Position steuert Rohbau, Ausbau, Garten, Licht und Kamerafahrt.

import { Suspense, useLayoutEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, MeshReflectorMaterial, SoftShadows, useGLTF, useTexture } from "@react-three/drei";
import { Bloom, EffectComposer, N8AO, SMAA, ToneMapping, Vignette } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import type { MotionValue } from "motion/react";
import * as THREE from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { boxen, schlitze, RAEUME, FARBE, PX_M, PLAN_W, PLAN_H, type Box } from "./plan";

// ── Maßstab: Plan-Einheiten → Meter, Hausmitte im Ursprung, Süden = +z ──
const S = 1 / PX_M;
const CX = 300;
const CY = 205;
const H = 2.9; // lichte Geschosshöhe inkl. Decke
const px = (x: number) => (x - CX) * S;
const pz = (y: number) => (y - CY) * S;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const glatt = (v: number) => v * v * (3 - 2 * v);
const abschnitt = (p: number, a: number, b: number) => glatt(clamp01((p - a) / (b - a)));

// Abschnitte der Scroll-Geschichte (0 … 1 über die gesamte Sektion)
const PHASE = {
  einblenden: [0.28, 0.36],
  wachsen: [0.34, 0.5],
  og: [0.48, 0.58],
  garten: [0.56, 0.66],
  putz: [0.6, 0.7],
  fenster: [0.66, 0.74],
  dach: [0.72, 0.82],
  pflanzen: [0.8, 0.9],
  abend: [0.84, 1],
} as const;
const phase = (p: number, k: keyof typeof PHASE) => abschnitt(p, PHASE[k][0], PHASE[k][1]);

// ── Texturen ──
type Satz = { map: THREE.Texture; normalMap: THREE.Texture; roughnessMap: THREE.Texture };

function useSatz(name: string): Satz {
  const t = useTexture({
    map: `/3d/tex/${name}_diff.webp`,
    normalMap: `/3d/tex/${name}_nor.webp`,
    roughnessMap: `/3d/tex/${name}_rough.webp`,
  });
  useLayoutEffect(() => {
    for (const tex of [t.map, t.normalMap, t.roughnessMap]) {
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.anisotropy = 8;
    }
    t.map.colorSpace = THREE.SRGBColorSpace;
  }, [t]);
  return t;
}

// Quader, dessen UVs in Metern skaliert sind, damit Texturen nicht verzerren
function metrischeBox(w: number, h: number, d: number, kachel: number) {
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  const masse: [number, number][] = [
    [d, h], [d, h], [w, d], [w, d], [w, h], [w, h],
  ];
  for (let f = 0; f < 6; f++) {
    const [du, dv] = masse[f];
    for (let v = 0; v < 4; v++) {
      const i = f * 4 + v;
      uv.setXY(i, (uv.getX(i) * du) / kachel, (uv.getY(i) * dv) / kachel);
    }
  }
  return g;
}

// ── Planblatt: der Einreichplan liegt auf dem Baugrund, das Haus wächst aus ihm ──
function svgTextur(svg: string, breite: number, fertig: () => void) {
  const c = document.createElement("canvas");
  c.width = breite;
  c.height = Math.round((breite * PLAN_H) / PLAN_W);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  const img = new Image();
  img.onload = () => {
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    t.needsUpdate = true;
    fertig();
  };
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  return t;
}

function PlanBlatt({
  planSvg,
  fortschritt,
  onBereit,
}: {
  planSvg: { normal: string; markiert: string };
  fortschritt: MotionValue<number>;
  onBereit: () => void;
}) {
  const { normal, markiert, matNormal, matMarkiert } = useMemo(() => {
    let offen = 2;
    const fertig = () => {
      offen -= 1;
      if (offen === 0) requestAnimationFrame(onBereit);
    };
    const normal = svgTextur(planSvg.normal, 3072, fertig);
    const markiert = svgTextur(planSvg.markiert, 3072, fertig);
    return {
      normal,
      markiert,
      // unbeleuchtet und ohne Tonemapping: sieht exakt aus wie der 2D-Plan
      matNormal: new THREE.MeshBasicMaterial({ map: normal, transparent: true, toneMapped: false }),
      matMarkiert: new THREE.MeshBasicMaterial({ map: markiert, transparent: true, opacity: 0, toneMapped: false }),
    };
  }, [planSvg, onBereit]);

  useFrame(() => {
    const p = fortschritt.get();
    const weg = 1 - phase(p, "garten");
    matNormal.opacity = weg;
    matMarkiert.opacity = abschnitt(p, 0.12, 0.16) * (1 - abschnitt(p, 0.29, 0.33)) * weg;
  });

  const w = PLAN_W * S;
  const d = PLAN_H * S;
  const pos: [number, number, number] = [px(PLAN_W / 2), 0.04, pz(PLAN_H / 2)];
  return (
    <>
      <mesh rotation-x={-Math.PI / 2} position={pos} material={matNormal}>
        <planeGeometry args={[w, d]} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[pos[0], 0.042, pos[2]]} material={matMarkiert}>
        <planeGeometry args={[w, d]} />
      </mesh>
      {/* Texturen am Leben halten */}
      <primitive object={normal} attach={undefined} />
      <primitive object={markiert} attach={undefined} />
    </>
  );
}

// ── Wände ──
function Waende({ fortschritt }: { fortschritt: MotionValue<number> }) {
  const putz = useSatz("putz");
  const holz = useSatz("holz");
  const gruppe = useRef<THREE.Group>(null);

  const aussenMat = useMemo(
    () => new THREE.MeshStandardMaterial({ ...putz, color: "#b8744f", roughness: 1 }),
    [putz],
  );
  const innenMat = useMemo(
    () => new THREE.MeshStandardMaterial({ ...putz, color: "#ede7de", roughness: 1 }),
    [putz],
  );
  const holzMat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ ...holz, color: "#b8845a", roughness: 0.9 });
    return m;
  }, [holz]);

  const teile = useMemo(
    () =>
      boxen.map((b: Box) => {
        const hoehe = b.k * H;
        // Eingangsseite (Westwand, x = 80) bekommt eine vertikale Holzverschalung
        const verschalt = b.aussen && b.x === 80 && b.w === 12;
        return {
          geo: metrischeBox(b.w * S, hoehe, b.d * S, verschalt ? 1.2 : 2.5),
          pos: [px(b.x + b.w / 2), b.z0 * H + hoehe / 2, pz(b.y + b.d / 2)] as const,
          aussen: b.aussen,
          verschalt,
        };
      }),
    [],
  );

  const rohbau = new THREE.Color("#b8744f");
  const weiss = new THREE.Color(1.22, 1.22, 1.2);
  const holzFarbe = new THREE.Color("#b8845a");

  useFrame(() => {
    const p = fortschritt.get();
    const w = Math.max(0.001, phase(p, "wachsen"));
    if (gruppe.current) gruppe.current.scale.y = w;
    const u = phase(p, "putz");
    aussenMat.color.copy(rohbau).lerp(weiss, u);
    holzMat.color.copy(rohbau).lerp(holzFarbe, u);
  });

  return (
    <group ref={gruppe}>
      {teile.map((t, i) => (
        <mesh
          key={i}
          geometry={t.geo}
          position={t.pos as unknown as THREE.Vector3Tuple}
          material={t.verschalt ? holzMat : t.aussen ? aussenMat : innenMat}
          castShadow
          receiveShadow
        />
      ))}
    </group>
  );
}

// ── Bodenplatte und Innenböden ──
function Boden({ fortschritt }: { fortschritt: MotionValue<number> }) {
  const innen = useRef<THREE.Group>(null);
  useFrame(() => {
    if (innen.current) innen.current.visible = phase(fortschritt.get(), "garten") > 0.4;
  });
  const beton = useSatz("beton");
  const deck = useSatz("deck");
  const platte = useMemo(() => metrischeBox(456 * S, 0.3, 346 * S, 3), []);
  const bodenFarbe: Record<string, string> = { [FARBE.wohn]: "#d8c3a2", [FARBE.nass]: "#dfe1df", [FARBE.neben]: "#cfc9bf" };
  return (
    <>
      <mesh geometry={platte} position={[px(300), -0.13, pz(205)]} receiveShadow castShadow>
        <meshStandardMaterial {...beton} color="#cfcac2" />
      </mesh>
      <group ref={innen}>
      {RAEUME.map((r) => (
        <mesh key={r.name} position={[px(r.x + r.w / 2), 0.025, pz(r.y + r.h / 2)]} rotation-x={-Math.PI / 2} receiveShadow>
          <planeGeometry args={[r.w * S, r.h * S]} />
          {r.fill === FARBE.wohn ? (
            <meshStandardMaterial {...deck} color={bodenFarbe[r.fill]} roughness={0.7} />
          ) : (
            <meshStandardMaterial color={bodenFarbe[r.fill]} roughness={0.35} />
          )}
        </mesh>
      ))}
      </group>
    </>
  );
}

// ── Fenster, Haustür, Vordach ──
const RAHMEN = "#2c2f33";

function Oeffnungen({ fortschritt }: { fortschritt: MotionValue<number> }) {
  const gruppe = useRef<THREE.Group>(null);
  const glas = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#b9ccd6",
        metalness: 0,
        roughness: 0.04,
        transparent: true,
        opacity: 0.3,
        envMapIntensity: 1.6,
        clearcoat: 1,
      }),
    [],
  );
  const rahmen = useMemo(() => new THREE.MeshStandardMaterial({ color: RAHMEN, metalness: 0.55, roughness: 0.35 }), []);
  const bank = useMemo(() => new THREE.MeshStandardMaterial({ color: "#8f9396", metalness: 0.6, roughness: 0.3 }), []);

  const fenster = schlitze.filter((s) => s.art === "fenster");
  const tuer = schlitze.find((s) => s.art === "tuer" && s.vertikal && s.x === 80);

  useFrame(() => {
    const f = phase(fortschritt.get(), "fenster");
    if (gruppe.current) {
      gruppe.current.visible = f > 0.01;
    }
    glas.opacity = 0.3 * f;
  });

  const unten = 0.32 * H;
  const hoch = 0.48 * H;
  const r = 0.055; // Rahmenstärke

  return (
    <group ref={gruppe}>
      {fenster.map((s, i) => {
        const breite = (s.vertikal ? s.d : s.w) * S;
        const tiefe = (s.vertikal ? s.w : s.d) * S;
        const cx = px(s.x + s.w / 2);
        const cz = pz(s.y + s.d / 2);
        const dreh = s.vertikal ? Math.PI / 2 : 0;
        return (
          <group key={i} position={[cx, unten, cz]} rotation-y={dreh}>
            {/* Glas */}
            <mesh position={[0, hoch / 2, 0]} material={glas}>
              <boxGeometry args={[breite - 2 * r, hoch - 2 * r, 0.02]} />
            </mesh>
            {/* Rahmen */}
            <mesh position={[0, r / 2, 0]} material={rahmen} castShadow>
              <boxGeometry args={[breite, r, 0.08]} />
            </mesh>
            <mesh position={[0, hoch - r / 2, 0]} material={rahmen} castShadow>
              <boxGeometry args={[breite, r, 0.08]} />
            </mesh>
            <mesh position={[-breite / 2 + r / 2, hoch / 2, 0]} material={rahmen} castShadow>
              <boxGeometry args={[r, hoch, 0.08]} />
            </mesh>
            <mesh position={[breite / 2 - r / 2, hoch / 2, 0]} material={rahmen} castShadow>
              <boxGeometry args={[r, hoch, 0.08]} />
            </mesh>
            {breite > 1.1 && (
              <mesh position={[0, hoch / 2, 0]} material={rahmen} castShadow>
                <boxGeometry args={[r * 0.8, hoch, 0.07]} />
              </mesh>
            )}
            {/* Fensterbank, ragt beidseitig aus der Wand */}
            <mesh position={[0, -0.02, 0]} material={bank} castShadow receiveShadow>
              <boxGeometry args={[breite + 0.08, 0.035, tiefe + 0.12]} />
            </mesh>
          </group>
        );
      })}

      {tuer && (
        <group position={[px(tuer.x + tuer.w / 2), 0, pz(tuer.y + tuer.d / 2)]} rotation-y={Math.PI / 2}>
          <mesh position={[0, (0.84 * H) / 2, 0]} castShadow>
            <boxGeometry args={[tuer.d * S, 0.84 * H, 0.07]} />
            <meshStandardMaterial color="#3a3d41" metalness={0.4} roughness={0.45} />
          </mesh>
          {/* Glasstreifen und Griffstange */}
          <mesh position={[tuer.d * S * 0.28, (0.84 * H) / 2, -0.04]} material={glas}>
            <boxGeometry args={[0.14, 0.84 * H - 0.3, 0.02]} />
          </mesh>
          <mesh position={[-tuer.d * S * 0.3, 1.05, -0.07]}>
            <boxGeometry args={[0.03, 1.1, 0.03]} />
            <meshStandardMaterial color="#c9ccce" metalness={1} roughness={0.2} />
          </mesh>
          {/* Vordach */}
          <mesh position={[0, 0.92 * H, -0.7]} castShadow receiveShadow>
            <boxGeometry args={[tuer.d * S + 1.2, 0.14, 1.3]} />
            <meshStandardMaterial color="#2e3135" metalness={0.5} roughness={0.4} />
          </mesh>
        </group>
      )}
    </group>
  );
}

// ── Satteldach mit Ziegeldeckung, Giebelwänden und Traufe ──
const NEIGUNG = THREE.MathUtils.degToRad(35);
const UEBERSTAND = 0.5;
const HAUS = { x0: 80, x1: 520, y0: 40, y1: 370 };

function giebelGeometrie(tiefe: number, first: number, dicke: number) {
  const f = new THREE.Shape();
  f.moveTo(-tiefe / 2, 0);
  f.lineTo(tiefe / 2, 0);
  f.lineTo(0, first);
  f.closePath();
  const g = new THREE.ExtrudeGeometry(f, { depth: dicke, bevelEnabled: false });
  g.translate(0, 0, -dicke / 2);
  // UVs in Metern, damit Putz- und Holztextur nicht verzerren
  const uv = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 2.2, uv.getY(i) / 2.2);
  return g;
}

export function satteldachMasse(breite: number, tiefe: number) {
  const halb = tiefe / 2 + UEBERSTAND;
  return { halb, first: (tiefe / 2) * Math.tan(NEIGUNG), laenge: halb / Math.cos(NEIGUNG), breite: breite + 2 * UEBERSTAND };
}

// ── Obergeschoss (Wiener Doppelhaus-Stil): weiß verputzt, Flachdach mit Attika, Raffstoren ──
const OG = { x0: 200, x1: 520, y0: 40, y1: 370 };
const RAFF = "#3a3d41";

const OG_FENSTER: { x: number; z: number; ausr: "s" | "n" | "o"; b: number; h: number; sohle: number }[] = [
  { x: -1.3, z: 4.54, ausr: "s", b: 1.7, h: 1.45, sohle: 0.95 },
  { x: 1.9, z: 4.54, ausr: "s", b: 2.3, h: 1.45, sohle: 0.95 },
  { x: 5.0, z: 4.54, ausr: "s", b: 1.2, h: 1.45, sohle: 0.95 },
  { x: -0.4, z: -4.54, ausr: "n", b: 1.4, h: 1.2, sohle: 1.1 },
  { x: 3.6, z: -4.54, ausr: "n", b: 1.4, h: 1.2, sohle: 1.1 },
  { x: 6.05, z: -1.6, ausr: "o", b: 1.4, h: 1.2, sohle: 1.1 },
  { x: 6.05, z: 1.7, ausr: "o", b: 1.4, h: 1.2, sohle: 1.1 },
];

function Obergeschoss({ fortschritt }: { fortschritt: MotionValue<number> }) {
  const putz = useSatz("putz");
  const gruppe = useRef<THREE.Group>(null);
  const fensterGr = useRef<THREE.Group>(null);
  const b = (OG.x1 - OG.x0) * S;
  const t = (OG.y1 - OG.y0) * S;
  const cx = px((OG.x0 + OG.x1) / 2);
  const cz = pz((OG.y0 + OG.y1) / 2);
  const wand = useMemo(() => metrischeBox(b, H, t, 2.5), [b, t]);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ ...putz, color: "#b8744f", roughness: 1 }), [putz]);
  const glas = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#a9bcc8", roughness: 0.04, transparent: true, opacity: 0.35, envMapIntensity: 1.6, clearcoat: 1 }), []);
  const rahmen = useMemo(() => new THREE.MeshStandardMaterial({ color: "#2c2f33", metalness: 0.55, roughness: 0.35 }), []);
  const licht = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color(0, 0, 0), toneMapped: false }), []);
  const rohbau = new THREE.Color("#b8744f");
  const weiss = new THREE.Color(1.22, 1.22, 1.2);

  useFrame(() => {
    const p = fortschritt.get();
    const g = phase(p, "og");
    if (gruppe.current) {
      gruppe.current.visible = g > 0.001;
      gruppe.current.scale.y = Math.max(0.001, g);
    }
    mat.color.copy(rohbau).lerp(weiss, phase(p, "putz"));
    const f = phase(p, "fenster");
    if (fensterGr.current) fensterGr.current.visible = f > 0.01;
    glas.opacity = 0.35 * f;
    const l = phase(p, "abend");
    licht.color.setRGB(2.4 * l, 1.6 * l, 0.8 * l);
  });

  return (
    <>
      <group ref={gruppe} position={[cx, H, cz]}>
        <mesh geometry={wand} position={[0, H / 2, 0]} material={mat} castShadow receiveShadow />
      </group>
      <group ref={fensterGr}>
        {OG_FENSTER.map((f, i) => {
          const dreh = f.ausr === "o" ? Math.PI / 2 : 0;
          const vor = f.ausr === "s" || f.ausr === "o" ? 1 : -1;
          const y = H + f.sohle;
          return (
            <group key={i} position={[f.x, y, f.z]} rotation-y={dreh}>
              <mesh position={[0, f.h / 2, 0]} material={glas}>
                <boxGeometry args={[f.b - 0.1, f.h - 0.1, 0.02]} />
              </mesh>
              {/* warmes Innenlicht hinter dem Glas */}
              <mesh position={[0, f.h / 2, -0.12 * vor]} material={licht}>
                <planeGeometry args={[f.b - 0.2, f.h - 0.2]} />
              </mesh>
              {[
                [0, 0.03, f.b, 0.06],
                [0, f.h - 0.03, f.b, 0.06],
                [-f.b / 2 + 0.03, f.h / 2, 0.06, f.h],
                [f.b / 2 - 0.03, f.h / 2, 0.06, f.h],
                [0, f.h / 2, 0.05, f.h],
              ].map(([x, yy, w, h], k) => (
                <mesh key={k} position={[x, yy, 0]} material={rahmen} castShadow>
                  <boxGeometry args={[w, h, 0.1]} />
                </mesh>
              ))}
              {/* Raffstore-Kasten über dem Fenster */}
              <mesh position={[0, f.h + 0.16, 0.06 * vor]} castShadow>
                <boxGeometry args={[f.b + 0.12, 0.24, 0.22]} />
                <meshStandardMaterial color={RAFF} metalness={0.4} roughness={0.5} />
              </mesh>
              {/* Fensterbank */}
              <mesh position={[0, -0.03, 0.06 * vor]} castShadow>
                <boxGeometry args={[f.b + 0.1, 0.04, 0.3]} />
                <meshStandardMaterial color="#8f9396" metalness={0.6} roughness={0.3} />
              </mesh>
            </group>
          );
        })}
      </group>
    </>
  );
}

function Dach({ fortschritt }: { fortschritt: MotionValue<number> }) {
  const kies = useSatz("kies");
  const gruppe = useRef<THREE.Group>(null);
  const led = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color(0, 0, 0), toneMapped: false }), []);
  const dunkel = "#2b2e32";
  const kiesGeo = useMemo(() => metrischeBox(1, 0.12, 1, 2), []);

  useFrame(() => {
    const p = fortschritt.get();
    const a = phase(p, "dach");
    if (gruppe.current) {
      gruppe.current.visible = a > 0.001;
      gruppe.current.position.y = (1 - a) * (1 - a) * 2.5;
    }
    const l = phase(p, "abend");
    led.color.setRGB(3 * l, 2 * l, 1 * l);
  });

  // Zwei Dachflächen: Anbau (Erdgeschoss, Westteil) und Hauptdach (Obergeschoss)
  const dachteile = [
    { x0: 80, x1: 200, y0: 40, y1: 370, hoehe: H, ueber: 0.3, tief: true },
    { x0: OG.x0, x1: OG.x1, y0: OG.y0, y1: OG.y1, hoehe: 2 * H, ueber: 0.35, tief: false },
  ];
  return (
    <group ref={gruppe}>
      {dachteile.map((d, i) => {
        const w = (d.x1 - d.x0) * S + 2 * d.ueber;
        const t = (d.y1 - d.y0) * S + 2 * d.ueber;
        const cx = px((d.x0 + d.x1) / 2);
        const cz = pz((d.y0 + d.y1) / 2);
        return (
          <group key={i} position={[cx, d.hoehe, cz]}>
            {/* Kiesdach mit leichtem Gefälle nach Süden */}
            <group rotation-x={0.05}>
              <mesh geometry={kiesGeo} scale={[w, 1, t]} position={[0, 0.06, 0]} receiveShadow castShadow>
                <meshStandardMaterial {...kies} color="#a3a29d" />
              </mesh>
            </group>
            {/* Attika/Stirnblech, dunkel abgesetzt */}
            {[
              [0, -t / 2, w, 0.05],
              [0, t / 2, w, 0.05],
              [-w / 2, 0, 0.05, t],
              [w / 2, 0, 0.05, t],
            ].map(([x, z, bw, bd], k) => (
              <mesh key={k} position={[x, 0.05, z]} castShadow>
                <boxGeometry args={[bw, 0.34, bd]} />
                <meshStandardMaterial color={dunkel} metalness={0.5} roughness={0.35} />
              </mesh>
            ))}
            {/* Regenfallrohr an der Ecke */}
            {d.tief === false && (
              <mesh position={[-w / 2 + 0.1, -H / 2, t / 2 + 0.1]} castShadow>
                <cylinderGeometry args={[0.05, 0.05, H, 10]} />
                <meshStandardMaterial color="#c6c9cc" metalness={0.7} roughness={0.3} />
              </mesh>
            )}
            <mesh position={[0, -0.05, t / 2 - 0.02]} material={led}>
              <boxGeometry args={[w - 0.3, 0.02, 0.03]} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// ── Pergola über der Terrasse mit Lichterkette ──
function Pergola({ fortschritt }: { fortschritt: MotionValue<number> }) {
  const gruppe = useRef<THREE.Group>(null);
  const kugel = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color(0, 0, 0), toneMapped: false }), []);
  useFrame(() => {
    const p = fortschritt.get();
    if (gruppe.current) gruppe.current.visible = phase(p, "pflanzen") > 0.02;
    const l = phase(p, "abend");
    kugel.color.setRGB(4 * l, 3 * l, 1.5 * l);
  });
  const metall = <meshStandardMaterial color="#2b2e32" metalness={0.6} roughness={0.35} />;
  const x0 = -3.6;
  const x1 = 3.9;
  const zHinten = 4.62;
  const zVorne = 7.1;
  const hoehe = 2.55;
  return (
    <group ref={gruppe}>
      {[x0, x1].map((x) => (
        <mesh key={x} position={[x, hoehe / 2, zVorne]} castShadow>
          <boxGeometry args={[0.12, hoehe, 0.12]} />
          {metall}
        </mesh>
      ))}
      {[zHinten, zVorne].map((z) => (
        <mesh key={z} position={[(x0 + x1) / 2, hoehe, z]} castShadow>
          <boxGeometry args={[x1 - x0 + 0.3, 0.16, 0.12]} />
          {metall}
        </mesh>
      ))}
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} position={[x0 + (i * (x1 - x0)) / 5, hoehe + 0.02, (zHinten + zVorne) / 2]} castShadow>
          <boxGeometry args={[0.06, 0.1, zVorne - zHinten]} />
          {metall}
        </mesh>
      ))}
      {/* Lichterkette */}
      {Array.from({ length: 11 }, (_, i) => {
        const t = i / 10;
        return (
          <mesh key={`l-${i}`} position={[x0 + t * (x1 - x0), hoehe - 0.18 - Math.sin(t * Math.PI) * 0.12, zVorne - 0.08]} material={kugel}>
            <sphereGeometry args={[0.035, 8, 8]} />
          </mesh>
        );
      })}
    </group>
  );
}

// ── salbeigrüner Sockelbereich am Erdgeschoss (wie im Wiener Referenzhaus) ──
function Sockelfarbe({ fortschritt }: { fortschritt: MotionValue<number> }) {
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#a3b39a", roughness: 0.95, transparent: true, opacity: 0 }), []);
  useFrame(() => {
    mat.opacity = phase(fortschritt.get(), "putz");
  });
  return (
    <mesh position={[px(300), H / 2, pz(370) + 0.09]} material={mat} receiveShadow>
      <boxGeometry args={[(400 - 200) * S + 0.02, H - 0.05, 0.02]} />
    </mesh>
  );
}

// ── Pflanzen & Modelle als Instanzen ──
type Ort = { x: number; z: number; s?: number; rot?: number };

function Instanzen({
  url,
  orte,
  zielHoehe,
  fortschritt,
  phaseName = "pflanzen",
}: {
  url: string;
  orte: Ort[];
  zielHoehe: number;
  fortschritt: MotionValue<number>;
  phaseName?: keyof typeof PHASE;
}) {
  const { scene } = useGLTF(url);
  const { teile, h0, minY } = useMemo(() => {
    scene.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(scene);
    const liste: { geo: THREE.BufferGeometry; mat: THREE.Material; matrix: THREE.Matrix4 }[] = [];
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        const mat = (Array.isArray(m.material) ? m.material[0] : m.material) as THREE.MeshStandardMaterial;
        if (mat.map || mat.alphaMap) {
          mat.alphaTest = Math.max(mat.alphaTest, 0.4);
          mat.transparent = false;
        }
        liste.push({ geo: m.geometry, mat, matrix: m.matrixWorld.clone() });
      }
    });
    return { teile: liste, h0: box.max.y - box.min.y, minY: box.min.y };
  }, [scene]);

  const refs = useRef<(THREE.InstancedMesh | null)[]>([]);
  const zuletzt = useRef(-1);
  const hilf = useMemo(() => ({ m: new THREE.Matrix4(), q: new THREE.Quaternion(), s: new THREE.Vector3(), t: new THREE.Vector3(), e: new THREE.Euler() }), []);

  useFrame(() => {
    const g = phase(fortschritt.get(), phaseName);
    if (Math.abs(g - zuletzt.current) < 0.002) return;
    zuletzt.current = g;
    teile.forEach((teil, ti) => {
      const im = refs.current[ti];
      if (!im) return;
      im.visible = g > 0.001;
      orte.forEach((o, i) => {
        const skal = (zielHoehe / h0) * (o.s ?? 1) * Math.max(0.001, g);
        hilf.e.set(0, o.rot ?? 0, 0);
        hilf.q.setFromEuler(hilf.e);
        hilf.s.setScalar(skal);
        hilf.t.set(o.x, -minY * skal, o.z);
        hilf.m.compose(hilf.t, hilf.q, hilf.s).multiply(teil.matrix);
        im.setMatrixAt(i, hilf.m);
      });
      im.instanceMatrix.needsUpdate = true;
    });
  });

  return (
    <>
      {teile.map((t, i) => (
        <instancedMesh
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          args={[t.geo, t.mat, orte.length]}
          castShadow
          receiveShadow
          frustumCulled={false}
        />
      ))}
    </>
  );
}

// Pseudo-Zufall mit festem Startwert, damit jede Ladung gleich aussieht
function zufall(start: number) {
  let s = start;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function linie(von: [number, number], bis: [number, number], abstand: number, seed: number): Ort[] {
  const r = zufall(seed);
  const dx = bis[0] - von[0];
  const dz = bis[1] - von[1];
  const n = Math.max(1, Math.round(Math.hypot(dx, dz) / abstand));
  return Array.from({ length: n + 1 }, (_, i) => ({
    x: von[0] + (dx * i) / n + (r() - 0.5) * 0.25,
    z: von[1] + (dz * i) / n + (r() - 0.5) * 0.25,
    s: 0.85 + r() * 0.35,
    rot: r() * Math.PI * 2,
  }));
}

// ── Prozedurale Vegetation: verformte Kugeln/Quader mit echter Blatttextur, Stämme mit Rinde ──
function blattGeometrie(art: "kugel" | "hecke", seed: number) {
  const r = zufall(seed);
  const roh = art === "kugel" ? new THREE.SphereGeometry(1, 32, 22) : new THREE.BoxGeometry(1, 1, 1, 12, 12, 12);
  // gemeinsame Eckpunkte, damit die Normalen glatt berechnet werden (keine Facetten)
  roh.deleteAttribute("normal");
  const uv0 = roh.getAttribute("uv");
  roh.deleteAttribute("uv");
  const g = mergeVertices(roh, 1e-4);
  if (uv0) g.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
  {
    const pp = g.attributes.position as THREE.BufferAttribute;
    const uu = g.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < pp.count; i++) uu.setXY(i, pp.getX(i) * 0.5 + pp.getZ(i) * 0.5, pp.getY(i) * 0.5 + pp.getX(i) * 0.25);
  }
  const pos = g.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  const phasen = [r() * 6, r() * 6, r() * 6];
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    if (art === "hecke") {
      // Rundung an den Kanten, wie ein geschnittener Heckenkörper
      const n = v.clone().normalize();
      v.lerp(n.multiplyScalar(0.72), 0.55);
    }
    const w = 1 + 0.09 * Math.sin(v.x * 5 + phasen[0]) * Math.sin(v.y * 4 + phasen[1]) + 0.06 * Math.sin(v.z * 7 + phasen[2]);
    v.multiplyScalar(w);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  const uv = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 3, uv.getY(i) * 3);
  return g;
}

function Vegetation({
  fortschritt,
  baeume,
  hecken,
  kugeln,
}: {
  fortschritt: MotionValue<number>;
  baeume: { x: number; z: number; h: number; rot: number }[];
  hecken: { x: number; z: number; b: number; t: number; h: number }[];
  kugeln: { x: number; z: number; r: number; farbe: string }[];
}) {
  const blatt = useSatz("blatt");
  const rinde = useSatz("rinde");
  const gruppe = useRef<THREE.Group>(null);
  const kugelGeo = useMemo(() => [blattGeometrie("kugel", 11), blattGeometrie("kugel", 23), blattGeometrie("kugel", 37)], []);
  const heckeGeo = useMemo(() => blattGeometrie("hecke", 5), []);
  const gruen = ["#4d7a34", "#5b8a3c", "#3f6b2c", "#68943f"];

  useFrame(() => {
    const g = phase(fortschritt.get(), "pflanzen");
    if (gruppe.current) {
      gruppe.current.visible = g > 0.001;
      gruppe.current.scale.setScalar(Math.max(0.001, g));
    }
  });

  return (
    <group ref={gruppe}>
      {baeume.map((b, i) => (
        <group key={i} position={[b.x, 0, b.z]} rotation-y={b.rot} scale={b.h / 5}>
          <mesh position={[0, 1.2, 0]} castShadow>
            <cylinderGeometry args={[0.11, 0.2, 2.4, 10]} />
            <meshStandardMaterial {...rinde} color="#8a7a6c" />
          </mesh>
          {[
            [0, 3.5, 0, 1.75],
            [-0.95, 3.0, 0.4, 1.25],
            [1.0, 3.15, -0.3, 1.3],
            [0.2, 4.2, 0.7, 1.1],
            [-0.2, 3.9, -0.9, 1.15],
          ].map(([x, y, z, r], k) => (
            <mesh key={k} geometry={kugelGeo[k % 3]} position={[x, y, z]} scale={[r, r * 0.88, r]} castShadow receiveShadow>
              <meshStandardMaterial {...blatt} color={gruen[k % 4]} roughness={0.95} />
            </mesh>
          ))}
        </group>
      ))}
      {hecken.map((h, i) => (
        <mesh key={`h-${i}`} geometry={heckeGeo} position={[h.x, h.h / 2, h.z]} scale={[h.b, h.h, h.t]} castShadow receiveShadow>
          <meshStandardMaterial {...blatt} color="#4a7632" roughness={0.95} />
        </mesh>
      ))}
      {kugeln.map((k, i) => (
        <mesh key={`k-${i}`} geometry={kugelGeo[i % 3]} position={[k.x, k.r * 0.85, k.z]} scale={[k.r, k.r * 0.85, k.r]} castShadow receiveShadow>
          <meshStandardMaterial {...blatt} color={k.farbe} roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}

// ── Außenanlage in Metern: Haus x −6,05 … 6,05, z −4,54 … 4,54, Eingang im Westen, Straße im Westen ──
const G = { x0: -10.5, x1: 12, z0: -9, z1: 14 };

function Flaeche({ satz, x0, x1, z0, z1, h = 0.06, kachel = 1.5, farbe = "#ffffff" }: { satz: Satz; x0: number; x1: number; z0: number; z1: number; h?: number; kachel?: number; farbe?: string }) {
  const geo = useMemo(() => metrischeBox(x1 - x0, h, z1 - z0, kachel), [x0, x1, z0, z1, h, kachel]);
  return (
    <mesh geometry={geo} position={[(x0 + x1) / 2, h / 2, (z0 + z1) / 2]} castShadow receiveShadow>
      <meshStandardMaterial {...satz} color={farbe} />
    </mesh>
  );
}

function Garten({ fortschritt }: { fortschritt: MotionValue<number> }) {
  const rasen = useSatz("rasen");
  const deck = useSatz("deck");
  const beton = useSatz("beton");
  const rand = useSatz("rand");
  const rasenMat = useRef<THREE.MeshStandardMaterial>(null);
  const flach = useRef<THREE.Group>(null);
  const leuchte = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color(0, 0, 0), toneMapped: false }), []);

  useLayoutEffect(() => {
    rasen.map.repeat.set(40, 40);
    rasen.normalMap.repeat.set(40, 40);
    rasen.roughnessMap.repeat.set(40, 40);
  }, [rasen]);

  // Heller Grund wie der Seitenhintergrund, bis der Garten entsteht
  const grund = useMemo(() => new THREE.MeshBasicMaterial({ color: "#eeece5", transparent: true, toneMapped: false }), []);
  useFrame(() => {
    const p = fortschritt.get();
    const g = phase(p, "garten");
    grund.opacity = 1 - g;
    if (flach.current) flach.current.visible = g > 0.02;
    const l = phase(p, "abend");
    leuchte.color.setRGB(3 * l, 2.2 * l, 1.2 * l);
  });

  // Wenig, aber gezielt gesetztes Grün: Fokus bleibt auf dem Haus
  const hecken = [
    { x: (G.x0 + G.x1) / 2 + 0.3, z: G.z0 + 0.3, b: G.x1 - G.x0 - 1, t: 1.0, h: 1.8 },
    { x: G.x1 - 0.3, z: (G.z0 - 1.4) / 2, b: 1.0, t: -G.z0 - 1.4 + 0.6, h: 1.8 },
  ];
  const baeume = [
    { x: 9.4, z: -3.6, h: 5.6, rot: 0.4 },
    { x: 9.7, z: 5.2, h: 4.8, rot: 2.1 },
  ];
  const kugeln = [
    { x: -6.6, z: -1.2, r: 0.55, farbe: "#5b8a3c" },
    { x: -6.7, z: 1.4, r: 0.5, farbe: "#4d7a34" },
    { x: -5.5, z: 4.8, r: 0.5, farbe: "#68943f" },
    { x: 4.9, z: 4.8, r: 0.55, farbe: "#5b8a3c" },
    { x: 8.4, z: 8.4, r: 0.6, farbe: "#4d7a34" },
    { x: 8.5, z: 10.6, r: 0.5, farbe: "#68943f" },
    { x: -5.9, z: 13.4, r: 0.55, farbe: "#5b8a3c" },
    { x: 6.9, z: 13.3, r: 0.6, farbe: "#4d7a34" },
  ];
  const platten = Array.from({ length: 5 }, (_, i) => -10 + i * 0.8);

  return (
    <>
      {/* Rasen (zu Beginn neutraler Baugrund unter dem Planblatt) */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.02, 0]} receiveShadow>
        <circleGeometry args={[90, 64]} />
        <meshStandardMaterial ref={rasenMat} {...rasen} color="#b9d98a" roughness={1} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.005, 0]} material={grund}>
        <circleGeometry args={[90, 64]} />
      </mesh>

      <group ref={flach}>
        {/* Holzterrasse vor dem Wohnbereich */}
        <Flaeche satz={deck} x0={-5.6} x1={5.6} z0={4.6} z1={6.9} h={0.14} kachel={2} farbe="#c79a6a" />
        {/* Steinterrasse rund um den Pool */}
        <Flaeche satz={rand} x0={-5.6} x1={8.2} z0={6.9} z1={12.7} h={0.05} kachel={1.2} farbe="#e4ded3" />
        {/* Pool 8 × 4 m mit Einfassung */}
        {[
          [-4, 5, 6.95, 7.45],
          [-4, 5, 11.55, 12.05],
          [-4, -3.5, 7.45, 11.55],
          [4.5, 5, 7.45, 11.55],
        ].map(([x0, x1, z0, z1], i) => (
          <Flaeche key={i} satz={rand} x0={x0} x1={x1} z0={z0} z1={z1} h={0.14} kachel={0.8} farbe="#ece7dd" />
        ))}
        <mesh rotation-x={-Math.PI / 2} position={[0.5, 0.1, 9.5]}>
          <planeGeometry args={[8, 4.1]} />
          <MeshReflectorMaterial
            resolution={1024}
            mirror={0.8}
            mixStrength={4}
            mixBlur={0.8}
            blur={[200, 60]}
            color="#2a9cb6"
            roughness={0.12}
            metalness={0.25}
            depthScale={0}
          />
        </mesh>

        {/* Zugang: Trittplatten vom Gehsteig zur Haustür, Pollerleuchten */}
        {platten.map((x, i) => (
          <Flaeche key={i} satz={beton} x0={x} x1={x + 0.65} z0={-0.45} z1={0.65} h={0.05} kachel={1} farbe="#d9d5cc" />
        ))}
        {[-9.6, -8, -6.6].map((x, i) => (
          <group key={`poller-${i}`} position={[x, 0, i % 2 ? 1.2 : -1]}>
            <mesh position={[0, 0.3, 0]} castShadow>
              <boxGeometry args={[0.1, 0.6, 0.1]} />
              <meshStandardMaterial color="#2b2e32" metalness={0.5} roughness={0.4} />
            </mesh>
            <mesh position={[0, 0.5, i % 2 ? -0.051 : 0.051]} material={leuchte}>
              <boxGeometry args={[0.07, 0.12, 0.005]} />
            </mesh>
          </group>
        ))}

        {/* Sonnenliegen */}
        {[5.5, 6.4, 7.3].map((x, i) => (
          <group key={`liege-${i}`} position={[x, 0.05, 9.6]}>
            <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
              <boxGeometry args={[0.7, 0.08, 1.95]} />
              <meshStandardMaterial color="#303236" metalness={0.5} roughness={0.4} />
            </mesh>
            <mesh position={[0, 0.3, 0.12]} castShadow receiveShadow>
              <boxGeometry args={[0.66, 0.1, 1.6]} />
              <meshStandardMaterial color="#efece6" roughness={0.95} />
            </mesh>
            <mesh position={[0, 0.46, -0.72]} rotation-x={0.6} castShadow>
              <boxGeometry args={[0.66, 0.1, 0.55]} />
              <meshStandardMaterial color="#efece6" roughness={0.95} />
            </mesh>
          </group>
        ))}
      </group>

      <Vegetation fortschritt={fortschritt} baeume={baeume} hecken={hecken} kugeln={kugeln} />
      <Instanzen url="/3d/models/outdoor_table_chair_set_01.glb" orte={[{ x: -3.2, z: 5.75, rot: 0 }]} zielHoehe={0.95} fortschritt={fortschritt} />
      <Instanzen
        url="/3d/models/potted_plant_02.glb"
        orte={[
          { x: -6.7, z: -0.9, s: 1 },
          { x: -6.7, z: 1.15, s: 0.9 },
        ]}
        zielHoehe={1.1}
        fortschritt={fortschritt}
      />
    </>
  );
}

// ── Umgebung: Wohnstraße, Gehsteig, Zaun und Nachbarhäuser (Wiener Stadtrand) ──
function Nachbarhaus({ x, z, b, t, farbe, drehung = 0 }: { x: number; z: number; b: number; t: number; farbe: string; drehung?: number }) {
  const ziegel = useSatz("dach");
  const putz = useSatz("putz");
  const hoehe = 3;
  const m = satteldachMasse(b, t);
  const flaeche = useMemo(() => metrischeBox(m.breite, 0.2, m.laenge, 1.6), [m.breite, m.laenge]);
  const giebel = useMemo(() => giebelGeometrie(t, m.first, 0.3), [t, m.first]);
  const koerper = useMemo(() => metrischeBox(b, hoehe, t, 2.5), [b, t]);
  return (
    <group position={[x, 0, z]} rotation-y={drehung}>
      <mesh geometry={koerper} position={[0, hoehe / 2, 0]} castShadow receiveShadow>
        <meshStandardMaterial {...putz} color={farbe} roughness={1} />
      </mesh>
      {[-1, 1].map((sx) => (
        <mesh key={sx} geometry={giebel} position={[(sx * b) / 2 - sx * 0.15, hoehe, 0]} rotation-y={Math.PI / 2} castShadow>
          <meshStandardMaterial {...putz} color={farbe} roughness={1} />
        </mesh>
      ))}
      {[1, -1].map((seite) => (
        <mesh key={seite} geometry={flaeche} position={[0, hoehe + m.first / 2 + 0.1, (seite * (t / 2 + UEBERSTAND)) / 2]} rotation-x={seite * NEIGUNG} castShadow receiveShadow>
          <meshStandardMaterial {...ziegel} color="#7c6f69" roughness={0.9} />
        </mesh>
      ))}
      {/* angedeutete Fenster */}
      {[-0.3, 0.3].map((f) => (
        <mesh key={f} position={[f * b, 1.6, t / 2 + 0.01]}>
          <planeGeometry args={[1.3, 1.3]} />
          <meshStandardMaterial color="#30363c" metalness={0.3} roughness={0.2} />
        </mesh>
      ))}
    </group>
  );
}

function Umgebung({ fortschritt }: { fortschritt: MotionValue<number> }) {
  const asphalt = useSatz("asphalt");
  const beton = useSatz("beton");
  const putz = useSatz("putz");
  const gruppe = useRef<THREE.Group>(null);
  const lampe = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color(0, 0, 0), toneMapped: false }), []);
  useFrame(() => {
    const p = fortschritt.get();
    if (gruppe.current) gruppe.current.visible = phase(p, "garten") > 0.02;
    const l = phase(p, "abend");
    lampe.color.setRGB(4 * l, 3 * l, 1.8 * l);
  });
  const zaun = useMemo(() => metrischeBox(0.25, 0.7, 1, 2.5), []);
  return (
    <group ref={gruppe}>
      <Flaeche satz={asphalt} x0={-18.5} x1={-12.2} z0={-70} z1={70} h={0.02} kachel={4} farbe="#8a8a8a" />
      <Flaeche satz={beton} x0={-12.2} x1={-10.6} z0={-70} z1={70} h={0.12} kachel={1.5} farbe="#cfcbc3" />
      <Flaeche satz={beton} x0={-20.1} x1={-18.5} z0={-70} z1={70} h={0.12} kachel={1.5} farbe="#cfcbc3" />
      {/* Sockelmauer mit Lattenzaun zur Straße, Öffnung am Zugang */}
      {[
        [G.z0, -0.7],
        [0.9, G.z1],
      ].map(([z0, z1], i) => (
        <group key={i}>
          <mesh geometry={zaun} scale={[1, 1, z1 - z0]} position={[G.x0, 0.35, (z0 + z1) / 2]} castShadow receiveShadow>
            <meshStandardMaterial {...putz} color="#e9e5de" roughness={1} />
          </mesh>
          {Array.from({ length: Math.floor((z1 - z0) / 0.14) }, (_, k) => (
            <mesh key={k} position={[G.x0, 1.05, z0 + 0.07 + k * 0.14]} castShadow>
              <boxGeometry args={[0.04, 0.7, 0.07]} />
              <meshStandardMaterial color="#2e3135" metalness={0.4} roughness={0.5} />
            </mesh>
          ))}
        </group>
      ))}
      {/* Straßenlaternen */}
      {[-14, 8, 30].map((z) => (
        <group key={z} position={[-11.9, 0, z]}>
          <mesh position={[0, 2.5, 0]} castShadow>
            <cylinderGeometry args={[0.05, 0.07, 5, 10]} />
            <meshStandardMaterial color="#3a3d41" metalness={0.6} roughness={0.4} />
          </mesh>
          <mesh position={[-0.35, 5, 0]}>
            <boxGeometry args={[0.8, 0.1, 0.22]} />
            <meshStandardMaterial color="#3a3d41" metalness={0.6} roughness={0.4} />
          </mesh>
          <mesh position={[-0.55, 4.94, 0]} material={lampe}>
            <boxGeometry args={[0.35, 0.02, 0.15]} />
          </mesh>
        </group>
      ))}
      {/* Nachbarhäuser */}
      <Nachbarhaus x={-28} z={-14} b={11} t={8.5} farbe="#ece2d2" drehung={Math.PI / 2} />
      <Nachbarhaus x={-28} z={6} b={10} t={8} farbe="#f1eee8" drehung={Math.PI / 2} />
      <Nachbarhaus x={-29} z={26} b={12} t={9} farbe="#e3ddd3" drehung={Math.PI / 2} />
      <Nachbarhaus x={1} z={-22} b={12} t={8.5} farbe="#e8e0d4" />
      <Nachbarhaus x={3} z={27} b={11} t={8} farbe="#efebe4" drehung={Math.PI} />
      <Nachbarhaus x={26} z={2} b={10} t={8} farbe="#e6e1d8" drehung={-Math.PI / 2} />
    </group>
  );
}

// ── Einrichtung (echte Möbelmodelle in realen Maßen) ──
function Einrichtung({ fortschritt }: { fortschritt: MotionValue<number> }) {
  const gruppe = useRef<THREE.Group>(null);
  useFrame(() => {
    if (gruppe.current) gruppe.current.visible = phase(fortschritt.get(), "fenster") > 0.02;
  });
  const weiss = "#f1eee8";
  return (
    <>
      <Instanzen url="/3d/models/sofa_02.glb" orte={[{ x: -3.7, z: -1.35, rot: Math.PI }]} zielHoehe={0.82} fortschritt={fortschritt} phaseName="fenster" />
      <Instanzen url="/3d/models/modern_coffee_table_01.glb" orte={[{ x: -3.7, z: -2.5 }]} zielHoehe={0.4} fortschritt={fortschritt} phaseName="fenster" />
      <Instanzen
        url="/3d/models/modern_arm_chair_01.glb"
        orte={[
          { x: -1.4, z: -2.6, rot: -Math.PI / 2 },
          { x: 2.2, z: 1.6, rot: Math.PI },
        ]}
        zielHoehe={0.85}
        fortschritt={fortschritt}
        phaseName="fenster"
      />
      <Instanzen url="/3d/models/dining_table.glb" orte={[{ x: 1.3, z: -2.2, rot: Math.PI / 2 }]} zielHoehe={0.76} fortschritt={fortschritt} phaseName="fenster" />
      <Instanzen
        url="/3d/models/dining_chair_02.glb"
        orte={[
          { x: 0.55, z: -2.2, rot: Math.PI / 2 },
          { x: 2.05, z: -2.2, rot: -Math.PI / 2 },
          { x: 1.3, z: -1.35, rot: Math.PI },
          { x: 1.3, z: -3.05, rot: 0 },
        ]}
        zielHoehe={0.88}
        fortschritt={fortschritt}
        phaseName="fenster"
      />
      <Instanzen url="/3d/models/drawer_cabinet.glb" orte={[{ x: -1.9, z: 1.25, rot: Math.PI }]} zielHoehe={0.85} fortschritt={fortschritt} phaseName="fenster" />
      <group ref={gruppe}>
        {/* Küchenzeile an der Nordwand */}
        <mesh position={[1.45, 0.45, -3.85]} castShadow receiveShadow>
          <boxGeometry args={[2.9, 0.9, 0.62]} />
          <meshStandardMaterial color={weiss} roughness={0.5} />
        </mesh>
        <mesh position={[1.45, 0.92, -3.85]} castShadow>
          <boxGeometry args={[2.95, 0.04, 0.65]} />
          <meshStandardMaterial color="#3b3a38" roughness={0.3} />
        </mesh>
        {/* Doppelbett und Kinderbett */}
        {[
          { x: -3.6, z: 3.1, b: 1.8 },
          { x: 0.2, z: 3.1, b: 0.95 },
        ].map((bett, i) => (
          <group key={i} position={[bett.x, 0, bett.z]}>
            <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
              <boxGeometry args={[bett.b + 0.1, 0.3, 2.1]} />
              <meshStandardMaterial color="#8a6a4d" roughness={0.7} />
            </mesh>
            <mesh position={[0, 0.45, 0.05]} castShadow receiveShadow>
              <boxGeometry args={[bett.b, 0.2, 1.95]} />
              <meshStandardMaterial color={weiss} roughness={0.95} />
            </mesh>
            <mesh position={[0, 0.6, 0.95]} castShadow>
              <boxGeometry args={[bett.b + 0.1, 0.9, 0.08]} />
              <meshStandardMaterial color="#8a6a4d" roughness={0.7} />
            </mesh>
          </group>
        ))}
        {/* Badewanne */}
        <mesh position={[4.5, 0.28, -3.8]} castShadow receiveShadow>
          <boxGeometry args={[1.7, 0.56, 0.78]} />
          <meshStandardMaterial color="#f7f7f5" roughness={0.2} />
        </mesh>
      </group>
    </>
  );
}

// ── Licht: Abendsonne, Innenbeleuchtung ──
function Licht({ fortschritt }: { fortschritt: MotionValue<number> }) {
  const sonne = useRef<THREE.DirectionalLight>(null);
  const raumLichter = useRef<(THREE.PointLight | null)[]>([]);
  useFrame(() => {
    const p = fortschritt.get();
    const abend = phase(p, "abend");
    if (sonne.current) sonne.current.intensity = 3.2 - 1.4 * abend;
    const innen = phase(p, "fenster") * (0.35 + 0.65 * abend);
    raumLichter.current.forEach((l) => {
      if (l) l.intensity = 9 * innen;
    });
  });
  return (
    <>
      <directionalLight
        ref={sonne}
        position={[-14, 9, 10]}
        color="#ffc58f"
        intensity={3.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0003}
        shadow-normalBias={0.03}
        shadow-camera-left={-24}
        shadow-camera-right={24}
        shadow-camera-top={24}
        shadow-camera-bottom={-24}
        shadow-camera-near={1}
        shadow-camera-far={60}
      />
      {RAEUME.map((r, i) => (
        <pointLight
          key={r.name}
          ref={(el) => {
            raumLichter.current[i] = el;
          }}
          position={[px(r.x + r.w / 2), 2.2, pz(r.y + r.h / 2)]}
          color="#ffc98a"
          intensity={0}
          distance={7}
          decay={2}
        />
      ))}
    </>
  );
}

// ── Kamerafahrt ──
type Blick = { theta: number; phi: number; dist: number; ziel: number };
const BLICKE: [number, Blick][] = [
  [0, { theta: 0, phi: 89.5, dist: 26, ziel: 0 }],
  [0.3, { theta: 0, phi: 89.5, dist: 26, ziel: 0 }],
  [0.44, { theta: -30, phi: 50, dist: 26, ziel: 0.6 }],
  [0.58, { theta: -38, phi: 38, dist: 30, ziel: 1.8 }],
  [0.82, { theta: -20, phi: 26, dist: 34, ziel: 2.6 }],
  [1, { theta: 36, phi: 17, dist: 40, ziel: 2.4 }],
];

function Kamera({ fortschritt }: { fortschritt: MotionValue<number> }) {
  const { camera, size } = useThree();
  const ziel = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    const p = fortschritt.get();
    let a = BLICKE[0];
    let b = BLICKE[BLICKE.length - 1];
    for (let i = 0; i < BLICKE.length - 1; i++) {
      if (p <= BLICKE[i + 1][0]) {
        a = BLICKE[i];
        b = BLICKE[i + 1];
        break;
      }
    }
    const t = glatt(clamp01((p - a[0]) / (b[0] - a[0] || 1)));
    const m = (k: keyof Blick) => a[1][k] + (b[1][k] - a[1][k]) * t;
    // Hochformat (Handy): etwas mehr Abstand, damit das Haus ins Bild passt
    const hoch = size.width < size.height ? 1.35 : 1;
    // Bildausschnitt nach oben schieben: unten liegt die Textkarte, das Haus bleibt frei sichtbar
    camera.setViewOffset(size.width, size.height, 0, size.height * 0.12 * clamp01((p - 0.5) / 0.15), size.width, size.height);
    const th = THREE.MathUtils.degToRad(m("theta"));
    const ph = THREE.MathUtils.degToRad(m("phi"));
    const d = m("dist") * hoch;
    camera.position.set(Math.sin(th) * Math.cos(ph) * d, Math.sin(ph) * d, Math.cos(th) * Math.cos(ph) * d);
    ziel.set(0, m("ziel"), 0);
    camera.lookAt(ziel);
  });
  return null;
}

export default function HausSzene({
  fortschritt,
  planSvg,
  onBereit,
}: {
  fortschritt: MotionValue<number>;
  planSvg: { normal: string; markiert: string };
  onBereit: () => void;
}) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={{ fov: 32, near: 0.5, far: 200, position: [0, 25, 0.01] }}
      gl={{ antialias: false, toneMapping: THREE.NoToneMapping }}
    >
      <color attach="background" args={["#d9c8b8"]} />
      <fog attach="fog" args={["#d8c3ae", 55, 140]} />
      <SoftShadows size={14} samples={10} focus={0.6} />
      <Suspense fallback={null}>
        <Environment files="/3d/himmel.hdr" background backgroundBlurriness={0.02} environmentIntensity={0.9} />
        <Licht fortschritt={fortschritt} />
        <PlanBlatt planSvg={planSvg} fortschritt={fortschritt} onBereit={onBereit} />
        <Boden fortschritt={fortschritt} />
        <Waende fortschritt={fortschritt} />
        <Oeffnungen fortschritt={fortschritt} />
        <Obergeschoss fortschritt={fortschritt} />
        <Dach fortschritt={fortschritt} />
        <Pergola fortschritt={fortschritt} />
        <Sockelfarbe fortschritt={fortschritt} />
        <Garten fortschritt={fortschritt} />
        <Umgebung fortschritt={fortschritt} />
        <Einrichtung fortschritt={fortschritt} />
        <Kamera fortschritt={fortschritt} />
      </Suspense>
      <EffectComposer multisampling={0}>
        <N8AO halfRes aoRadius={1.4} intensity={2.4} distanceFalloff={0.6} />
        <Bloom mipmapBlur luminanceThreshold={1} intensity={0.8} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        <Vignette offset={0.25} darkness={0.45} />
        <SMAA />
      </EffectComposer>
    </Canvas>
  );
}

for (const url of [
  "/3d/models/outdoor_table_chair_set_01.glb",
  "/3d/models/potted_plant_02.glb",
  "/3d/models/sofa_02.glb",
  "/3d/models/modern_coffee_table_01.glb",
  "/3d/models/modern_arm_chair_01.glb",
  "/3d/models/dining_table.glb",
  "/3d/models/dining_chair_02.glb",
  "/3d/models/drawer_cabinet.glb",
]) {
  useGLTF.preload(url);
}
