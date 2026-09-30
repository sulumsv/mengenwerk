"use client";

import { useMemo, useState } from "react";
import { BAUTEIL_TITEL, type Bauteilart, type CadAuswertung } from "@/lib/cad-ebenen";

const PALETTE = ["#0f9d58", "#1a73e8", "#9334e6", "#e37400", "#d93025", "#12b5cb", "#b06000", "#5f6368", "#c5221f", "#188038"];

const zahl = (n: number) => n.toLocaleString("de-AT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function CadKontrolle({
  auswertung,
  bild,
  ausgeschlossen,
  umschalten,
}: {
  auswertung: CadAuswertung;
  bild: string | null;
  ausgeschlossen: Set<number>;
  umschalten: (index: number) => void;
}) {
  const seite = auswertung.seite;
  const [aus, setAus] = useState<Set<string>>(new Set());

  const gruppen = useMemo(() => {
    const reihenfolge: Bauteilart[] = ["aussenwand", "innenwand", "unterzug", "stuetze"];
    const dicken = [...new Set(auswertung.konturen.filter((k) => k.art !== "unterzug").map((k) => k.dicke_m))].sort((x, y) => x - y);
    const schluessel = [...new Set(auswertung.konturen.map((k) => `${k.art}|${k.dicke_m}`))];
    return schluessel
      .map((s) => {
        const [art, d] = s.split("|");
        const dicke = Number(d);
        const farbe = art === "unterzug" ? "#6b7280" : PALETTE[dicken.indexOf(dicke) % PALETTE.length];
        return { s, art: art as Bauteilart, dicke, farbe };
      })
      .sort((x, y) => reihenfolge.indexOf(x.art) - reihenfolge.indexOf(y.art) || x.dicke - y.dicke);
  }, [auswertung]);

  if (!seite || !bild) return null;
  const [a, b, c, d, e, f] = seite.transform;
  const punkt = ([x, y]: [number, number]) => `${a * x + c * y + e},${b * x + d * y + f}`;
  const farbeFuer = new Map(gruppen.map((g) => [g.s, g.farbe]));

  return (
    <section className="mt-8 rounded-2xl border border-[#e8ecef] bg-white overflow-hidden">
      <div className="border-b border-[#e8ecef] px-6 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#1f2a44]">Kontrollansicht</p>
        <p className="mt-1 text-sm text-[#5d6b78]">
          Jedes gezählte Bauteil ist farbig markiert. Ein Klick auf ein Bauteil nimmt es aus der Zählung, ein zweiter
          Klick zählt es wieder. Über die Legende lassen sich Gruppen ein- und ausblenden.
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {gruppen.map((g) => (
            <button
              key={g.s}
              type="button"
              onClick={() => {
                const neu = new Set(aus);
                if (neu.has(g.s)) neu.delete(g.s);
                else neu.add(g.s);
                setAus(neu);
              }}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[12px] transition ${
                aus.has(g.s) ? "border-[#e8ecef] text-[#8b98a4]" : "border-[#d5dde3] text-[#2b2d33]"
              }`}
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: aus.has(g.s) ? "#d5dde3" : g.farbe }} />
              {BAUTEIL_TITEL[g.art]} {zahl(g.dicke)} m
            </button>
          ))}
        </div>
      </div>
      <div className="relative bg-[#f7f9fb]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={bild} alt="Plan" className="block w-full h-auto opacity-45" />
        <svg viewBox={`0 0 ${seite.breite} ${seite.hoehe}`} className="absolute inset-0 h-full w-full" preserveAspectRatio="none" style={{ pointerEvents: "auto" }}>
          {auswertung.konturen.map((k, i) => {
            if (k.seite !== 1 || aus.has(`${k.art}|${k.dicke_m}`)) return null;
            const raus = ausgeschlossen.has(i);
            return (
              <polygon
                key={i}
                points={k.kontur.map(punkt).join(" ")}
                fill={raus ? "#ffffff" : farbeFuer.get(`${k.art}|${k.dicke_m}`)}
                fillOpacity={raus ? 0.6 : 0.85}
                stroke={raus ? "#9aa5b0" : "none"}
                strokeWidth={raus ? 1.5 : 0}
                strokeDasharray={raus ? "4 3" : undefined}
                className="cursor-pointer hover:opacity-70"
                onClick={() => umschalten(i)}
              >
                <title>
                  {BAUTEIL_TITEL[k.art]} {zahl(k.dicke_m)} m · {k.laenge_m.toFixed(1).replace(".", ",")} m
                  {raus ? " (ausgeschlossen)" : ""}
                </title>
              </polygon>
            );
          })}
        </svg>
      </div>
    </section>
  );
}
