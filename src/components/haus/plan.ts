// Gemeinsame Plandaten für den 2D-Grundriss und die 3D-Szene der Startseite.
// Plan-Einheiten: 440 Einheiten = 12,10 m Außenmaß.
// Plan-Einheiten: 440 Einheiten = 12,10 m Außenmaß.
export const PX_M = 440 / 12.1;
export const PLAN_W = 600;
export const PLAN_H = 420;

export const FARBE = {
  wohn: "#f6d5bf",
  nass: "#bfe0e6",
  neben: "#e6e1d6",
  wand: "#2f2b27",
  linie: "#5b5750",
};

type Oeffnung = [number, number, "fenster" | "tuer"];
export type Box = { x: number; y: number; w: number; d: number; k: number; z0: number; aussen: boolean };
export type Schlitz = { x: number; y: number; w: number; d: number; art: "fenster" | "tuer"; vertikal: boolean };

export const boxen: Box[] = [];
export const schlitze: Schlitz[] = [];

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
    if (art === "fenster") rect(a, b, 0.32, 0);
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

export const RAEUME = [
  { name: "Wohnen / Essen", x: 92, y: 52, w: 198, h: 128, fill: FARBE.wohn },
  { name: "Küche", x: 297, y: 52, w: 113, h: 128, fill: FARBE.wohn },
  { name: "Bad", x: 417, y: 52, w: 91, h: 128, fill: FARBE.nass },
  { name: "Vorraum / Gang", x: 92, y: 187, w: 416, h: 43, fill: FARBE.neben },
  { name: "Schlafen", x: 92, y: 237, w: 158, h: 121, fill: FARBE.wohn },
  { name: "Kind", x: 257, y: 237, w: 143, h: 121, fill: FARBE.wohn },
  { name: "WC", x: 407, y: 237, w: 101, h: 53, fill: FARBE.nass },
  { name: "HWR", x: 407, y: 297, w: 101, h: 61, fill: FARBE.neben },
].map((r) => ({ ...r, flaeche: (r.w / PX_M) * (r.h / PX_M) }));

export const m2 = (n: number) => n.toLocaleString("de-AT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const NUTZFLAECHE = RAEUME.reduce((s, r) => s + r.flaeche, 0);

const harc = (a: number, b: number, y: number, dir: 1 | -1) => {
  const r = b - a;
  return `M${a},${y} L${a},${y + dir * r} A${r},${r} 0 0 ${dir > 0 ? 0 : 1} ${b},${y}`;
};
const varc = (a: number, b: number, x: number, dir: 1 | -1) => {
  const r = b - a;
  return `M${x},${a} L${x + dir * r},${a} A${r},${r} 0 0 ${dir > 0 ? 1 : 0} ${x},${b}`;
};
export const TUERBOEGEN = [
  harc(200, 230, 180, -1),
  harc(330, 358, 180, -1),
  harc(440, 466, 180, -1),
  harc(150, 178, 237, 1),
  harc(300, 328, 237, 1),
  varc(250, 275, 407, 1),
  varc(310, 336, 407, 1),
  varc(192, 226, 92, 1),
];
