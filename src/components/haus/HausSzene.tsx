"use client";

// Fotorealistische 3D-Szene der Startseite (three.js / React Three Fiber).
// Das Haus wird aus denselben Plandaten gebaut wie der 2D-Grundriss; die
// Scroll-Position steuert Rohbau, Ausbau, Garten, Licht und Kamerafahrt.

import { Suspense, useLayoutEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, useGLTF, useTexture } from "@react-three/drei";
import { Bloom, EffectComposer, N8AO, SMAA, ToneMapping, Vignette } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import type { MotionValue } from "motion/react";
import * as THREE from "three";
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
  og: [0.52, 0.6],
  garten: [0.56, 0.66],
  putz: [0.6, 0.7],
  fenster: [0.66, 0.74],
  dach: [0.72, 0.82],
  pflanzen: [0.8, 0.9],
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

// ── Mauerwerk: Ziegel im Rohbau, darüber eine Putzschicht, die von unten nach oben aufgezogen wird ──
type Teil = { w: number; h: number; d: number; x: number; y0: number; z: number; verschalt?: boolean };

function Mauerwerk({ teile, fortschritt }: { teile: Teil[]; fortschritt: MotionValue<number> }) {
  const ziegel = useSatz("ziegel");
  const putz = useSatz("putz");
  const holz = useSatz("holz");
  const schalen = useRef<(THREE.Mesh | null)[]>([]);

  const ziegelMat = useMemo(() => new THREE.MeshStandardMaterial({ ...ziegel, color: "#f3e6dc", roughness: 1 }), [ziegel]);
  const putzMat = useMemo(() => new THREE.MeshStandardMaterial({ ...putz, color: "#ffffff", roughness: 0.96 }), [putz]);
  const holzMat = useMemo(() => new THREE.MeshStandardMaterial({ ...holz, color: "#b8845a", roughness: 0.85 }), [holz]);

  const geos = useMemo(
    () =>
      teile.map((t) => {
        const kern = metrischeBox(t.w, t.h, t.d, 1.4);
        kern.translate(0, t.h / 2, 0);
        // Putz trägt 1,5 cm pro Seite auf
        const schale = metrischeBox(t.w + 0.03, t.h, t.d + 0.03, t.verschalt ? 1.2 : 2.5);
        schale.translate(0, t.h / 2, 0);
        return { kern, schale };
      }),
    [teile],
  );
  const oben = useMemo(() => Math.max(...teile.map((t) => t.y0 + t.h)), [teile]);

  useFrame(() => {
    const front = phase(fortschritt.get(), "putz") * oben;
    teile.forEach((t, i) => {
      const m = schalen.current[i];
      if (!m) return;
      const lokal = clamp01((front - t.y0) / t.h);
      m.visible = lokal > 0.001;
      m.scale.y = Math.max(0.001, lokal);
    });
  });

  return (
    <>
      {teile.map((t, i) => (
        <group key={i} position={[t.x, t.y0, t.z]}>
          <mesh geometry={geos[i].kern} material={ziegelMat} castShadow receiveShadow />
          <mesh
            ref={(el) => {
              schalen.current[i] = el;
            }}
            geometry={geos[i].schale}
            material={t.verschalt ? holzMat : putzMat}
            visible={false}
            castShadow
            receiveShadow
          />
        </group>
      ))}
    </>
  );
}

