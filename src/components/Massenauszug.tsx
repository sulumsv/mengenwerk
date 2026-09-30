"use client";

import { useEffect, useMemo, useState } from "react";
import { mitKostenschaetzung, sortiereGeschosse } from "@/lib/ableitung";
import { ladeEinheitspreise } from "@/lib/einheitspreise-speicher";
import { PreisErfassung } from "./PreisErfassung";
import { PREISKATALOG, type Einheitspreise, EIGENE_PREISE_PFLICHT } from "@/lib/preise";
import type { Abschnitt, Konfidenz, Kostenschaetzung, Massenauszug, Position, Raum } from "@/lib/types";

const KONFIDENZ_TEXT: Record<Konfidenz, string> = {
  plan: "Aus Plan",
  berechnet: "Berechnet",
  annahme: "Annahme",
};

const KONFIDENZ_FARBE: Record<Konfidenz, string> = {
  plan: "bg-highlight",
  berechnet: "bg-accent",
  annahme: "bg-alert",
};

const EINHEIT_TEXT: Record<string, string> = {
  m2: "m²",
  m3: "m³",
  t: "t",
  lfm: "lfm",
  Stk: "Stk",
  EUR: "EUR",
};

function zahl(n: number, dez = 2): string {
  return n.toLocaleString("de-AT", { minimumFractionDigits: dez, maximumFractionDigits: dez });
}

