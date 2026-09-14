"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SiteNav, SiteFooter } from "@/components/SiteNav";
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

      <section className="px-6 md:px-10 pt-14 pb-8 max-w-5xl mx-auto">
        <span className="font-mono text-xs uppercase tracking-wide text-fg-muted border border-line rounded-full px-3 py-1">
          Kalkulationsgrundlage
        </span>
        <h1 className="mt-5 font-display font-black uppercase leading-[0.95] tracking-tight text-[clamp(1.9rem,4.5vw,3rem)]">
          Einheitspreise
        </h1>
        <p className="mt-5 text-lg text-fg-muted max-w-2xl leading-relaxed">
          Hinterlege hier die Preise deines Betriebs. Bei jeder Planauswertung wird daraus neben der Mengenermittlung
          automatisch eine Kostenschätzung gerechnet. Leere Felder verwenden den Richtwert.
        </p>

        <div className="mt-6 rounded-lg border-2 border-alert bg-surface-2 overflow-hidden">
          <p className="bg-alert text-surface font-mono text-xs uppercase tracking-wide px-5 py-2.5 font-semibold">
            Die Richtwerte sind keine Marktpreise
          </p>
          <p className="px-5 py-4 text-sm text-fg-muted">
            Sie sind Platzhalter, damit die Schätzung ab dem ersten Plan etwas liefert. Jede Position im Massenauszug
            weist aus, ob ihr Betrag auf einem eigenen Preis oder auf einem Richtwert beruht — und die Gesamtsumme
            nennt den Anteil, der noch auf fremden Zahlen steht.
          </p>
        </div>
      </section>

      <section className="px-6 md:px-10 pb-10 max-w-5xl mx-auto">
        <div className="sticky top-0 z-10 bg-surface border-b border-line py-4 flex flex-wrap items-center gap-4">
          <span className="font-mono text-xs uppercase tracking-wide text-fg-muted">
            {geladen ? `${anzahlEigene} von ${PREISKATALOG.length} Positionen mit eigenem Preis` : "Wird geladen"}
          </span>
          <div className="flex gap-3 ml-auto">
            <button
              type="button"
              onClick={zuruecksetzen}
              className="font-display font-bold uppercase tracking-wide text-sm px-4 py-2.5 border border-line-strong rounded-md hover:bg-surface-2"
            >
              Zurücksetzen
            </button>
            <button
              type="button"
              onClick={sichern}
              className="font-display font-bold uppercase tracking-wide text-sm px-6 py-2.5 bg-line-strong text-surface rounded-md"
            >
              Sichern
            </button>
          </div>
        </div>

        {meldung && (
          <p className="mt-4 rounded-md border border-highlight/40 bg-highlight/10 px-5 py-3 text-sm">{meldung}</p>
        )}

        <div className="mt-8 flex flex-col gap-10">
          {GRUPPEN.map((gruppe) => {
            const positionen = PREISKATALOG.filter((p) => gruppe.lgs.includes(p.lg));
            if (positionen.length === 0) return null;

            return (
              <div key={gruppe.titel} className="flex flex-col gap-3">
                <h2 className="font-display font-bold uppercase text-lg border-b-2 border-line-strong pb-2">
                  {gruppe.titel}
                </h2>
                <div className="overflow-x-auto rounded-lg border border-line bg-surface-2">
                  <table className="w-full text-sm min-w-[560px]">
                    <thead>
                      <tr className="bg-surface font-mono text-xs uppercase tracking-wide text-fg-muted text-left">
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
                          <td className="px-4 py-2.5 font-mono text-xs text-fg-muted">{p.lg ?? "—"}</td>
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
                              placeholder="—"
                              value={eigene[p.schluessel] ?? ""}
                              onChange={(e) => setzePreis(p.schluessel, e.target.value)}
                              aria-label={`Eigener Preis für ${p.bezeichnung} in Euro je ${EINHEIT_TEXT[p.einheit]}`}
                              className="w-28 rounded-md border border-line bg-surface px-3 py-1.5 text-right font-mono font-num text-sm focus:border-line-strong outline-none"
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