// ── Wände des Erdgeschoßes ──
function Waende({ fortschritt }: { fortschritt: MotionValue<number> }) {
  const gruppe = useRef<THREE.Group>(null);
  const teile = useMemo<Teil[]>(
    () =>
      boxen.map((b: Box) => ({
        w: b.w * S,
        h: b.k * H,
        d: b.d * S,
        x: px(b.x + b.w / 2),
        y0: b.z0 * H,
        z: pz(b.y + b.d / 2),
        // Eingangsseite (Westwand) bekommt statt Putz eine vertikale Holzverschalung
        verschalt: b.aussen && b.x === 80 && b.w === 12,
      })),
    [],
  );

  useFrame(() => {
    if (gruppe.current) gruppe.current.scale.y = Math.max(0.001, phase(fortschritt.get(), "wachsen"));
  });

  return (
    <group ref={gruppe}>
      <Mauerwerk teile={teile} fortschritt={fortschritt} />
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

// Fensterglas spiegelt wie im echten Leben den Himmel; der Innenraum bleibt dunkel
function fensterGlas() {
  return new THREE.MeshPhysicalMaterial({
    color: "#2f3d47",
    metalness: 0.25,
    roughness: 0.03,
    transparent: true,
    opacity: 0,
    envMapIntensity: 2.4,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
  });
}

// ── Fenster, Haustür, Vordach ──
const RAHMEN = "#2c2f33";

function Oeffnungen({ fortschritt }: { fortschritt: MotionValue<number> }) {
  const gruppe = useRef<THREE.Group>(null);
  const glas = useMemo(() => fensterGlas(), []);
  const rahmen = useMemo(() => new THREE.MeshStandardMaterial({ color: RAHMEN, metalness: 0.55, roughness: 0.35 }), []);
  const bank = useMemo(() => new THREE.MeshStandardMaterial({ color: "#8f9396", metalness: 0.6, roughness: 0.3 }), []);

  const fenster = schlitze.filter((s) => s.art === "fenster");
  const tuer = schlitze.find((s) => s.art === "tuer" && s.vertikal && s.x === 80);

  useFrame(() => {
    const f = phase(fortschritt.get(), "fenster");
    if (gruppe.current) {
      gruppe.current.visible = f > 0.01;
    }
    glas.opacity = 0.92 * f;
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

// Obergeschoßwände als einzelne Mauerteile: Pfeiler, Brüstungen und Stürze um jede Fensteröffnung
function ogWandteile(): Teil[] {
  const t = 12 * S;
  const xa = px(OG.x0);
  const xb = px(OG.x1);
  const za = pz(OG.y0);
  const zb = pz(OG.y1);
  const teile: Teil[] = [];
  const lauf = (entlangX: boolean, fest: number, von: number, bis: number, offen: { c: number; b: number; sohle: number; h: number }[]) => {
    const setze = (a: number, e: number, y0: number, h: number) => {
      if (e - a < 0.01 || h < 0.01) return;
      const m = (a + e) / 2;
      teile.push(entlangX ? { w: e - a, h, d: t, x: m, y0, z: fest } : { w: t, h, d: e - a, x: fest, y0, z: m });
    };
    let pos = von;
    for (const o of [...offen].sort((p, q) => p.c - q.c)) {
      const a = o.c - o.b / 2;
      const e = o.c + o.b / 2;
      setze(pos, a, 0, H);
      setze(a, e, 0, o.sohle);
      setze(a, e, o.sohle + o.h, H - o.sohle - o.h);
      pos = e;
    }
    setze(pos, bis, 0, H);
  };
  const fenster = (ausr: "s" | "n" | "o") =>
    OG_FENSTER.filter((f) => f.ausr === ausr).map((f) => ({ c: ausr === "o" ? f.z : f.x, b: f.b, sohle: f.sohle, h: f.h }));
  lauf(true, zb - t / 2, xa, xb, fenster("s"));
  lauf(true, za + t / 2, xa, xb, fenster("n"));
  lauf(false, xb - t / 2, za + t, zb - t, fenster("o"));
  lauf(false, xa + t / 2, za + t, zb - t, []);
  return teile;
}

function Obergeschoss({ fortschritt }: { fortschritt: MotionValue<number> }) {
  const beton = useSatz("beton");
  const gruppe = useRef<THREE.Group>(null);
  const decke = useRef<THREE.Mesh>(null);
  const fensterGr = useRef<THREE.Group>(null);
  const teile = useMemo(() => ogWandteile(), []);
  const deckeGeo = useMemo(() => metrischeBox((520 - 80) * S, 0.22, (370 - 40) * S, 3), []);
  const glas = useMemo(() => fensterGlas(), []);
  const rahmen = useMemo(() => new THREE.MeshStandardMaterial({ color: "#2c2f33", metalness: 0.55, roughness: 0.35 }), []);
  useFrame(() => {
    const p = fortschritt.get();
    const g = phase(p, "og");
    if (gruppe.current) {
      gruppe.current.visible = g > 0.001;
      gruppe.current.scale.y = Math.max(0.001, g);
    }
    // Die Decke wird betoniert, bevor das Obergeschoß gemauert wird
    const d = abschnitt(p, PHASE.og[0] - 0.025, PHASE.og[0]);
    if (decke.current) {
      decke.current.visible = d > 0.001;
      decke.current.scale.y = Math.max(0.001, d);
    }
    const f = phase(p, "fenster");
    if (fensterGr.current) fensterGr.current.visible = f > 0.01;
    glas.opacity = 0.92 * f;
  });

  return (
    <>
      <mesh ref={decke} geometry={deckeGeo} position={[px(300), H - 0.11, pz(205)]} castShadow receiveShadow visible={false}>
        <meshStandardMaterial {...beton} color="#e4e0d8" roughness={0.95} />
      </mesh>
      <group ref={gruppe} position={[0, H, 0]}>
        <Mauerwerk teile={teile} fortschritt={fortschritt} />
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

// PV-Modul: dunkelblaue Zellen mit feinem Raster, spiegelnd
function pvMaterial() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = "#1a2433";
  g.fillRect(0, 0, 256, 256);
  g.strokeStyle = "#6f7c8c";
  g.lineWidth = 2;
  for (let i = 0; i <= 6; i++) {
    g.beginPath();
    g.moveTo((i * 256) / 6, 0);
    g.lineTo((i * 256) / 6, 256);
    g.stroke();
  }
  for (let i = 0; i <= 10; i++) {
    g.beginPath();
    g.moveTo(0, (i * 256) / 10);
    g.lineTo(256, (i * 256) / 10);
    g.stroke();
  }
  g.strokeStyle = "#c9ced4";
  g.lineWidth = 6;
  g.strokeRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return new THREE.MeshPhysicalMaterial({ map: t, roughness: 0.15, metalness: 0.3, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.5 });
}

function Dach({ fortschritt }: { fortschritt: MotionValue<number> }) {
  const kies = useSatz("kies");
  const gruppe = useRef<THREE.Group>(null);
  const dunkel = "#3a3d40";
  const pv = useMemo(() => pvMaterial(), []);
  const kiesGeo = useMemo(() => metrischeBox(1, 0.12, 1, 2), []);

  useFrame(() => {
    const p = fortschritt.get();
    const a = phase(p, "dach");
    if (gruppe.current) {
      gruppe.current.visible = a > 0.001;
      gruppe.current.position.y = (1 - a) * (1 - a) * 2.5;
    }
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
                <meshStandardMaterial {...kies} color="#d6d3cb" />
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
            {/* PV-Module in zwei Reihen, flach aufgeständert nach Süden */}
            {d.tief === false &&
              [-1.6, 1.4].map((z) =>
                [-2.2, 0, 2.2].map((x) => (
                  <mesh key={`${x}-${z}`} position={[x, 0.32, z]} rotation-x={-0.17} material={pv} castShadow receiveShadow>
                    <boxGeometry args={[2.05, 0.04, 2.1]} />
                  </mesh>
                )),
              )}
          </group>
        );
      })}
    </group>
  );
}

// ── Pergola über der Terrasse ──
function Pergola({ fortschritt }: { fortschritt: MotionValue<number> }) {
  const gruppe = useRef<THREE.Group>(null);
  useFrame(() => {
    const p = fortschritt.get();
    if (gruppe.current) gruppe.current.visible = phase(p, "pflanzen") > 0.02;
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

// ── Außenanlage in Metern: Haus x −6,05 … 6,05, z −4,54 … 4,54, Eingang im Westen, Straße im Westen ──

function Flaeche({ satz, x0, x1, z0, z1, h = 0.06, kachel = 1.5, farbe = "#ffffff" }: { satz: Satz; x0: number; x1: number; z0: number; z1: number; h?: number; kachel?: number; farbe?: string }) {
  const geo = useMemo(() => metrischeBox(x1 - x0, h, z1 - z0, kachel), [x0, x1, z0, z1, h, kachel]);
  return (
    <mesh geometry={geo} position={[(x0 + x1) / 2, h / 2, (z0 + z1) / 2]} castShadow receiveShadow>
      <meshStandardMaterial {...satz} color={farbe} />
    </mesh>
  );
}

// Wellen für die Wasseroberfläche: kachelbare Normal-Map aus überlagerten Sinuswellen
function wasserNormalen() {
  const n = 256;
  const c = document.createElement("canvas");
  c.width = c.height = n;
  const ctx = c.getContext("2d")!;
  const bild = ctx.createImageData(n, n);
  const h = (x: number, y: number) => {
    const u = (x / n) * Math.PI * 2;
    const v = (y / n) * Math.PI * 2;
    return Math.sin(u * 3 + v * 2) * 0.5 + Math.sin(u * 5 - v * 4 + 1.3) * 0.3 + Math.sin(u * 9 + v * 7 + 2.1) * 0.15 + Math.sin(-u * 13 + v * 11) * 0.08;
  };
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const dx = h(x + 1, y) - h(x - 1, y);
      const dy = h(x, y + 1) - h(x, y - 1);
      const v = new THREE.Vector3(-dx * 2.5, -dy * 2.5, 1).normalize();
      const i = (y * n + x) * 4;
      bild.data[i] = (v.x * 0.5 + 0.5) * 255;
      bild.data[i + 1] = (v.y * 0.5 + 0.5) * 255;
      bild.data[i + 2] = (v.z * 0.5 + 0.5) * 255;
      bild.data[i + 3] = 255;
    }
  }
  ctx.putImageData(bild, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3, 1.6);
  return t;
}

// Rasenfläche mit Loch fürs Poolbecken; UVs in Metern
const POOL = { x0: -3.5, x1: 4.5, z0: 7.45, z1: 11.55, tiefe: 1.45 };
const RASEN_R = 42;
const RAND_BREITE = 22;

function rasenGeometrie(radius = RASEN_R) {
  const form = new THREE.Shape();
  form.absarc(0, 0, radius, 0, Math.PI * 2, false);
  const loch = new THREE.Path();
  // Shape liegt in x/y; nach der Drehung um −90° wird y zu −z
  loch.moveTo(POOL.x0, -POOL.z0);
  loch.lineTo(POOL.x0, -POOL.z1);
  loch.lineTo(POOL.x1, -POOL.z1);
  loch.lineTo(POOL.x1, -POOL.z0);
  loch.closePath();
  form.holes.push(loch);
  const g = new THREE.ShapeGeometry(form, 96);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const uv = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / 2.2, pos.getY(i) / 2.2);
  return g;
}

// Rand des Grundstücks: der Rasen läuft weich in die Wiese des Umgebungsfotos aus
function rasenRand() {
  const g = new THREE.RingGeometry(RASEN_R - 0.01, RASEN_R + RAND_BREITE, 128, 8);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const uv = g.attributes.uv as THREE.BufferAttribute;
  const farben = new Float32Array(pos.count * 4);
  for (let i = 0; i < pos.count; i++) {
    const r = Math.hypot(pos.getX(i), pos.getY(i));
    uv.setXY(i, pos.getX(i) / 2.2, pos.getY(i) / 2.2);
    const a = 1 - glatt(clamp01((r - RASEN_R) / RAND_BREITE));
    farben.set([1, 1, 1, a], i * 4);
  }
  g.setAttribute("color", new THREE.BufferAttribute(farben, 4));
  return g;
}

// Mähstreifen und leichte Farbunterschiede, wie sie auf jedem Drohnenfoto eines Rasens zu sehen sind.
// Als Multiplikations-Schicht über dem Rasen; zum Rand hin neutral (weiß), damit sie weich ausläuft.
function maehstreifen() {
  const n = 2048;
  const c = document.createElement("canvas");
  c.width = c.height = n;
  const g = c.getContext("2d")!;
  const bild = g.createImageData(n, n);
  const r0 = RASEN_R / (RASEN_R + RAND_BREITE);
  const rauschen = (x: number, y: number) =>
    Math.sin(x * 9.1 + Math.sin(y * 4.3) * 2) * Math.sin(y * 7.7 + Math.cos(x * 3.1) * 2) * 0.5 +
    Math.sin(x * 23 + y * 17) * Math.sin(y * 29 - x * 11) * 0.25;
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const u = (x / n) * 2 - 1;
      const v = (y / n) * 2 - 1;
      const r = Math.hypot(u, v);
      // Bahnen von 1,4 m Breite, abwechselnd hell und dunkel gemäht
      const meter = u * (RASEN_R + RAND_BREITE);
      const bahn = Math.floor((meter + 100) / 1.1) % 2 === 0 ? 1 : 0.955;
      const fleck = 1 - 0.05 * (rauschen(u * 3, v * 3) + 0.5);
      const stark = 1 - glatt(clamp01((r - r0 * 0.92) / (1 - r0 * 0.92)));
      const w = 1 - (1 - bahn * fleck) * stark;
      const i = (y * n + x) * 4;
      bild.data[i] = bild.data[i + 1] = bild.data[i + 2] = Math.round(Math.min(1, w) * 255);
      bild.data[i + 3] = 255;
    }
  }
  g.putImageData(bild, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function streifenGeometrie() {
  const g = rasenGeometrie(RASEN_R + RAND_BREITE);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const uv = g.attributes.uv as THREE.BufferAttribute;
  const R = RASEN_R + RAND_BREITE;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) + R) / (2 * R), (pos.getY(i) + R) / (2 * R));
  return g;
}

