import katalog from "@/data/lbhb023.json";
import type { ElementType } from "./types";

export interface LbhbPosition {
  nummer: string;
  kurztext: string;
  einheit: string;
}

export interface LbhbUntergruppe {
  ulg: string;
  bezeichnung: string;
  positionen?: LbhbPosition[];
}

export interface LbhbLeistungsgruppe {
  lg: string;
  bezeichnung: string;
  untergruppen?: LbhbUntergruppe[];
}

export interface LbhbTreffer {
  lg: string;
  bezeichnung: string;
}

const LG_INDEX = new Map<string, LbhbLeistungsgruppe>(
  (katalog.leistungsgruppen as LbhbLeistungsgruppe[]).map((g) => [g.lg, g]),
);

/**
 * Materialangaben kommen aus der Planlegende und sind entsprechend uneinheitlich
 * geschrieben ("Stahlbeton", "STB", "GK-Ständerwand"). Vor dem Abgleich mit der
 * Zuordnungstabelle werden sie auf eine kanonische Form gebracht.
 */
export function normalisiereMaterial(material: string | undefined | null): string | null {
  if (!material) return null;
  const normalisiert = material
    .toLowerCase()
    .trim()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[\s_/]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");

  return normalisiert === "" ? null : (ALIASE[normalisiert] ?? normalisiert);
}

const ALIASE: Record<string, string> = {
  stb: "stahlbeton",
  "stahl-beton": "stahlbeton",
  eisenbeton: "stahlbeton",
  ziegelmauerwerk: "ziegel",
  mauerwerk: "ziegel",
  hochlochziegel: "ziegel",
  alu: "aluminium",
  "holz-alu": "holz-aluminium",
  "kunststoff-alu": "kunststoff-aluminium",
  pvc: "kunststoff",
  gk: "gk-staenderwand",
  gipskarton: "gk-staenderwand",
  "gk-staenderwand": "gk-staenderwand",
  holzkonstruktion: "holz",
  bsh: "holz",
  brettschichtholz: "holz",
  vollholz: "holz",
  naturstein: "stein",
  steinzeug: "fliesen",
  parkettboden: "parkett",
  holzdielen: "dielen",
};

interface ZuordnungsRegel {
  type: string;
  material: string | null;
  lg: string[];
}

const REGELN = katalog.zuordnung as ZuordnungsRegel[];

/**
 * Liefert die Leistungsgruppen für ein erkanntes Bauteil. Ausgewertet wird von
 * der spezifischsten Regel (Typ + Material) zur allgemeinsten (Typ, Material
 * offen). Ein leeres Ergebnis heißt: für diese Kombination ist im Katalog noch
 * keine belegte Leistungsgruppe hinterlegt.
 */
export function findeLeistungsgruppen(type: ElementType, material?: string | null): LbhbTreffer[] {
  const normalisiert = normalisiereMaterial(material);

  const regel =
    (normalisiert !== null && REGELN.find((r) => r.type === type && r.material === normalisiert)) ||
    REGELN.find((r) => r.type === type && r.material === null);

  if (!regel) return [];

  return regel.lg.flatMap((lg) => {
    const gruppe = LG_INDEX.get(lg);
    return gruppe ? [{ lg: gruppe.lg, bezeichnung: gruppe.bezeichnung }] : [];
  });
}

export function katalogInfo() {
  return {
    katalog: katalog.katalog,
    version: katalog.version,
    vollstaendig: katalog.vollstaendig,
    leistungsgruppen: katalog.leistungsgruppen.length,
  };
}