function euro(n: number): string {
  return n.toLocaleString("de-AT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Die Kostenschätzung steht bewusst neben ihrem Richtwertanteil: eine Summe,
 * die zu weiten Teilen auf Katalogpreisen beruht, ist keine Kalkulation.
 */
function KostenBlock({ kosten, mitRichtwerten }: { kosten: Kostenschaetzung; mitRichtwerten: boolean }) {
  const anteil = kosten.summe > 0 ? (kosten.summeAusRichtwerten / kosten.summe) * 100 : 0;
  const eigenAnteil = kosten.summe > 0 ? 100 - anteil : 0;

  return (
    <section className="rounded-2xl border-2 border-highlight/60 overflow-hidden">
      <div className="bg-surface-2 border-b border-line text-fg px-5 py-4 flex flex-wrap items-baseline gap-x-6 gap-y-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em]">Kostenschätzung</span>
        <span className="font-mono font-num text-2xl font-semibold ml-auto">
          {euro(kosten.summe)}
          <span className="text-sm font-medium ml-1.5 text-fg-muted">EUR netto</span>
        </span>
      </div>
      <div className="bg-surface-2 px-5 py-4 grid sm:grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-muted">Aus eigenen Preisen</p>
          <p className="font-mono font-num text-lg mt-0.5">{zahl(eigenAnteil, 0)} %</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-muted">Aus Richtwerten</p>
          <p className="font-mono font-num text-lg mt-0.5">
            {mitRichtwerten ? (
              <>
                {zahl(anteil, 0)} %
                <span className="text-sm text-fg-muted ml-2">{euro(kosten.summeAusRichtwerten)} EUR</span>
              </>
            ) : (
              <span className="text-fg-muted">nicht verwendet</span>
            )}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-muted">Positionen</p>
          <p className="font-mono font-num text-lg mt-0.5">
            {kosten.bepreistePositionen}
            {kosten.unbepreistePositionen > 0 && (
              <span className="text-sm text-alert ml-2">{kosten.unbepreistePositionen} ohne Preis</span>
            )}
          </p>
        </div>
      </div>
      {!mitRichtwerten && kosten.unbepreistePositionen > 0 && (
        <p className="bg-alert/10 border-t border-alert/40 px-5 py-3 text-sm text-fg-muted">
          {kosten.bepreistePositionen === 0
            ? "Es sind noch keine eigenen Einheitspreise hinterlegt, deshalb ist die Summe leer."
            : `${kosten.unbepreistePositionen} Positionen haben keinen eigenen Preis und sind nicht in der Summe enthalten.`}{" "}
          Preise unter{" "}
          <a href="/einheitspreise" className="underline text-fg">
            Einheitspreise
          </a>{" "}
          hinterlegen oder fehlende Preise mit Richtwerten ergänzen.
        </p>
      )}
      {mitRichtwerten && anteil > 0 && (
        <p className="bg-alert/10 border-t border-alert/40 px-5 py-3 text-sm text-fg-muted">
          {anteil >= 99.5
            ? "Die Summe beruht vollständig auf Richtwerten aus dem Katalog. Sie ist eine Größenordnung, keine Kalkulation."
            : `${zahl(anteil, 0)} % der Summe beruhen auf Richtwerten statt auf eigenen Preisen.`}{" "}
          Eigene Preise werden unter Einheitspreise hinterlegt.
        </p>
      )}
    </section>
  );
}

/**
 * Mengen zuerst, Preise auf Wunsch: die Schätzung entsteht erst auf Klick
 * und nur aus den Preisen des Betriebs, Richtwerte nur wenn angehakt.
 */
function KostenSteuerung({
  aktiv,
  mitRichtwerten,
  onRichtwerte,
  onErstellen,
  onEntfernen,
}: {
  aktiv: boolean;
  mitRichtwerten: boolean;
  onRichtwerte: (v: boolean) => void;
  onErstellen: () => void;
  onEntfernen: () => void;
}) {
  const [eigeneAnzahl, setEigeneAnzahl] = useState<number | null>(null);
  useEffect(() => {
    setEigeneAnzahl(Object.keys(ladeEinheitspreise()).length);
  }, [aktiv]);

  return (
    <section className="rounded-2xl border border-line bg-surface-2 p-5 flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={onErstellen}
          className="font-semibold text-sm px-6 py-3 rounded-xl bg-highlight text-highlight-fg hover:brightness-110 transition"
        >
          {aktiv ? "Kostenschätzung aktualisieren" : "Kostenschätzung erstellen"}
        </button>
        {aktiv && (
          <button
            type="button"
            onClick={onEntfernen}
            className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-muted hover:text-fg underline"
          >
            Nur Mengen anzeigen
          </button>
        )}
        <label className="flex items-center gap-2 text-sm text-fg-muted cursor-pointer select-none">
          <input
            type="checkbox"
            checked={mitRichtwerten}
            onChange={(e) => onRichtwerte(e.target.checked)}
            className="accent-[var(--highlight)] w-4 h-4"
          />
          Fehlende Preise mit Richtwerten ergänzen
        </label>
      </div>
      <p className="text-sm text-fg-muted">
        {aktiv
          ? "Die Kostenschätzung verwendet deine Einheitspreise"
          : "Die Mengen sind fertig ermittelt. Auf Wunsch wird daraus eine Kostenschätzung mit deinen Einheitspreisen"}
        {eigeneAnzahl !== null && (
          <>
            , derzeit {eigeneAnzahl} von {PREISKATALOG.length} Positionen mit eigenem Preis hinterlegt.
          </>
        )}{" "}
        <a href="/einheitspreise" className="underline text-fg">
          Einheitspreise bearbeiten
        </a>
      </p>
    </section>
  );
}

function KonfidenzPunkt({ konfidenz }: { konfidenz: Konfidenz }) {
  return (
    <span className="flex items-center gap-2 whitespace-nowrap" title={KONFIDENZ_TEXT[konfidenz]}>
      <span className={`inline-block w-2.5 h-2.5 shrink-0 ${KONFIDENZ_FARBE[konfidenz]}`} aria-hidden="true" />
      <span className="sr-only">{KONFIDENZ_TEXT[konfidenz]}</span>
    </span>
  );
}

function Legende() {
  return (
    <div className="rounded-2xl border border-line bg-surface-2 p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-muted mb-3">Herkunft jeder Zahl</p>
      <div className="grid sm:grid-cols-3 gap-4">
        {(["plan", "berechnet", "annahme"] as const).map((k) => (
          <div key={k} className="flex gap-2.5 items-start text-sm">
            <span className={`inline-block w-2.5 h-2.5 mt-1.5 shrink-0 ${KONFIDENZ_FARBE[k]}`} aria-hidden="true" />
            <span>
              <b className="text-[11px] font-semibold uppercase tracking-[0.14em] block">{KONFIDENZ_TEXT[k]}</b>
              <span className="text-fg-muted">
                {k === "plan" && "Wert steht beschriftet im Plan."}
                {k === "berechnet" && "Aus bemaßten Planmaßen gerechnet."}
                {k === "annahme" && "Nicht im Plan enthalten. Vor Ausschreibung prüfen."}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Kennzahlen({ positionen }: { positionen: Position[] }) {
  if (positionen.length === 0) return null;
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {positionen.map((p) => (
        <div key={p.nummer} className="bg-surface-2 border border-line rounded-2xl p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-muted leading-snug">{p.bezeichnung}</p>
          <p className="font-mono font-num text-2xl font-semibold mt-1">
            {zahl(p.menge!)}
            <span className="text-sm font-medium text-fg-muted ml-1">{EINHEIT_TEXT[p.einheit]}</span>
          </p>
        </div>
      ))}
    </div>
  );
}

/**
 * Zahlfeld, das durch Klick editierbar wird. Akzeptiert Komma oder Punkt als
 * Dezimaltrenner, österreichische Eingabe funktioniert also direkt.
 */
function EditierbareZahl({
  wert,
  einheit,
  onAendern,
}: {
  wert: number;
  einheit: string;
  onAendern?: (v: number) => void;
}) {
  const [bearbeiten, setBearbeiten] = useState(false);
  const [eingabe, setEingabe] = useState("");

  function starten() {
    setEingabe(wert.toFixed(2).replace(".", ","));
    setBearbeiten(true);
  }

  function bestaetigen() {
    const n = parseFloat(eingabe.replace(",", "."));
    if (!isNaN(n) && n > 0) onAendern?.(n);
    setBearbeiten(false);
  }

  if (!onAendern) {
    return (
      <span className="font-mono font-num">
        {zahl(wert)} {einheit}
      </span>
    );
  }

  if (bearbeiten) {
    return (
      <span className="inline-flex items-center gap-1 justify-end">
        <input
          type="text"
          inputMode="decimal"
          value={eingabe}
          onChange={(e) => setEingabe(e.target.value)}
          onBlur={bestaetigen}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
            if (e.key === "Escape") setBearbeiten(false);
          }}
          autoFocus
          className="w-20 font-mono font-num text-right bg-surface border border-highlight rounded px-1 py-0.5 text-sm outline-none"
        />
        <span className="font-mono text-xs text-fg-muted">{einheit}</span>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={starten}
      title="Klicken zum Bearbeiten"
      className="font-mono font-num underline underline-offset-2 decoration-dotted cursor-pointer hover:text-highlight"
    >
      {zahl(wert)} {einheit}
    </button>
  );
}

function Raumbuch({
  raeume,
  onRaumAendern,
}: {
  raeume: Raum[];
  onRaumAendern?: (id: string, feld: "flaeche_m2" | "umfang_m", wert: number) => void;
}) {
  if (raeume.length === 0) return null;

  const geschosse = sortiereGeschosse([...new Set(raeume.map((r) => r.geschoss))]);
  const beheizt = raeume.filter((r) => r.beheizt).reduce((s, r) => s + r.flaeche_m2, 0);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-baseline gap-4 flex-wrap border-b-2 border-line-strong pb-2.5">
        <h3 className="font-display font-semibold text-xl">1. Raumbuch</h3>
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-muted ml-auto">
          Grundlage aller Folgepositionen
        </span>
      </div>
      {onRaumAendern && (
        <p className="text-xs text-fg-muted font-mono">
          Fläche und Umfang können durch Klick auf den Wert geändert werden. Die Auswertung passt sich sofort an.
        </p>
      )}
      <div className="overflow-x-auto rounded-2xl border border-line bg-surface-2">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="bg-surface text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-muted text-left">
              <th className="px-4 py-3 font-medium w-8"></th>
              <th className="px-4 py-3 font-medium">Raum</th>
              <th className="px-4 py-3 font-medium">Belag</th>
              <th className="px-4 py-3 font-medium text-right">Fläche</th>
              <th className="px-4 py-3 font-medium text-right">Umfang</th>
              <th className="px-4 py-3 font-medium">Beheizt</th>
            </tr>
          </thead>
          <tbody>
            {geschosse.map((g) => (
              <FragmentGeschoss
                key={g}
                geschoss={g}
                raeume={raeume.filter((r) => r.geschoss === g)}
                onRaumAendern={onRaumAendern}
              />
            ))}
            <tr className="bg-surface border-t-2 border-line-strong font-semibold">
              <td className="px-4 py-3"></td>
              <td className="px-4 py-3">Beheizte Nutzfläche</td>
              <td className="px-4 py-3"></td>
              <td className="px-4 py-3 text-right font-mono font-num">{zahl(beheizt)} m²</td>
              <td className="px-4 py-3"></td>
              <td className="px-4 py-3"></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

function FragmentGeschoss({
  geschoss,
  raeume,
  onRaumAendern,
}: {
  geschoss: string;
  raeume: Raum[];
  onRaumAendern?: (id: string, feld: "flaeche_m2" | "umfang_m", wert: number) => void;
}) {
  return (
    <>
      <tr className="bg-surface">
        <td colSpan={6} className="px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-muted">
          {geschoss}
        </td>
      </tr>
      {raeume.map((r) => (
        <tr key={r.id} className="border-t border-line">
          <td className="px-4 py-3">
            <KonfidenzPunkt konfidenz={r.konfidenz} />
          </td>
          <td className="px-4 py-3">{r.name}</td>
          <td className="px-4 py-3 text-fg-muted">{r.belag ?? "-"}</td>
          <td className="px-4 py-3 text-right">
            <EditierbareZahl
              wert={r.flaeche_m2}
              einheit="m²"
              onAendern={onRaumAendern ? (v) => onRaumAendern(r.id, "flaeche_m2", v) : undefined}
            />
          </td>
          <td className="px-4 py-3 text-right">
            <EditierbareZahl
              wert={r.umfang_m}
              einheit="m"
              onAendern={onRaumAendern ? (v) => onRaumAendern(r.id, "umfang_m", v) : undefined}
            />
            {r.umfangQuelle === "geschaetzt" && (
              <span className="text-alert ml-1" title="Aus der Fläche geschätzt">
                *
              </span>
            )}
          </td>
          <td className="px-4 py-3 text-fg-muted text-xs">{r.beheizt ? "ja" : "nein"}</td>
        </tr>
      ))}
    </>
  );
}

function AbschnittBlock({ abschnitt, mitPreisen }: { abschnitt: Abschnitt; mitPreisen: boolean }) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-baseline gap-4 flex-wrap border-b-2 border-line-strong pb-2.5">
        <h3 className="font-display font-semibold text-xl">
          {abschnitt.nummer}. {abschnitt.titel}
        </h3>
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-muted ml-auto">{abschnitt.lgHinweis}</span>
      </div>
      {abschnitt.vorspann && <p className="text-sm text-fg-muted max-w-3xl">{abschnitt.vorspann}</p>}
      {abschnitt.positionen.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-line bg-surface-2">
          <table className={`w-full text-sm ${mitPreisen ? "min-w-[980px]" : "min-w-[800px]"}`}>
            <thead>
              <tr className="bg-surface text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-muted text-left">
                <th className="px-4 py-3 font-medium w-8"></th>
                <th className="px-4 py-3 font-medium">Pos.</th>
                <th className="px-4 py-3 font-medium">Bezeichnung</th>
                <th className="px-4 py-3 font-medium">Rechenweg</th>
                <th className="px-4 py-3 font-medium text-right">Menge</th>
                <th className="px-4 py-3 font-medium">Einh.</th>
                {mitPreisen && <th className="px-4 py-3 font-medium text-right">EP</th>}
                {mitPreisen && <th className="px-4 py-3 font-medium text-right">Betrag</th>}
                <th className="px-4 py-3 font-medium">LB HB</th>
              </tr>
            </thead>
            <tbody>
              {abschnitt.positionen.map((p) => (
                <tr key={p.nummer} className="border-t border-line">
                  <td className="px-4 py-3">
                    <KonfidenzPunkt konfidenz={p.konfidenz} />
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-fg-muted">{p.nummer}</td>
                  <td className="px-4 py-3">
                    <span className="font-medium">{p.bezeichnung}</span>
                    {p.detail && <span className="block text-xs text-fg-muted mt-0.5">{p.detail}</span>}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-fg-muted">{p.rechenweg}</td>
                  <td className="px-4 py-3 text-right font-mono font-num whitespace-nowrap">
                    {p.menge === null ? <span className="text-fg-muted">-</span> : zahl(p.menge)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-fg-muted">{EINHEIT_TEXT[p.einheit]}</td>
                  {mitPreisen && (
                    <>
                  <td className="px-4 py-3 text-right font-mono font-num text-xs whitespace-nowrap">
                    {p.einheitspreis === undefined ? (
                      <span className="text-fg-muted">-</span>
                    ) : (
                      <span className={p.preisQuelle === "richtwert" ? "text-fg-muted" : undefined}>
                        {euro(p.einheitspreis)}
                        {p.preisQuelle === "richtwert" && (
                          <span className="text-alert ml-1" title="Richtwert, kein eigener Preis">
                            *
                          </span>
                        )}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-num whitespace-nowrap">
                    {p.betrag === undefined ? (
                      <span className="text-fg-muted" title={p.zwischenwert ? "Zwischenwert, Kosten in Folgeposition" : undefined}>
                        {p.zwischenwert ? "-" : "offen"}
                      </span>
                    ) : (
                      euro(p.betrag)
                    )}
                  </td>
                    </>
                  )}
                  <td className="px-4 py-3 text-xs text-fg-muted">{p.lgKandidaten.join(", ") || "-"}</td>
                </tr>
              ))}
              {mitPreisen && abschnitt.summe !== undefined && abschnitt.summe > 0 && (
                <tr className="bg-surface border-t-2 border-line-strong font-semibold">
                  <td className="px-4 py-3" colSpan={7}>
                    Summe {abschnitt.titel}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-num whitespace-nowrap">
                    {euro(abschnitt.summe)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-fg-muted">EUR</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/**
 * Lädt den Auszug als eigenständige HTML-Datei herunter. Sie trägt ihr
 * Stylesheet in sich, lässt sich also weiterreichen und ohne Netz öffnen.
 */
function Download({ auszug, titel }: { auszug: Massenauszug; titel: string }) {
  const [laedt, setLaedt] = useState(false);

  async function herunterladen() {
    setLaedt(true);
    try {
      const { massenauszugAlsPdf } = await import("@/lib/export-pdf");
      const blob = await massenauszugAlsPdf(auszug, titel, new Date());
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${titel.replace(/[^\w\d-]+/g, "-").replace(/^-|-$/g, "").toLowerCase() || "massenauszug"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      // Erst nach dem Klick freigeben, sonst bricht der Download in Safari ab.
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } finally {
      setLaedt(false);
    }
  }

  return (
    <button
      type="button"
      onClick={herunterladen}
      disabled={laedt}
      className="self-start font-semibold text-sm px-6 py-3 bg-accent text-accent-fg rounded-xl disabled:opacity-60"
    >
      {laedt ? "PDF wird erstellt" : "Massenauszug als PDF herunterladen"}
    </button>
  );
}

export function MassenauszugAnsicht({
  auszug,
  titel = "Massenauszug",
  onRaumAendern,
}: {
  auszug: Massenauszug;
  titel?: string;
  /** Wenn übergeben, werden Fläche und Umfang im Raumbuch durch Klick editierbar. */
  onRaumAendern?: (id: string, feld: "flaeche_m2" | "umfang_m", wert: number) => void;
}) {
  const [kostenAktiv, setKostenAktiv] = useState(!EIGENE_PREISE_PFLICHT);
  const [mitRichtwerten, setMitRichtwerten] = useState(!EIGENE_PREISE_PFLICHT);

  // Ohne Preispflicht steht die Kostenschätzung sofort da, eigene Preise gehen vor.
  useEffect(() => {
    if (!EIGENE_PREISE_PFLICHT) setEigene(ladeEinheitspreise());
  }, []);
  const [eigene, setEigene] = useState<Einheitspreise>({});
  const [fehlend, setFehlend] = useState<string[] | null>(null);

  function erstellen() {
    const preise = ladeEinheitspreise();
    const benoetigt = [
      ...new Set(
        auszug.abschnitte
          .flatMap((a) => a.positionen)
          .filter((p) => !p.zwischenwert && p.menge !== null && p.preisSchluessel)
          .map((p) => p.preisSchluessel!),
      ),
    ];
    const offen = benoetigt.filter((k) => preise[k] === undefined);
    // Ohne eigene Preise ergibt die Schätzung nichts. Erst fragen, dann rechnen.
    if (offen.length > 0 && !mitRichtwerten) {
      setFehlend(offen);
      return;
    }
    setEigene(preise);
    setKostenAktiv(true);
  }

  const angezeigt = useMemo(
    () => (kostenAktiv ? mitKostenschaetzung(auszug, eigene, mitRichtwerten) : auszug),
    [auszug, eigene, kostenAktiv, mitRichtwerten],
  );

  return (
    <div className="flex flex-col gap-10">
      <Download auszug={angezeigt} titel={titel} />
      <Legende />
      <Kennzahlen positionen={angezeigt.kennzahlen} />
      <KostenSteuerung
        aktiv={kostenAktiv}
        mitRichtwerten={mitRichtwerten}
        onRichtwerte={setMitRichtwerten}
        onErstellen={erstellen}
        onEntfernen={() => setKostenAktiv(false)}
      />
      {fehlend && (
        <PreisErfassung
          schluessel={fehlend}
          onAbbrechen={() => setFehlend(null)}
          onFertig={(preise) => {
            setFehlend(null);
            setEigene(preise);
            setKostenAktiv(true);
          }}
        />
      )}
      {angezeigt.kosten && <KostenBlock kosten={angezeigt.kosten} mitRichtwerten={mitRichtwerten} />}
      <Raumbuch raeume={angezeigt.raeume} onRaumAendern={onRaumAendern} />
      {angezeigt.abschnitte.map((a) => (
        <AbschnittBlock key={a.nummer} abschnitt={a} mitPreisen={kostenAktiv} />
      ))}

      {auszug.angewandteAnnahmen.length > 0 && (
        <section className="rounded-2xl border-2 border-alert overflow-hidden">
          <p className="bg-alert text-alert-fg text-[11px] font-semibold uppercase tracking-[0.14em] px-5 py-2.5 font-semibold">
            Diese Werte stehen nicht im Plan
          </p>
          <ul className="bg-surface-2 divide-y divide-line">
            {auszug.angewandteAnnahmen.map((a) => (
              <li key={a.id} className="px-5 py-4 grid sm:grid-cols-[200px_1fr] gap-1 sm:gap-6 text-sm">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] font-semibold">{a.titel}</span>
                <span className="text-fg-muted">
                  {a.begruendung} <span className="text-fg">{a.auswirkung}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {auszug.pruefpunkte.length > 0 && (
        <section className="rounded-2xl border-2 border-accent overflow-hidden">
          <p className="bg-accent text-accent-fg text-[11px] font-semibold uppercase tracking-[0.14em] px-5 py-2.5 font-semibold">
            Prüfpunkte im Plansatz
          </p>
          <ul className="bg-surface-2 divide-y divide-line">
            {auszug.pruefpunkte.map((p, i) => (
              <li key={i} className="px-5 py-4 text-sm text-fg-muted">
                {p}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
