"use client";

import { useRef, useState } from "react";
import type { AnalysisResult, GroupedItem, Konfidenz, Massenauszug } from "@/lib/types";
import { formatiereKosten, type VerbrauchsBericht } from "@/lib/verbrauch";
import { SiteNav, SiteFooter } from "@/components/SiteNav";
import { MassenauszugAnsicht } from "@/components/Massenauszug";
import { ladeEinheitspreise } from "@/lib/einheitspreise-speicher";
import { planZuBlaettern } from "@/lib/plan-zu-bildern";
import { lesePlanAusText } from "@/lib/plan-lesen";
import { baueMassenauszug } from "@/lib/ableitung";
import { katalogInfo } from "@/lib/lbhb";

type KatalogInfo = { katalog: string; version: string; vollstaendig: boolean };

type ApiResponse =
  | {
      analyse: AnalysisResult;
      gruppen: GroupedItem[];
      massenauszug: Massenauszug;
      katalog: KatalogInfo;
      /** "text" heißt aus der Textebene gelesen, sonst über Bilderkennung. */
      quelle?: "text";
    }
  | { fehler: string };

const KONFIDENZ_TEXT: Record<Konfidenz, string> = {
  plan: "Aus Plan",
  berechnet: "Berechnet",
  annahme: "Annahme",
};

/** Die Farben entsprechen der Kennzeichnung im Massenauszug. */
const KONFIDENZ_FARBE: Record<Konfidenz, string> = {
  plan: "bg-highlight",
  berechnet: "bg-accent",
  annahme: "bg-alert",
};

/**
 * Legende, Schnitthöhen und Nachweise gelten für den ganzen Plansatz. Sie
 * stehen hier über der Tabelle, weil sich an ihnen ablesen lässt, worauf die
 * Materialzuordnung und die Wandhöhen der einzelnen Positionen beruhen.
 */
