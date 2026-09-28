"use client";

import { useState } from "react";
import type { AnnahmeId } from "@/lib/annahmen";
import { beschreibe, fuehreZusammen, istLeer, leseKorrektur, type Korrekturen } from "@/lib/korrekturen";

type Eintrag = { text: string; entferne: (k: Korrekturen) => Korrekturen };

function eintraege(k: Korrekturen): Eintrag[] {
  const ohne = <T extends Record<string, unknown>>(o: T, key: string) => {
    const kopie = { ...o };
    delete kopie[key];
    return kopie;
  };
  return [
    ...Object.keys(k.raumhoehe).map((g) => ({
      text: beschreibe({ raumhoehe: { [g]: k.raumhoehe[g] }, deckenUnterkante: {}, annahmen: {} })[0],
      entferne: (x: Korrekturen) => ({ ...x, raumhoehe: ohne(x.raumhoehe, g) }),
    })),
    ...Object.keys(k.deckenUnterkante).map((g) => ({
      text: beschreibe({ raumhoehe: {}, deckenUnterkante: { [g]: k.deckenUnterkante[g] }, annahmen: {} })[0],
      entferne: (x: Korrekturen) => ({ ...x, deckenUnterkante: ohne(x.deckenUnterkante, g) }),
    })),
    ...(Object.keys(k.annahmen) as AnnahmeId[]).map((id) => ({
      text: beschreibe({ raumhoehe: {}, deckenUnterkante: {}, annahmen: { [id]: k.annahmen[id] } })[0],
      entferne: (x: Korrekturen) => ({ ...x, annahmen: ohne(x.annahmen, id) }),
    })),
  ];
}

/**
 * Korrekturen in eigenen Worten: "Raumhöhe ist 2,90 m, abgehängte Decke UK 2,75 m".
 * Typische Sätze werden direkt im Browser gelesen; alles andere deutet die KI.
 */
export function KorrekturFeld({
  korrekturen,
  geschosse,
  onAendern,
}: {
  korrekturen: Korrekturen;
  geschosse: string[];
  onAendern: (k: Korrekturen) => void;
}) {
  const [text, setText] = useState("");
  const [laedt, setLaedt] = useState(false);
  const [meldung, setMeldung] = useState<{ art: "ok" | "fehler"; text: string } | null>(null);

  async function anwenden() {
    const eingabe = text.trim();
    if (!eingabe) return;
    setMeldung(null);

    let neu = leseKorrektur(eingabe);
    if (istLeer(neu)) {
      setLaedt(true);
      try {
        const res = await fetch("/api/korrektur", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: eingabe, geschosse }),
        });
        const json = (await res.json()) as { korrekturen?: Korrekturen; fehler?: string };
        if (!res.ok || !json.korrekturen) {
          setMeldung({ art: "fehler", text: json.fehler ?? "Die Korrektur konnte nicht ausgewertet werden." });
          return;
        }
        neu = json.korrekturen;
      } catch {
        setMeldung({ art: "fehler", text: "Keine Verbindung zum Server." });
        return;
      } finally {
        setLaedt(false);
      }
    }

    if (istLeer(neu)) {
      setMeldung({
        art: "fehler",
        text: "Darin wurde kein Wert gefunden, den die Mengenermittlung verwendet. Beispiel: „Raumhöhe 2,90 m, abgehängte Decke UK 2,75 m“.",
      });
      return;
    }
    onAendern(fuehreZusammen(korrekturen, neu));
    setText("");
    setMeldung({ art: "ok", text: `Übernommen und neu gerechnet: ${beschreibe(neu).join(" · ")}` });
  }

  const liste = eintraege(korrekturen);

  return (
    <section className="rounded-2xl border border-line bg-surface-2 overflow-hidden">
      <div className="px-5 py-4 border-b border-line flex items-baseline justify-between gap-4 flex-wrap">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-muted">Korrektur an die Mengenermittlung</p>
        <p className="text-xs text-fg-muted">
          Wirkt überall, wo der Wert verwendet wird: Putz, Maler, Fliesen, Estrich, Beton …
        </p>
      </div>

      <div className="p-5 flex flex-col gap-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) anwenden();
          }}
          rows={3}
          placeholder="z. B. „Die Raumhöhe ist laut Schnitt 2,90 m statt 2,50 m. Abgehängte Decke Unterkante 2,75 m.“"
          className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-fg placeholder:text-fg-muted/70 focus:outline-none focus:border-accent resize-y"
        />
        <div className="flex items-center gap-4 flex-wrap">
          <button
            type="button"
            onClick={anwenden}
            disabled={laedt || !text.trim()}
            className="font-semibold text-sm px-6 py-2.5 rounded-xl bg-accent text-accent-fg disabled:opacity-40"
          >
            {laedt ? "Wird ausgewertet …" : "Korrektur anwenden"}
          </button>
          {meldung && (
            <p className={`text-sm ${meldung.art === "ok" ? "text-highlight" : "text-alert"}`}>{meldung.text}</p>
          )}
        </div>

        {liste.length > 0 && (
          <div className="mt-2 border-t border-line pt-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-muted mb-2">Aktive Korrekturen</p>
            <ul className="flex flex-col gap-1.5">
              {liste.map((e) => (
                <li key={e.text} className="flex items-center justify-between gap-4 text-sm">
                  <span>{e.text}</span>
                  <button
                    type="button"
                    onClick={() => onAendern(e.entferne(korrekturen))}
                    className="font-mono text-xs text-fg-muted hover:text-fg underline"
                  >
                    entfernen
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
