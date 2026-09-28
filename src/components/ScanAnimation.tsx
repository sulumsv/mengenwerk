"use client";

import { useEffect, useState } from "react";

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

export function ScanAnimation({ bild, meldung }: { bild: string | null; meldung: string | null }) {
  const [schritt, setSchritt] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setSchritt((s) => Math.min(s + 1, SCHRITTE.length - 1)), 2600);
    return () => clearInterval(t);
  }, []);

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
          <p className="mt-6 text-xs text-white/55">Bei mehrseitigen Plänen kann das etwas dauern.</p>
        </div>
      </div>
    </div>
  );
}
