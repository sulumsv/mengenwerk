"use client";

import { useEffect, useState } from "react";
import { schaetze, START_MODELL, type DauerModell } from "@/lib/dauer-modell";

const SCHRITTE = [
  "Plan wird eingelesen",
  "Räume und Raumstempel werden erkannt",
  "Wände, Fenster und Türen werden vermessen",
  "Mengen werden nach LB-HB 023 berechnet",
];

const MARKEN = [
  { x: 18, y: 24, t: "Raum erkannt" },
  { x: 62, y: 18, t: "Maßkette" },
  { x: 30, y: 62, t: "Fenster" },
  { x: 70, y: 58, t: "Wandlänge" },
  { x: 48, y: 40, t: "Raumstempel" },
  { x: 14, y: 80, t: "Tür" },
];

/** Bis 90 % linear, danach nähert sich die Anzeige 99 % an, ohne sie zu erreichen. */
function anzeigeAnteil(anteil: number): number {
  if (anteil < 0.9) return anteil;
  return 0.9 + 0.09 * (1 - Math.exp(-(anteil - 0.9) * 3));
}

function alsZeit(sekunden: number): string {
  const s = Math.max(0, Math.round(sekunden));
  if (s < 60) return `${s} s`;
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")} min`;
}

export function ScanAnimation({
  bild,
  meldung,
  start,
  blaetter = 1,
  kacheln = 0,
  modell = START_MODELL,
}: {
  bild: string | null;
  meldung: string | null;
  start: number;
  blaetter?: number;
  kacheln?: number;
  /** Aus früheren Laufzeiten gelernte Schätzung. */
  modell?: DauerModell;
}) {
  const [jetzt, setJetzt] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setJetzt(Date.now()), 500);
    return () => clearInterval(t);
  }, []);

  const dauer = schaetze(modell, blaetter, kacheln);
  const vergangen = Math.max(0, (jetzt - start) / 1000);
  const anteil = anzeigeAnteil(vergangen / dauer);
  const prozent = Math.floor(anteil * 100);
  const rest = dauer - vergangen;
  const schritt = Math.min(SCHRITTE.length - 1, Math.floor(anteil * SCHRITTE.length));

  return (
    <div className="scan-buehne rounded-[1.75rem] p-5 md:p-8 text-white">
      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] items-center">
        <div className="plan-kippen relative mx-auto w-full max-w-[620px]">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/30 bg-white shadow-[0_30px_60px_-30px_rgba(0,0,0,0.6)]">
            {bild ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={bild} alt="Hochgeladener Plan" className="plan-einblenden h-full w-full object-contain" />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-[#5d6b78]">Vorschau wird erstellt …</div>
            )}
            <div className="scan-linie absolute inset-y-0 w-28 bg-gradient-to-r from-transparent via-[#f2b233]/50 to-transparent" />
            <div className="absolute inset-0 bg-[#1f2a44]/10" />
            {MARKEN.slice(0, 2 + schritt).map((m, i) => (
              <span
                key={m.t}
                className="marke absolute flex items-center gap-1.5 rounded-lg bg-[#1f2a44] px-2 py-1 text-[10px] font-semibold text-white shadow-lg"
                style={{ left: `${m.x}%`, top: `${m.y}%`, animationDelay: `${i * 0.7}s` }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[#f2b233]" />
                {m.t}
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#f2b233]">Analyse läuft</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">{meldung ?? SCHRITTE[schritt]}</p>
          <ol className="mt-6 space-y-3">
            {SCHRITTE.map((s, i) => (
              <li key={s} className="flex items-center gap-3 text-[14px]">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition ${
                    i < schritt ? "bg-[#f2b233] text-[#1f2a44]" : i === schritt ? "border-2 border-[#f2b233] text-[#f2b233]" : "border border-white/30 text-white/40"
                  }`}
                >
                  {i < schritt ? "✓" : i + 1}
                </span>
                <span className={i <= schritt ? "text-white" : "text-white/45"}>{s}</span>
                {i === schritt && <span className="punkte ml-1 text-[#f2b233]" />}
              </li>
            ))}
          </ol>
          <div className="mt-7">
            <div className="flex items-baseline justify-between">
              <span className="font-num text-3xl font-semibold">{prozent} %</span>
              <span className="font-num text-[13px] text-white/70">
                {rest > 0 ? `noch etwa ${alsZeit(rest)}` : "gleich fertig"}
              </span>
            </div>
            <div
              className="mt-3 h-2 overflow-hidden rounded-full bg-white/15"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={prozent}
            >
              <div className="h-full rounded-full bg-[#f2b233] transition-[width] duration-500 ease-linear" style={{ width: `${prozent}%` }} />
            </div>
            <div className="mt-2 flex justify-between font-num text-[12px] text-white/55">
              <span>Läuft seit {alsZeit(vergangen)}</span>
              <span>
                {blaetter} {blaetter === 1 ? "Blatt" : "Blätter"} · geschätzt {alsZeit(dauer)}
              </span>
            </div>
            {rest < -30 && (
              <p className="mt-3 text-xs text-white/70">Dieser Plan braucht länger als geschätzt. Die Auswertung läuft weiter.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
