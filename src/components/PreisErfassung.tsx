"use client";

import { useState } from "react";
import { preispositionFuer, type Einheitspreise } from "@/lib/preise";
import { ladeEinheitspreise, speichereEinheitspreise } from "@/lib/einheitspreise-speicher";

const EINHEIT_TEXT: Record<string, string> = { m2: "m²", m3: "m³", t: "t", lfm: "lfm", Stk: "Stk", EUR: "EUR" };

function euro(n: number): string {
  return n.toLocaleString("de-AT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Fragt die Einheitspreise ab, die für diesen Massenauszug fehlen. Gespeichert
 * wird zusammen mit den bereits hinterlegten Preisen, damit der nächste Plan
 * sie schon kennt.
 */
export function PreisErfassung({
  schluessel,
  onFertig,
  onAbbrechen,
}: {
  schluessel: string[];
  onFertig: (preise: Einheitspreise) => void;
  onAbbrechen: () => void;
}) {
  const positionen = schluessel.map(preispositionFuer).filter((p) => p !== undefined);
  const [werte, setWerte] = useState<Record<string, string>>(() => {
    const vorhanden = ladeEinheitspreise();
    return Object.fromEntries(schluessel.filter((k) => vorhanden[k] !== undefined).map((k) => [k, String(vorhanden[k])]));
  });

  function richtwerteEintragen() {
    setWerte((vorher) => {
      const naechste = { ...vorher };
      for (const p of positionen) if (!naechste[p.schluessel]?.trim()) naechste[p.schluessel] = String(p.richtwert);
      return naechste;
    });
  }

  function speichern() {
    const preise = ladeEinheitspreise();
    for (const [k, roh] of Object.entries(werte)) {
      const wert = Number(roh.replace(",", "."));
      if (roh.trim() !== "" && Number.isFinite(wert) && wert >= 0) preise[k] = wert;
    }
    speichereEinheitspreise(preise);
    onFertig(preise);
  }

  const ausgefuellt = positionen.filter((p) => werte[p.schluessel]?.trim()).length;

  return (
    <section className="rounded-2xl border-2 border-highlight bg-surface-2 overflow-hidden">
      <div className="px-5 py-4 border-b border-line">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-highlight">Einheitspreise festlegen</p>
        <p className="mt-1 text-sm text-fg-muted">
          Dieser Plan braucht {positionen.length} Einheitspreise. Trag deine eigenen Preise ein, sie werden gespeichert und
          gelten für alle weiteren Pläne. Leere Felder rechnen mit dem Richtwert daneben.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[520px]">
          <thead>
            <tr className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-muted text-left">
              <th className="px-5 py-3 font-medium">Position</th>
              <th className="px-5 py-3 font-medium text-right">Richtwert</th>
              <th className="px-5 py-3 font-medium text-right">Dein Preis</th>
              <th className="px-5 py-3 font-medium">Je</th>
            </tr>
          </thead>
          <tbody>
            {positionen.map((p) => (
              <tr key={p.schluessel} className="border-t border-line">
                <td className="px-5 py-2.5">{p.bezeichnung}</td>
                <td className="px-5 py-2.5 text-right font-num text-fg-muted">{euro(p.richtwert)}</td>
                <td className="px-5 py-2.5 text-right">
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    placeholder="-"
                    value={werte[p.schluessel] ?? ""}
                    onChange={(e) => setWerte({ ...werte, [p.schluessel]: e.target.value })}
                    aria-label={`Preis für ${p.bezeichnung} in Euro je ${EINHEIT_TEXT[p.einheit]}`}
                    className="w-28 rounded-lg border border-line bg-surface px-3 py-1.5 text-right font-num outline-none focus:border-line-strong"
                  />
                </td>
                <td className="px-5 py-2.5 text-xs text-fg-muted">EUR / {EINHEIT_TEXT[p.einheit]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center gap-3 border-t border-line px-5 py-4">
        <button
          type="button"
          onClick={speichern}
          className="font-semibold text-sm px-6 py-3 rounded-xl bg-highlight text-highlight-fg hover:brightness-110 transition"
        >
          Speichern und Kostenschätzung erstellen
        </button>
        <button
          type="button"
          onClick={richtwerteEintragen}
          className="font-semibold text-sm px-4 py-3 rounded-xl border border-line-strong hover:bg-surface"
        >
          Leere Felder mit Richtwerten füllen
        </button>
        <button type="button" onClick={onAbbrechen} className="text-sm text-fg-muted underline hover:text-fg">
          Abbrechen
        </button>
        <span className="ml-auto text-xs text-fg-muted font-num">
          {ausgefuellt} von {positionen.length} ausgefüllt
        </span>
      </div>
    </section>
  );
}
