"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { SiteNav, SiteFooter } from "@/components/SiteNav";
import { SeitenHero } from "@/components/Marketing";
import { PREISKATALOG, type Einheitspreise } from "@/lib/preise";
import {
  ladeEinheitspreise,
  loescheEinheitspreise,
  speichereEinheitspreise,
} from "@/lib/einheitspreise-speicher";

const EINHEIT_TEXT: Record<string, string> = {
  m2: "m²",
  m3: "m³",
  t: "t",
  lfm: "lfm",
  Stk: "Stk",
  EUR: "EUR",
};

const GRUPPEN: { titel: string; lgs: (string | null)[] }[] = [
  { titel: "Erdbau, Beton und Mauerwerk", lgs: ["03", "07", "08"] },
  { titel: "Estrich und Beläge", lgs: ["11", "24", "50"] },
  { titel: "Putz, Fassade und Malerei", lgs: ["23"] },
  { titel: "Dach und Spengler", lgs: ["15", "16", "18"] },
  { titel: "Fenster, Türen und Tischler", lgs: ["37", "43", "71"] },
  { titel: "Ohne Leistungsgruppe", lgs: [null] },
];

function euro(n: number): string {
  return n.toLocaleString("de-AT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function StartHinweis() {
  const start = useSearchParams().get("start") === "1";
  if (!start) return null;
  return (
    <section className="px-6 md:px-10 pt-10 max-w-5xl mx-auto">
      <div className="rounded-2xl border-2 border-highlight bg-surface-2 px-5 py-4 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[260px]">
          <p className="font-semibold">Willkommen. Lege zuerst deine Einheitspreise fest.</p>
          <p className="mt-1 text-sm text-fg-muted">
            Einmal hinterlegt, rechnet MengenWerk jede Planauswertung mit den Preisen deines Betriebs. Du kannst das
            auch später erledigen: Nach dem ersten Scan fragt MengenWerk die fehlenden Preise ab.
          </p>
        </div>
        <Link href="/app" className="font-semibold text-sm px-5 py-2.5 rounded-xl border border-line-strong hover:bg-surface">
          Später, zur Planauswertung
        </Link>
      </div>
    </section>
  );
}

export default function EinheitspreisePage() {
  const [eigene, setEigene] = useState<Einheitspreise>({});
  const [geladen, setGeladen] = useState(false);
  const [meldung, setMeldung] = useState<string | null>(null);

  useEffect(() => {
    setEigene(ladeEinheitspreise());
    setGeladen(true);
  }, []);

  const anzahlEigene = useMemo(() => Object.keys(eigene).length, [eigene]);

  function setzePreis(schluessel: string, roh: string) {
    setMeldung(null);
    setEigene((vorher) => {
      const naechste = { ...vorher };
      const wert = Number(roh.replace(",", "."));
      if (roh.trim() === "" || !Number.isFinite(wert) || wert < 0) {
        delete naechste[schluessel];
      } else {
        naechste[schluessel] = wert;
      }
      return naechste;
    });
  }

  function sichern() {
    const ok = speichereEinheitspreise(eigene);
    setMeldung(
      ok
        ? `${anzahlEigene} eigene Preise gesichert. Sie gelten ab der nächsten Planauswertung.`
        : "Der Browser lässt kein Speichern zu. Die Preise gelten nur für diese Sitzung.",
    );
  }

  function zuruecksetzen() {
    loescheEinheitspreise();
    setEigene({});
    setMeldung("Alle eigenen Preise entfernt. Es gelten wieder die Richtwerte.");
  }

  return (
    <main className="flex-1">
      <SiteNav />

      <SeitenHero
        eyebrow="Kalkulationsgrundlage"
        titel="Einheitspreise"
        text="Hinterlege hier die Preise deines Betriebs. Bei jeder Planauswertung wird daraus neben der Mengenermittlung automatisch eine Kostenschätzung gerechnet. Leere Felder verwenden den Richtwert."
      />

      <Suspense>
        <StartHinweis />
      </Suspense>

      <section className="px-6 md:px-10 pt-10 pb-8 max-w-5xl mx-auto">
        <div className="rounded-2xl border-2 border-alert bg-surface-2 overflow-hidden">
          <p className="bg-alert text-alert-fg text-[11px] font-semibold uppercase tracking-[0.14em] px-5 py-2.5 font-semibold">
            Die Richtwerte sind keine Marktpreise
          </p>
          <p className="px-5 py-4 text-sm text-fg-muted">
            Sie sind Platzhalter, damit die Schätzung ab dem ersten Plan etwas liefert. Jede Position im Massenauszug
            weist aus, ob ihr Betrag auf einem eigenen Preis oder auf einem Richtwert beruht. Die Gesamtsumme
            nennt den Anteil, der noch auf fremden Zahlen steht.
          </p>
        </div>
      </section>

      <section className="px-6 md:px-10 pb-10 max-w-5xl mx-auto">
        <div className="sticky top-0 z-10 bg-surface border-b border-line py-4 flex flex-wrap items-center gap-4">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-muted">
            {geladen ? `${anzahlEigene} von ${PREISKATALOG.length} Positionen mit eigenem Preis` : "Wird geladen"}
          </span>
          <div className="flex gap-3 ml-auto">
            <button
              type="button"
              onClick={zuruecksetzen}
              className="font-semibold text-sm px-4 py-2.5 border border-line-strong rounded-xl hover:bg-surface-2"
            >
              Zurücksetzen
            </button>
            <button
              type="button"
              onClick={sichern}
              className="font-semibold text-sm px-6 py-2.5 bg-accent text-accent-fg rounded-xl"
            >
              Sichern
            </button>
          </div>
        </div>

        {meldung && (
          <p className="mt-4 rounded-xl border border-highlight/40 bg-highlight/10 px-5 py-3 text-sm">{meldung}</p>
        )}

        <div className="mt-8 flex flex-col gap-10">
          {GRUPPEN.map((gruppe) => {
            const positionen = PREISKATALOG.filter((p) => gruppe.lgs.includes(p.lg));
            if (positionen.length === 0) return null;

            return (
              <div key={gruppe.titel} className="flex flex-col gap-3">
                <h2 className="font-display font-semibold text-lg border-b-2 border-line-strong pb-2">
                  {gruppe.titel}
                </h2>
                <div className="overflow-x-auto rounded-2xl border border-line bg-surface-2">
                  <table className="w-full text-sm min-w-[560px]">
                    <thead>
                      <tr className="bg-surface text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-muted text-left">
                        <th className="px-4 py-3 font-medium">LG</th>
                        <th className="px-4 py-3 font-medium">Position</th>
                        <th className="px-4 py-3 font-medium text-right">Richtwert</th>
                        <th className="px-4 py-3 font-medium text-right">Eigener Preis</th>
                        <th className="px-4 py-3 font-medium">Je</th>
                      </tr>
                    </thead>
                    <tbody>
                      {positionen.map((p) => (
                        <tr key={p.schluessel} className="border-t border-line">
                          <td className="px-4 py-2.5 font-mono text-xs text-fg-muted">{p.lg ?? "-"}</td>
                          <td className="px-4 py-2.5">
                            {p.bezeichnung}
                            {p.hinweis && <span className="block text-xs text-fg-muted mt-0.5">{p.hinweis}</span>}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono font-num text-fg-muted">
                            {euro(p.richtwert)}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <input
                              type="number"
                              inputMode="decimal"
                              min={0}
                              step="0.01"
                              placeholder="-"
                              value={eigene[p.schluessel] ?? ""}
                              onChange={(e) => setzePreis(p.schluessel, e.target.value)}
                              aria-label={`Eigener Preis für ${p.bezeichnung} in Euro je ${EINHEIT_TEXT[p.einheit]}`}
                              className="w-28 rounded-xl border border-line bg-surface px-3 py-1.5 text-right font-mono font-num text-sm focus:border-line-strong outline-none"
                            />
                          </td>
                          <td className="px-4 py-2.5 font-mono text-xs text-fg-muted">
                            EUR / {EINHEIT_TEXT[p.einheit]}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-10 text-sm text-fg-muted">
          Die Preise liegen im Speicher dieses Browsers und werden nicht an den Server übertragen, außer für die Dauer
          einer Planauswertung.{" "}
          <Link href="/app" className="text-fg underline underline-offset-4">
            Plan analysieren
          </Link>
        </p>
      </section>

      <SiteFooter />
    </main>
  );
}