function Garten({ fortschritt }: { fortschritt: MotionValue<number> }) {
  const rasen = useSatz("rasen");
  const deck = useSatz("deck");
  const beton = useSatz("beton");
  const rand = useSatz("rand");
  const flach = useRef<THREE.Group>(null);
  const rasenGeo = useMemo(() => rasenGeometrie(), []);
  const randGeo = useMemo(() => rasenRand(), []);
  const streifenGeo = useMemo(() => streifenGeometrie(), []);
  const streifen = useMemo(() => maehstreifen(), []);
  const wellen = useMemo(() => wasserNormalen(), []);
  // Wasser ohne Lichtbrechungs-Pass: halbtransparent über dem gefliesten Becken, spiegelt den Himmel
  const wasser = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#6fc3d2",
        roughness: 0.03,
        metalness: 0.1,
        transparent: true,
        opacity: 0.55,
        normalMap: wellen,
        normalScale: new THREE.Vector2(0.25, 0.25),
        envMapIntensity: 1.6,
        clearcoat: 1,
        clearcoatRoughness: 0.02,
        depthWrite: false,
      }),
    [wellen],
  );
  const fliese = useMemo(() => new THREE.MeshStandardMaterial({ ...rand, color: "#dcf3f7", roughness: 0.3 }), [rand]);

  useLayoutEffect(() => {
    for (const t of [rasen.map, rasen.normalMap, rasen.roughnessMap]) t.repeat.set(1, 1);
  }, [rasen]);

  // Heller Grund wie der Seitenhintergrund, bis der Garten entsteht
  const grund = useMemo(() => new THREE.MeshBasicMaterial({ color: "#eeece5", transparent: true, toneMapped: false, depthWrite: false }), []);
  useFrame((_, dt) => {
    const p = fortschritt.get();
    const g = phase(p, "garten");
    grund.opacity = 1 - g;
    grund.visible = g < 0.999;
    if (flach.current) flach.current.visible = g > 0.02;
    wellen.offset.x += dt * 0.012;
    wellen.offset.y += dt * 0.007;
  });

  const platten = Array.from({ length: 5 }, (_, i) => -10 + i * 0.8);
  const bw = POOL.x1 - POOL.x0;
  const bt = POOL.z1 - POOL.z0;
  const bx = (POOL.x0 + POOL.x1) / 2;
  const bz = (POOL.z0 + POOL.z1) / 2;

  return (
    <>
      <mesh geometry={rasenGeo} rotation-x={-Math.PI / 2} position={[0, -0.02, 0]} receiveShadow>
        <meshStandardMaterial {...rasen} color="#c4e39a" roughness={1} />
      </mesh>
      <mesh geometry={randGeo} rotation-x={-Math.PI / 2} position={[0, -0.025, 0]} receiveShadow>
        <meshStandardMaterial {...rasen} color="#c4e39a" roughness={1} vertexColors transparent depthWrite={false} />
      </mesh>
      <mesh geometry={streifenGeo} rotation-x={-Math.PI / 2} position={[0, -0.015, 0]} renderOrder={1}>
        <meshBasicMaterial map={streifen} blending={THREE.MultiplyBlending} transparent depthWrite={false} toneMapped={false} premultipliedAlpha />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.005, 0]} material={grund} renderOrder={2}>
        <circleGeometry args={[RASEN_R + RAND_BREITE + 40, 64]} />
      </mesh>

      <group ref={flach}>
        {/* Holzterrasse vor dem Wohnbereich */}
        <Flaeche satz={deck} x0={-5.6} x1={5.6} z0={4.6} z1={6.9} h={0.14} kachel={2} farbe="#c79a6a" />
        {/* Steinterrasse rund um den Pool (das Becken bleibt offen) */}
        <Flaeche satz={rand} x0={-5.6} x1={-4} z0={6.9} z1={12.7} h={0.05} kachel={1.2} farbe="#e4ded3" />
        <Flaeche satz={rand} x0={5} x1={8.2} z0={6.9} z1={12.7} h={0.05} kachel={1.2} farbe="#e4ded3" />
        <Flaeche satz={rand} x0={-4} x1={5} z0={12.05} z1={12.7} h={0.05} kachel={1.2} farbe="#e4ded3" />
        {/* Beckenrand */}
        {[
          [-4, 5, 6.95, 7.45],
          [-4, 5, 11.55, 12.05],
          [-4, -3.5, 7.45, 11.55],
          [4.5, 5, 7.45, 11.55],
        ].map(([x0, x1, z0, z1], i) => (
          <Flaeche key={i} satz={rand} x0={x0} x1={x1} z0={z0} z1={z1} h={0.14} kachel={0.8} farbe="#ece7dd" />
        ))}
        {/* Becken: gefliester Boden und Wände, darüber das Wasser */}
        <mesh position={[bx, -POOL.tiefe, bz]} rotation-x={-Math.PI / 2} material={fliese} receiveShadow>
          <planeGeometry args={[bw, bt]} />
        </mesh>
        {[
          [bx, bz - bt / 2, bw, 0],
          [bx, bz + bt / 2, bw, Math.PI],
          [bx - bw / 2, bz, bt, Math.PI / 2],
          [bx + bw / 2, bz, bt, -Math.PI / 2],
        ].map(([x, z, breite, dreh], i) => (
          <mesh key={`w-${i}`} position={[x, -POOL.tiefe / 2 + 0.07, z]} rotation-y={dreh} material={fliese} receiveShadow>
            <planeGeometry args={[breite, POOL.tiefe + 0.14]} />
          </mesh>
        ))}
        <mesh position={[bx, 0.02, bz]} rotation-x={-Math.PI / 2} material={wasser}>
          <planeGeometry args={[bw, bt]} />
        </mesh>

        {/* Zugang: Trittplatten zur Haustür */}
        {platten.map((x, i) => (
          <Flaeche key={i} satz={beton} x0={x} x1={x + 0.65} z0={-0.45} z1={0.65} h={0.05} kachel={1} farbe="#d9d5cc" />
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

      <Instanzen url="/3d/models/outdoor_table_chair_set_01.glb" orte={[{ x: -3.2, z: 5.75, rot: 0 }]} zielHoehe={0.95} fortschritt={fortschritt} />
      <Instanzen
        url="/3d/models/potted_plant_02.glb"
        orte={[
          { x: -6.7, z: -0.9, s: 1 },
          { x: -6.7, z: 1.15, s: 0.9 },
          { x: 4.9, z: 4.9, s: 1.1 },
        ]}
        zielHoehe={1.1}
        fortschritt={fortschritt}
      />
    </>
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

// ── Licht: helle Mittagssonne wie bei einem Drohnenflug an einem klaren Tag ──
function Licht() {
  return (
    <directionalLight
      position={[-11, 17, 9]}
      color="#fff6ea"
      intensity={5}
      castShadow
      shadow-mapSize={[2048, 2048]}
      shadow-bias={-0.0003}
      shadow-normalBias={0.03}
      shadow-radius={4}
      shadow-camera-left={-20}
      shadow-camera-right={20}
      shadow-camera-top={20}
      shadow-camera-bottom={-20}
      shadow-camera-near={1}
      shadow-camera-far={60}
    />
  );
}

// ── Kamerafahrt ──
type Blick = { theta: number; phi: number; dist: number; ziel: number };
const BLICKE: [number, Blick][] = [
  [0, { theta: 0, phi: 89.5, dist: 26, ziel: 0 }],
  [0.28, { theta: 0, phi: 89.5, dist: 26, ziel: 0 }],
  [0.44, { theta: -28, phi: 52, dist: 26, ziel: 0.8 }],
  [0.6, { theta: -34, phi: 44, dist: 28, ziel: 1.8 }],
  [0.8, { theta: -10, phi: 42, dist: 34, ziel: 2.2 }],
  [1, { theta: 26, phi: 38, dist: 40, ziel: 2.4 }],
];

/**
 * Catmull-Rom über die Blickpunkte: die Kamera gleitet ohne Halt durch alle
 * Punkte, statt an jedem abzubremsen und neu anzufahren.
 */
function blickBei(p: number): Blick {
  const n = BLICKE.length;
  let i = 0;
  while (i < n - 2 && p > BLICKE[i + 1][0]) i++;
  const [t0, a] = BLICKE[i];
  const [t1, b] = BLICKE[i + 1];
  const vor = BLICKE[Math.max(0, i - 1)];
  const nach = BLICKE[Math.min(n - 1, i + 2)];
  const t = clamp01((p - t0) / (t1 - t0 || 1));
  const h00 = 2 * t ** 3 - 3 * t ** 2 + 1;
  const h10 = t ** 3 - 2 * t ** 2 + t;
  const h01 = -2 * t ** 3 + 3 * t ** 2;
  const h11 = t ** 3 - t ** 2;
  const k = (key: keyof Blick) => {
    // Steigungen je Parameter-Einheit, auf die Segmentlänge skaliert
    // An Haltepunkten (gleicher Wert davor/danach) steht die Kamera still, ohne Überschwingen
    const halt = a[key] === b[key];
    const m0 = i === 0 || halt || vor[1][key] === a[key] ? 0 : ((b[key] - vor[1][key]) / (t1 - vor[0])) * (t1 - t0);
    const m1 = i + 1 === n - 1 || halt || nach[1][key] === b[key] ? 0 : ((nach[1][key] - a[key]) / (nach[0] - t0)) * (t1 - t0);
    return h00 * a[key] + h10 * m0 + h01 * b[key] + h11 * m1;
  };
  return { theta: k("theta"), phi: k("phi"), dist: k("dist"), ziel: k("ziel") };
}

function Kamera({ fortschritt }: { fortschritt: MotionValue<number> }) {
  const { camera, size } = useThree();
  const ziel = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    const p = fortschritt.get();
    const b = blickBei(p);
    // Hochformat (Handy): etwas mehr Abstand, damit das Haus ins Bild passt
    const hoch = size.width < size.height ? 1.35 : 1;
    // Bildausschnitt nach oben schieben: unten liegt die Textkarte, das Haus bleibt frei sichtbar
    // und im Querformat nach rechts, neben die Textkarte
    const rein = glatt(clamp01((p - 0.45) / 0.2));
    const quer = size.width > size.height ? -size.width * 0.13 * rein : 0;
    camera.setViewOffset(size.width, size.height, quer, size.height * 0.12 * rein, size.width, size.height);
    const th = THREE.MathUtils.degToRad(b.theta);
    const ph = THREE.MathUtils.degToRad(Math.min(89.5, b.phi));
    const d = b.dist * hoch;
    camera.position.set(Math.sin(th) * Math.cos(ph) * d, Math.sin(ph) * d, Math.cos(th) * Math.cos(ph) * d);
    ziel.set(0, b.ziel, 0);
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
      shadows="soft"
      dpr={[1, 1.5]}
      camera={{ fov: 32, near: 0.5, far: 200, position: [0, 25, 0.01] }}
      gl={{ antialias: false, toneMapping: THREE.NoToneMapping }}
    >
      <color attach="background" args={["#eeece5"]} />
      <Suspense fallback={null}>
        {/* Licht aus einem echten HDR-Panorama (Poly Haven „meadow_2“, CC0); Himmel und Horizont aus demselben Foto, auf den Boden projiziert */}
        <Environment files="/3d/wiese.hdr" environmentIntensity={1.35} />
        <Environment files="/3d/wiese.jpg" background="only" ground={{ height: 9, radius: 140, scale: 320 }} />
        <Licht />
        <PlanBlatt planSvg={planSvg} fortschritt={fortschritt} onBereit={onBereit} />
        <Boden fortschritt={fortschritt} />
        <Waende fortschritt={fortschritt} />
        <Oeffnungen fortschritt={fortschritt} />
        <Obergeschoss fortschritt={fortschritt} />
        <Dach fortschritt={fortschritt} />
        <Pergola fortschritt={fortschritt} />
        <Sockelfarbe fortschritt={fortschritt} />
        <Garten fortschritt={fortschritt} />
        <Einrichtung fortschritt={fortschritt} />
        <Kamera fortschritt={fortschritt} />
      </Suspense>
      <EffectComposer multisampling={0}>
        <N8AO halfRes quality="performance" aoRadius={1.2} intensity={1.8} distanceFalloff={0.6} />
        <Bloom mipmapBlur luminanceThreshold={1.2} intensity={0.35} />
        <ToneMapping mode={ToneMappingMode.NEUTRAL} />
        <Vignette offset={0.3} darkness={0.3} />
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