function PlanKontextBlock({ kontext }: { kontext: AnalysisResult["kontext"] }) {
  const felder: { titel: string; eintraege: [string, string][] }[] = [
    {
      titel: "Planlegende",
      eintraege: Object.entries(kontext.legende),
    },
    {
      titel: "Lichte Raumhöhen",
      eintraege: Object.entries(kontext.geschosshoehen).map(([g, h]): [string, string] => [g, `${h.toFixed(2)} m`]),
    },
    {
      titel: "Nachweise",
      eintraege: Object.entries(kontext.nachweise).map(([b, w]): [string, string] => [b, w.toFixed(2)]),
    },
  ].filter((f) => f.eintraege.length > 0);

  if (felder.length === 0) {
    return (
      <div className="mb-6 rounded-md border border-alert/40 bg-alert/10 p-5 text-sm">
        Für diesen Plansatz konnten weder Legende noch Schnitthöhen oder Nachweise gelesen werden. Ohne Schnitt sind
        Wandhöhen nicht ermittelbar, ohne Legende bleibt die Materialzuordnung offen.
      </div>
    );
  }

  return (
    <div className="mb-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-line rounded-lg overflow-hidden border border-line">
      {felder.map((feld) => (
        <div key={feld.titel} className="bg-surface-2 p-5">
          <p className="font-mono text-xs uppercase tracking-wide text-fg-muted mb-3">{feld.titel}</p>
          <dl className="space-y-1.5">
            {feld.eintraege.map(([schluessel, wert]) => (
              <div key={schluessel} className="flex justify-between gap-4 text-sm">
                <dt className="text-fg-muted">{schluessel}</dt>
                <dd className="font-mono font-num text-right">{wert}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}


/**
 * Was diese Auswertung gekostet hat.
 *
 * Beim Textweg fällt nichts an — das ist keine Nebensache, sondern der Grund,
 * warum immer zuerst dieser Weg versucht wird. Beim Bildweg steht der Betrag
 * hier, statt erst am nächsten Tag im Anthropic-Konto: wer nach jedem Plan
 * sieht, was er kostet, kann entscheiden, ob sich der Weg lohnt.
 */
function HerkunftBlock({ verbrauch }: { verbrauch?: VerbrauchsBericht }) {
  const zahl = (n: number) => n.toLocaleString("de-AT");

  if (!verbrauch) {
    return (
      <div className="mb-6 rounded-md border border-highlight/40 bg-highlight/10 p-5">
        <p className="font-mono text-xs uppercase tracking-wide text-fg-muted mb-2">Ohne KI gelesen</p>
        <p className="text-sm">
          Der Plan wurde aus seiner eigenen Textebene gelesen, nicht aus Bildern. Das dauert Sekunden und
          verursacht <strong className="font-semibold">keine API-Kosten</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-md border border-line bg-surface-2 p-5">
      <p className="font-mono text-xs uppercase tracking-wide text-fg-muted mb-3">Kosten dieser Auswertung</p>
      <div className="flex flex-wrap items-baseline gap-x-8 gap-y-2">
        <span className="font-display font-black text-2xl font-num">
          {verbrauch.kostenUsd === null ? "—" : formatiereKosten(verbrauch.kostenUsd)}
        </span>
        <span className="font-mono text-xs text-fg-muted">
          {zahl(verbrauch.aufrufe)} Aufrufe · {zahl(verbrauch.eingabeToken)} Token gelesen ·{" "}
          {zahl(verbrauch.ausgabeToken)} Token geschrieben
        </span>
      </div>
      <p className="mt-3 text-sm text-fg-muted">
        {verbrauch.kostenUsd === null
          ? `Für das Modell ${verbrauch.modell} ist kein Tarif hinterlegt. Der Betrag steht im Anthropic-Konto.`
          : "Listenpreis in US-Dollar, wie ihn Anthropic verrechnet. Auf der Rechnung steht der Betrag zum Kurs des Abrechnungstags."}
      </p>
    </div>
  );
}

function mb(bytes: number): string {
  return (bytes / 1024 / 1024).toLocaleString("de-AT", { maximumFractionDigits: 1 });
}

/**
 * Meldung für Antworten, die kein JSON enthalten. Das sind Fehler, die vor der
 * Anwendung entstehen — meist die Uploadgrenze der Hosting-Plattform oder eine
 * Zeitüberschreitung.
 */
function meldungFuerStatus(status: number, datei: File): string {
  if (status === 401 || status === 403) {
    return "Die Anmeldung ist abgelaufen. Bitte neu anmelden und erneut versuchen.";
  }
  if (status === 413) {
    return `Die Datei ist mit ${mb(datei.size)} MB zu groß für den Upload. Bitte den Plansatz aufteilen oder kleiner exportieren.`;
  }
  if (status === 504 || status === 408) {
    return "Die Auswertung hat zu lange gedauert und wurde abgebrochen. Bitte den Plansatz in weniger Blätter aufteilen.";
  }
  if (status === 502 || status === 503) {
    return "Der Server war vorübergehend nicht erreichbar. Bitte in einigen Minuten erneut versuchen.";
  }
  return `Der Server hat unerwartet geantwortet (Code ${status}) bei einer Datei von ${mb(datei.size)} MB.`;
}

export default function ToolPage() {
  const [datei, setDatei] = useState<File | null>(null);
  const [ziehtUeber, setZiehtUeber] = useState(false);
  const [laedt, setLaedt] = useState(false);
  const [schritt, setSchritt] = useState<string | null>(null);
  const [ergebnis, setErgebnis] = useState<ApiResponse | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * Erster Weg: den Plan aus seiner eigenen Textebene lesen. Das kostet nichts,
   * dauert Sekunden und braucht keinen Zugang zu einem KI-Dienst. Es gelingt
   * bei Plänen aus einem CAD-Programm und scheitert bei eingescannten.
   */
  async function ausTextLesen(f: File): Promise<boolean> {
    if (!f.name.toLowerCase().endsWith(".pdf") && f.type !== "application/pdf") return false;

    setSchritt("Plan wird gelesen");
    const gelesen = await lesePlanAusText(f, (seite, von) =>
      setSchritt(`Blatt ${seite} von ${von} wird gelesen`),
    );

    // Dem Gelesenen ist nur zu trauen, wenn es sich selbst gegenprüfen lässt.
    // Ein Auszug aus falsch zugeordneten Zahlen sieht genauso fertig aus wie
    // ein richtiger — deshalb hier lieber abbrechen und den Bildweg gehen.
    if (!gelesen.verlaesslich) return false;

    setErgebnis({
      analyse: {
        dateiname: f.name,
        dateityp: "vektor-pdf",
        seiten: gelesen.seiten,
        kontext: gelesen.kontext,
        raeume: gelesen.raeume,
        elemente: [],
        hinweise: [],
      },
      gruppen: [],
      massenauszug: baueMassenauszug(gelesen.raeume, [], gelesen.kontext, ladeEinheitspreise()),
      katalog: katalogInfo(),
      quelle: "text",
    });
    return true;
  }

  async function analysieren(f: File) {
    setLaedt(true);
    setErgebnis(null);
    setSchritt("Plan wird gelesen");

    try {
      if (await ausTextLesen(f)) {
        setLaedt(false);
        setSchritt(null);
        return;
      }
    } catch {
      // Kein Grund aufzugeben: der Bildweg bleibt.
    }

    const fd = new FormData();
    fd.append("dateiname", f.name);
    fd.append("einheitspreise", JSON.stringify(ladeEinheitspreise()));

    // Das PDF wird hier im Browser in Seitenbilder umgewandelt. Als Datei
    // hochgeladen wäre ein Einreichplan oft zu groß für die Anfrage.
    try {
      const blaetter = await planZuBlaettern(f, (seite, von) =>
        setSchritt(`Blatt ${seite} von ${von} wird vorbereitet`),
      );
      for (const blatt of blaetter) fd.append("blatt", blatt.datei, blatt.datei.name);
      setSchritt(`${blaetter.length} Blatt wird ausgewertet`);
    } catch {
      setErgebnis({
        fehler: "Der Plan konnte nicht gelesen werden. Bitte prüfen, ob die Datei beschädigt oder passwortgeschützt ist.",
      });
      setLaedt(false);
      setSchritt(null);
      return;
    }

    try {
      const res = await fetch("/api/analyze", { method: "POST", body: fd });

      // Plattformfehler wie eine abgewiesene Uploadgröße oder eine
      // Zeitüberschreitung kommen nicht als JSON zurück. Ohne diese
      // Unterscheidung verschluckt die Auswertung der Antwort den Statuscode
      // und die Meldung sagt nichts aus.
      const roh = await res.text();
      let json: ApiResponse | null = null;
      try {
        json = JSON.parse(roh) as ApiResponse;
      } catch {
        json = null;
      }

      if (json) {
        setErgebnis(json);
      } else {
        setErgebnis({ fehler: meldungFuerStatus(res.status, f) });
      }
    } catch {
      setErgebnis({
        fehler: "Keine Verbindung zum Server. Bitte Internetverbindung prüfen und erneut versuchen.",
      });
    } finally {
      setLaedt(false);
      setSchritt(null);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setZiehtUeber(false);
    const f = e.dataTransfer.files?.[0];
    if (f) {
      setDatei(f);
      analysieren(f);
    }
  }

  return (
    <main className="flex-1">
      <SiteNav />

      <section className="px-6 md:px-10 py-16 max-w-7xl mx-auto">
        <h1 className="font-display font-black uppercase text-3xl mb-8">Plan analysieren</h1>

        <div className="rounded-lg border border-line bg-surface-2 overflow-hidden">
          <div className="border-b border-line px-6 py-4 flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-wide text-fg-muted">Planupload</span>
            <span className="font-mono text-xs uppercase tracking-wide text-fg-muted">PDF · PNG · JPG</span>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setZiehtUeber(true);
            }}
            onDragLeave={() => setZiehtUeber(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`m-6 rounded-md border-2 border-dashed p-14 text-center cursor-pointer transition-colors ${
              ziehtUeber ? "border-line-strong bg-accent/15" : "border-line hover:border-fg-muted"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.tif,.tiff"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                setDatei(f);
                if (f) analysieren(f);
              }}
            />
            <p className="font-display font-bold uppercase tracking-wide">
              {laedt ? (schritt ?? "Plan wird analysiert") : datei ? datei.name : "Plan hier ablegen oder klicken"}
            </p>
            <p className="mt-2 font-mono text-xs text-fg-muted">
              {laedt ? "Vision Erkennung läuft, das kann bei mehrseitigen Plänen etwas dauern" : "Vektor PDF, Scan oder Bild werden automatisch unterschieden"}
            </p>
          </div>
        </div>

        {ergebnis && "fehler" in ergebnis && (
          <div className="mt-6 rounded-md border-2 border-alert bg-alert/10 p-5 text-sm">{ergebnis.fehler}</div>
        )}

        {ergebnis && "gruppen" in ergebnis && (
          <div className="mt-10">
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="font-display font-black uppercase text-2xl">Mengenermittlung</h2>
              <span className="font-mono text-xs text-fg-muted uppercase">
                {ergebnis.analyse.dateityp} · {ergebnis.analyse.seiten} Seite(n)
              </span>
            </div>

            <HerkunftBlock verbrauch={ergebnis.analyse.verbrauch} />

            <PlanKontextBlock kontext={ergebnis.analyse.kontext} />

            <MassenauszugAnsicht auszug={ergebnis.massenauszug} titel={ergebnis.analyse.dateiname.replace(/\.[^.]+$/, "")} />

            <h3 className="font-display font-bold uppercase text-xl mt-12 mb-4 border-b-2 border-line-strong pb-2.5">
              Erkannte Bauteile
            </h3>

            <div className="overflow-x-auto rounded-lg border border-line">
              <table className="w-full text-sm">
                <thead className="bg-surface text-left">
                  <tr className="font-mono text-xs uppercase tracking-wide text-fg-muted">
                    <th className="px-4 py-3 font-medium">Herkunft</th>
                    <th className="px-4 py-3 font-medium">Typ</th>
                    <th className="px-4 py-3 font-medium">Material</th>
                    <th className="px-4 py-3 font-medium">Dimension</th>
                    <th className="px-4 py-3 font-medium">Anzahl</th>
                    <th className="px-4 py-3 font-medium">Gesamtfläche</th>
                    <th className="px-4 py-3 font-medium">Rechenweg</th>
                    <th className="px-4 py-3 font-medium">LB HB Gruppe</th>
                  </tr>
                </thead>
                <tbody>
                  {ergebnis.gruppen.map((g, i) => (
                    <tr key={i} className="border-t border-line">
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-2 whitespace-nowrap">
                          <span className={`inline-block w-2.5 h-2.5 ${KONFIDENZ_FARBE[g.konfidenz]}`} aria-hidden="true" />
                          <span className="font-mono text-xs text-fg-muted">{KONFIDENZ_TEXT[g.konfidenz]}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 capitalize">{g.label}</td>
                      <td className="px-4 py-3 text-fg-muted text-xs">{g.material || "nicht belegt"}</td>
                      <td className="px-4 py-3 font-mono font-num">{g.breite_m.toFixed(2)} × {g.hoehe_m.toFixed(2)} m</td>
                      <td className="px-4 py-3 font-mono font-num font-semibold">{g.anzahl}×</td>
                      <td className="px-4 py-3 font-mono font-num">{g.gesamt_flaeche_m2.toFixed(2)} m²</td>
                      <td className="px-4 py-3 text-fg-muted font-mono text-xs">{g.rechenweg}</td>
                      <td className="px-4 py-3 text-fg-muted text-xs">{g.lgKandidaten.join(", ") || "keine Zuordnung"}</td>
                    </tr>
                  ))}
                  {ergebnis.gruppen.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-fg-muted">
                        Auf diesem Plan wurden keine eindeutigen Elemente gefunden.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {!ergebnis.katalog.vollstaendig && (
              <p className="mt-4 font-mono text-xs text-fg-muted">
                {ergebnis.katalog.katalog} {ergebnis.katalog.version} ist nur als Teilmenge hinterlegt. Die Zuordnung
                erfolgt auf Ebene der Leistungsgruppen, nicht bis zur Positionsnummer.
              </p>
            )}

            {ergebnis.analyse.hinweise.length > 0 && (
              <div className="mt-6 rounded-md border border-line-strong/20 bg-accent/15 p-5">
                <p className="font-mono text-xs uppercase tracking-wide text-fg mb-2">Zur Kontrolle</p>
                <ul className="space-y-1 text-sm text-fg/80">
                  {ergebnis.analyse.hinweise.map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>

      <SiteFooter />
    </main>
  );
}
