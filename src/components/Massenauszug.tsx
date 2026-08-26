import { sortiereGeschosse } from "@/lib/ableitung";
import type { Abschnitt, Konfidenz, Massenauszug, Position, Raum } from "@/lib/types";

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
          <table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr className="bg-surface font-mono text-xs uppercase tracking-wide text-fg-muted text-left">
                <th className="px-4 py-3 font-medium w-8"></th>
                <th className="px-4 py-3 font-medium">Pos.</th>
                <th className="px-4 py-3 font-medium">Bezeichnung</th>
                <th className="px-4 py-3 font-medium">Rechenweg</th>
                <th className="px-4 py-3 font-medium text-right">Menge</th>
                <th className="px-4 py-3 font-medium">Einh.</th>
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
                  <td className="px-4 py-3 text-xs text-fg-muted">{p.lgKandidaten.join(", ") || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export function MassenauszugAnsicht({ auszug }: { auszug: Massenauszug }) {
  return (
    <div className="flex flex-col gap-10">
      <Legende />
      <Kennzahlen positionen={auszug.kennzahlen} />
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
