/**
 * Schätzt, wie lange eine Planauswertung dauert. Die Koeffizienten werden aus
 * den gemessenen Laufzeiten gelernt und nähern sich mit jeder Auswertung der
 * Wirklichkeit an. Ohne Messungen gelten die Startwerte.
 *
 *   Sekunden = grund + jeRunde × Runden + jeKachel × Kacheln
 *
 * Eine Runde sind bis zu drei Blätter, die gleichzeitig ausgewertet werden.
 */
export interface DauerModell {
  grund: number;
  jeRunde: number;
  jeKachel: number;
  proben: number;
}

export interface DauerProbe {
  blaetter: number;
  kacheln: number;
  sekunden: number;
  modell: string;
  zeit: string;
}

export const START_MODELL: DauerModell = { grund: 45, jeRunde: 45, jeKachel: 4, proben: 0 };

export function runden(blaetter: number): number {
  return Math.ceil(Math.max(1, blaetter) / 3);
}

export function schaetze(m: DauerModell, blaetter: number, kacheln: number): number {
  return Math.max(10, m.grund + m.jeRunde * runden(blaetter) + m.jeKachel * kacheln);
}

/**
 * Kleinste Quadrate mit Zug zu den Startwerten. Bei wenigen Messungen
 * bestimmen die Startwerte, mit wachsender Zahl die Messungen. Neuere Proben
 * wiegen mehr, weil sich Modell und Ablauf ändern.
 */
export function lerne(proben: DauerProbe[]): DauerModell {
  const gueltig = proben.filter((p) => p.sekunden > 5 && p.sekunden < 400);
  if (gueltig.length === 0) return START_MODELL;

  const prior = [START_MODELL.grund, START_MODELL.jeRunde, START_MODELL.jeKachel];
  const zug = 3; // entspricht etwa drei Messungen Gewicht für die Startwerte
  // Normalgleichungen (XᵀWX + λI) β = XᵀWy + λ·prior
  const A = [
    [zug, 0, 0],
    [0, zug, 0],
    [0, 0, zug],
  ];
  const b = prior.map((p) => p * zug);
  gueltig.forEach((p, i) => {
    const w = Math.pow(0.98, gueltig.length - 1 - i);
    const x = [1, runden(p.blaetter), p.kacheln];
    for (let r = 0; r < 3; r++) {
      b[r] += w * x[r] * p.sekunden;
      for (let c = 0; c < 3; c++) A[r][c] += w * x[r] * x[c];
    }
  });
  const [grund, jeRunde, jeKachel] = loese(A, b);
  return {
    grund: Math.max(5, grund),
    jeRunde: Math.max(5, jeRunde),
    jeKachel: Math.max(0, jeKachel),
    proben: gueltig.length,
  };
}

/** Gauß-Elimination für das 3×3-System. */
function loese(A: number[][], b: number[]): number[] {
  const m = A.map((z, i) => [...z, b[i]]);
  for (let i = 0; i < 3; i++) {
    let max = i;
    for (let k = i + 1; k < 3; k++) if (Math.abs(m[k][i]) > Math.abs(m[max][i])) max = k;
    [m[i], m[max]] = [m[max], m[i]];
    for (let k = i + 1; k < 3; k++) {
      const f = m[k][i] / m[i][i];
      for (let j = i; j < 4; j++) m[k][j] -= f * m[i][j];
    }
  }
  const x = [0, 0, 0];
  for (let i = 2; i >= 0; i--) {
    let summe = m[i][3];
    for (let j = i + 1; j < 3; j++) summe -= m[i][j] * x[j];
    x[i] = summe / m[i][i];
  }
  return x;
}
