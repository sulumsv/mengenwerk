"use client";

import { sortiereGeschosse } from "@/lib/ableitung";
import { massenauszugAlsHtml } from "@/lib/export-html";
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
function KostenBlock({ kosten }: { kosten: Kostenschaetzung }) {
  const anteil = kosten.summe > 0 ? (kosten.summeAusRichtwerten / kosten.summe) * 100 : 0;
  const eigenAnteil = 100 - anteil;

  return (
    <section className="rounded-lg border-2 border-line-strong overflow-hidden">
      <div className="bg-line-strong text-surface px-5 py-4 flex flex-wrap items-baseline gap-x-6 gap-y-2">
        <span className="font-mono text-xs uppercase tracking-wide">Kostenschätzung</span>
        <span className="font-mono font-num text-2xl font-semibold ml-auto">
          {euro(kosten.summe)}
          <span className="text-sm font-medium ml-1.5 text-surface/70">EUR netto</span>
        </span>
      </div>
      <div className="bg-surface-2 px-5 py-4 grid sm:grid-cols-3 gap-4 text-sm">
        <div>
          <p className="font-mono text-xs uppercase tracking-wide text-fg-muted">Aus eigenen Preisen</p>
          <p className="font-mono font-num text-lg mt-0.5">{zahl(eigenAnteil, 0)} %</p>
        </div>
        <div>
          <p className="font-mono text-xs uppercase tracking-wide text-fg-muted">Aus Richtwerten</p>
          <p className="font-mono font-num text-lg mt-0.5">
            {zahl(anteil, 0)} %
            <span className="text-sm text-fg-muted ml-2">{euro(kosten.summeAusRichtwerten)} EUR</span>
          </p>
        </div>
        <div>
          <p className="font-mono text-xs uppercase tracking-wide text-fg-muted">Positionen</p>
          <p className="font-mono font-num text-lg mt-0.5">
            {kosten.bepreistePositionen}
            {kosten.unbepreistePositionen > 0 && (
              <span className="text-sm text-alert ml-2">{kosten.unbepreistePositionen} ohne Preis</span>
            )}
          </p>
        </div>
      </div>
      {anteil > 0 && (
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
    <div className="rounded-lg border border-line bg-surface-2 p-5">
      <p className="font-mono text-xs uppercase tracking-wide text-fg-muted mb-3">Herkunft jeder Zahl</p>
      <div className="grid sm:grid-cols-3 gap-4">
        {(["plan", "berechnet", "annahme"] as const).map((k) => (
          <div key={k} className="flex gap-2.5 items-start text-sm">
            <span className={`inline-block w-2.5 h-2.5 mt-1.5 shrink-0 ${KONFIDENZ_FARBE[k]}`} aria-hidden="true" />
            <span>
              <b className="font-mono text-xs uppercase tracking-wide block">{KONFIDENZ_TEXT[k]}</b>
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
        <div key={p.nummer} className="bg-surface-2 border border-line rounded-lg p-5">
          <p className="font-mono text-xs uppercase tracking-wide text-fg-muted leading-snug">{p.bezeichnung}</p>
          <p className="font-mono font-num text-2xl font-semibold mt-1">
            {zahl(p.menge!)}
            <span className="text-sm font-medium text-fg-muted ml-1">{EINHEIT_TEXT[p.einheit]}</span>
          </p>
        </div>
      ))}
    </div>
  );
}

function Raumbuch({ raeume }: { raeume: Raum[] }) {
  if (raeume.length === 0) return null;

  const geschosse = sortiereGeschosse([...new Set(raeume.map((r) => r.geschoss))]);
  const beheizt = raeume.filter((r) => r.beheizt).reduce((s, r) => s + r.flaeche_m2, 0);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-baseline gap-4 flex-wrap border-b-2 border-line-strong pb-2.5">
        <h3 className="font-display font-bold uppercase text-xl">1 — Raumbuch</h3>
        <span className="font-mono text-xs uppercase tracking-wide text-fg-muted ml-auto">
          Grundlage aller Folgepositionen
        </span>
      </div>
      <div className="overflow-x-auto rounded-lg border border-line bg-surface-2">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="bg-surface font-mono text-xs uppercase tracking-wide text-fg-muted text-left">
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
              <FragmentGeschoss key={g} geschoss={g} raeume={raeume.filter((r) => r.geschoss === g)} />
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

function FragmentGeschoss({ geschoss, raeume }: { geschoss: string; raeume: Raum[] }) {
  return (
    <>
      <tr className="bg-surface">
        <td colSpan={6} className="px-4 py-2 font-mono text-xs uppercase tracking-wide text-fg-muted">
          {geschoss}
        </td>
      </tr>
      {raeume.map((r) => (
        <tr key={r.id} className="border-t border-line">
          <td className="px-4 py-3">
            <KonfidenzPunkt konfidenz={r.konfidenz} />
          </td>
          <td className="px-4 py-3">{r.name}</td>
          <td className="px-4 py-3 text-fg-muted">{r.belag ?? "—"}</td>
          <td className="px-4 py-3 text-right font-mono font-num">{zahl(r.flaeche_m2)} m²</td>
          <td className="px-4 py-3 text-right font-mono font-num">
            {zahl(r.umfang_m)} m
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

function AbschnittBlock({ abschnitt }: { abschnitt: Abschnitt }) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-baseline gap-4 flex-wrap border-b-2 border-line-strong pb-2.5">
        <h3 className="font-display font-bold uppercase text-xl">
          {abschnitt.nummer} — {abschnitt.titel}
        </h3>
        <span className="font-mono text-xs uppercase tracking-wide text-fg-muted ml-auto">{abschnitt.lgHinweis}</span>
      </div>
      {abschnitt.vorspann && <p className="text-sm text-fg-muted max-w-3xl">{abschnitt.vorspann}</p>}
      {abschnitt.positionen.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-line bg-surface-2">
          <table className="w-full text-sm min-w-[980px]">
            <thead>
              <tr className="bg-surface font-mono text-xs uppercase tracking-wide text-fg-muted text-left">
                <th className="px-4 py-3 font-medium w-8"></th>
                <th className="px-4 py-3 font-medium">Pos.</th>
                <th className="px-4 py-3 font-medium">Bezeichnung</th>
                <th className="px-4 py-3 font-medium">Rechenweg</th>
                <th className="px-4 py-3 font-medium text-right">Menge</th>
                <th className="px-4 py-3 font-medium">Einh.</th>
                <th className="px-4 py-3 font-medium text-right">EP</th>
                <th className="px-4 py-3 font-medium text-right">Betrag</th>
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
                    {p.menge === null ? <span className="text-fg-muted">—</span> : zahl(p.menge)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-fg-muted">{EINHEIT_TEXT[p.einheit]}</td>
                  <td className="px-4 py-3 text-right font-mono font-num text-xs whitespace-nowrap">
                    {p.einheitspreis === undefined ? (
                      <span className="text-fg-muted">—</span>
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
                        {p.zwischenwert ? "—" : "offen"}
                      </span>
                    ) : (
                      euro(p.betrag)
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-fg-muted">{p.lgKandidaten.join(", ") || "—"}</td>
                </tr>
              ))}
              {abschnitt.summe !== undefined && abschnitt.summe > 0 && (
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
  function herunterladen() {
    const html = massenauszugAlsHtml(auszug, titel, new Date());
    const url = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${titel.replace(/[^\w\d-]+/g, "-").replace(/^-|-$/g, "").toLowerCase() || "massenauszug"}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Erst nach dem Klick freigeben, sonst bricht der Download in Safari ab.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <button
      type="button"
      onClick={herunterladen}
      className="self-start font-display font-bold uppercase tracking-wide text-sm px-6 py-3 bg-line-strong text-surface rounded-md"
    >
      Massenauszug herunterladen
    </button>
  );
}

export function MassenauszugAnsicht({
  auszug,
  titel = "Massenauszug",
}: {
  auszug: Massenauszug;
  titel?: string;
}) {
  return (
    <div className="flex flex-col gap-10">
      <Download auszug={auszug} titel={titel} />
      <Legende />
      <Kennzahlen positionen={auszug.kennzahlen} />
      {auszug.kosten && auszug.kosten.summe > 0 && <KostenBlock kosten={auszug.kosten} />}
      <Raumbuch raeume={auszug.raeume} />
      {auszug.abschnitte.map((a) => (
        <AbschnittBlock key={a.nummer} abschnitt={a} />
      ))}

      {auszug.angewandteAnnahmen.length > 0 && (
        <section className="rounded-lg border-2 border-alert overflow-hidden">
          <p className="bg-alert text-surface font-mono text-xs uppercase tracking-wide px-5 py-2.5 font-semibold">
            Diese Werte stehen nicht im Plan
          </p>
          <ul className="bg-surface-2 divide-y divide-line">
            {auszug.angewandteAnnahmen.map((a) => (
              <li key={a.id} className="px-5 py-4 grid sm:grid-cols-[200px_1fr] gap-1 sm:gap-6 text-sm">
                <span className="font-mono text-xs uppercase tracking-wide font-semibold">{a.titel}</span>
                <span className="text-fg-muted">
                  {a.begruendung} <span className="text-fg">{a.auswirkung}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {auszug.pruefpunkte.length > 0 && (
        <section className="rounded-lg border-2 border-accent overflow-hidden">
          <p className="bg-accent text-accent-fg font-mono text-xs uppercase tracking-wide px-5 py-2.5 font-semibold">
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
