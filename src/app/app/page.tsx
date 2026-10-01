"use client";

import { useEffect, useRef, useState } from "react";
import type { AnalysisResult, GroupedItem, Konfidenz, Massenauszug, Raum } from "@/lib/types";
import { formatiereKosten, type VerbrauchsBericht } from "@/lib/verbrauch";
import { SiteNav, SiteFooter } from "@/components/SiteNav";
import { SeitenHero } from "@/components/Marketing";
import { MassenauszugAnsicht } from "@/components/Massenauszug";
import { planZuBlaettern, vorschauBild } from "@/lib/plan-zu-bildern";
import { ScanAnimation } from "@/components/ScanAnimation";
import { CadErgebnis } from "@/components/CadErgebnis";
import { CadKontrolle } from "@/components/CadKontrolle";
import { leseCadEbenen } from "@/lib/cad-lesen";
import { summiere, type CadAuswertung } from "@/lib/cad-ebenen";
import { lesePlanAusText, umfangAusFlaeche } from "@/lib/plan-lesen";
import { baueMassenauszug } from "@/lib/ableitung";
import { katalogInfo } from "@/lib/lbhb";
import { KEINE_KORREKTUREN, istLeer, type Korrekturen } from "@/lib/korrekturen";
import { KorrekturFeld } from "@/components/KorrekturFeld";
import { sendeDaten } from "@/lib/daten-senden";
import { START_MODELL, type DauerModell } from "@/lib/dauer-modell";

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
      <div className="mb-6 rounded-xl border border-alert/40 bg-alert/10 p-5 text-sm">
        Für diesen Plansatz konnten weder Legende noch Schnitthöhen oder Nachweise gelesen werden. Ohne Schnitt sind
        Wandhöhen nicht ermittelbar, ohne Legende bleibt die Materialzuordnung offen.
      </div>
    );
  }

  return (
    <div className="mb-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-line rounded-2xl overflow-hidden border border-line">
      {felder.map((feld) => (
        <div key={feld.titel} className="bg-surface-2 p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-muted mb-3">{feld.titel}</p>
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
 * Beim Textweg fällt nichts an, das ist keine Nebensache, sondern der Grund,
 * warum immer zuerst dieser Weg versucht wird. Beim Bildweg steht der Betrag
 * hier, statt erst am nächsten Tag im Anthropic-Konto: wer nach jedem Plan
 * sieht, was er kostet, kann entscheiden, ob sich der Weg lohnt.
 */
function HerkunftBlock({ verbrauch, textGrund }: { verbrauch?: VerbrauchsBericht; textGrund?: string | null }) {
  const zahl = (n: number) => n.toLocaleString("de-AT");

  if (!verbrauch) {
    return (
      <div className="mb-6 rounded-xl border border-highlight/40 bg-highlight/10 p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-muted mb-2">Ohne KI gelesen</p>
        <p className="text-sm">
          Der Plan wurde aus seiner eigenen Textebene gelesen, nicht aus Bildern. Das dauert Sekunden und
          verursacht <strong className="font-semibold">keine API-Kosten</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-xl border border-line bg-surface-2 p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-muted mb-3">Kosten dieser Auswertung</p>
      <div className="flex flex-wrap items-baseline gap-x-8 gap-y-2">
        <span className="font-display font-black text-2xl font-num">
          {verbrauch.kostenUsd === null ? "-" : formatiereKosten(verbrauch.kostenUsd)}
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
      {textGrund && (
        <p className="mt-3 border-t border-line pt-3 text-sm text-fg-muted">
          <span className="text-fg">Warum die KI-Auswertung nötig war:</span> Die Textebene des Plans allein reichte nicht. {textGrund}
        </p>
      )}
    </div>
  );
}

function mb(bytes: number): string {
  return (bytes / 1024 / 1024).toLocaleString("de-AT", { maximumFractionDigits: 1 });
}

/**
 * Meldung für Antworten, die kein JSON enthalten. Das sind Fehler, die vor der
 * Anwendung entstehen, meist die Uploadgrenze der Hosting-Plattform oder eine
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
  const [analyseStart, setAnalyseStart] = useState(0);
  const [blattzahl, setBlattzahl] = useState(1);
  const [kachelzahl, setKachelzahl] = useState(0);
  const [dauerModell, setDauerModell] = useState<DauerModell>(START_MODELL);

  useEffect(() => {
    fetch("/api/dauer")
      .then((r) => (r.ok ? r.json() : null))
      .then((m: DauerModell | null) => m && typeof m.grund === "number" && setDauerModell(m))
      .catch(() => {});
  }, []);
  const [vorschau, setVorschau] = useState<string | null>(null);
  const [cad, setCad] = useState<CadAuswertung | null>(null);
  const [cadAus, setCadAus] = useState<Set<number>>(new Set());
  const [ergebnis, setErgebnis] = useState<ApiResponse | null>(null);
  /** Warum der kostenlose Textweg aufgegeben hat. Erklärt, wofür die KI gebraucht wird. */
  const [textGrund, setTextGrund] = useState<string | null>(null);
  /** Manuell korrigierte Räume. Null heißt: Originalwerte aus der Auswertung verwenden. */
  const [bearbeiteteRaeume, setBearbeiteteRaeume] = useState<Raum[] | null>(null);
  /** Korrekturen des Nutzers an Annahmen (Raumhöhe, Deckenunterkante, Stärken …). */
  const [korrekturen, setKorrekturen] = useState<Korrekturen>(KEINE_KORREKTUREN);
  const inputRef = useRef<HTMLInputElement>(null);
  /** Fingerabdruck der Plandatei, unter dem das Ergebnis im Konto liegt. */
  const [planHash, setPlanHash] = useState("");
  const [planName, setPlanName] = useState("");
  /** Gesetzt, wenn das Ergebnis aus dem Konto kommt: Datum der ersten Auswertung. */
  const [ausArchiv, setAusArchiv] = useState<string | null>(null);

  // Neue Ergebnisse im Konto ablegen, damit derselbe Plan nie zweimal bezahlt wird.
  useEffect(() => {
    if (!planHash || ausArchiv || !ergebnis || "fehler" in ergebnis) return;
    void fetch("/api/plaene", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ hash: planHash, name: planName, ergebnis }),
    }).catch(() => {});
  }, [planHash, planName, ausArchiv, ergebnis]);

  async function ausKontoLaden(hash: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/plaene/${hash}`);
      if (!res.ok) return false;
      const gespeichert = (await res.json()) as { eintrag: { datum: string; name: string }; ergebnis: ApiResponse };
      setPlanHash(hash);
      setPlanName(gespeichert.eintrag.name);
      setAusArchiv(gespeichert.eintrag.datum);
      setErgebnis(gespeichert.ergebnis);
      return true;
    } catch {
      return false;
    }
  }

  // Aus dem Konto geöffnet: /app?plan=<Fingerabdruck>
  useEffect(() => {
    const hash = new URLSearchParams(window.location.search).get("plan");
    if (hash) void ausKontoLaden(hash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Kennung dieser Auswertung im Datenspeicher, verbindet Ergebnis und spätere Korrekturen. */
  const [auswertungId, setAuswertungId] = useState("");
  /** Nur mit Zustimmung wird der Plan selbst gespeichert, sonst nur die ausgelesenen Zahlen. */
  const [planSpeichern, setPlanSpeichern] = useState(false);
  /** Datei ist gewählt, die Auswertung startet erst nach Bestätigung. */
  const [wartet, setWartet] = useState(false);

  useEffect(() => {
    if (!auswertungId || !ergebnis || "fehler" in ergebnis) return;
    const { dateiname: _, ...analyse } = ergebnis.analyse;
    sendeDaten("auswertung", auswertungId, { quelle: ergebnis.quelle ?? "ki", analyse });
  }, [auswertungId, ergebnis]);

  useEffect(() => {
    if (!auswertungId || !cad) return;
    sendeDaten("cad", auswertungId, {
      massstab: cad.massstab,
      ebenen: cad.ebenen,
      erkannteEbenen: cad.erkannteEbenen,
      positionen: cad.positionen,
    });
  }, [auswertungId, cad]);

  // Korrekturen gesammelt schicken, sobald der Nutzer eine Weile nichts ändert.
  useEffect(() => {
    if (!auswertungId || !ergebnis || "fehler" in ergebnis) return;
    const original = new Map(ergebnis.analyse.raeume.map((r) => [r.id, r]));
    const raeume = (bearbeiteteRaeume ?? [])
      .filter((r) => {
        const o = original.get(r.id);
        return o && (o.flaeche_m2 !== r.flaeche_m2 || o.umfang_m !== r.umfang_m);
      })
      .map((r) => ({
        name: r.name,
        geschoss: r.geschoss,
        vorher: { flaeche_m2: original.get(r.id)!.flaeche_m2, umfang_m: original.get(r.id)!.umfang_m },
        nachher: { flaeche_m2: r.flaeche_m2, umfang_m: r.umfang_m },
      }));
    const cadAusgeschlossen = cad
      ? [...cadAus].map((i) => cad.konturen[i]).filter(Boolean).map((k) => ({ art: k.art, dicke_m: k.dicke_m, laenge_m: k.laenge_m }))
      : [];
    if (raeume.length === 0 && istLeer(korrekturen) && cadAusgeschlossen.length === 0) return;
    const t = setTimeout(() => sendeDaten("korrektur", auswertungId, { raeume, korrekturen, cadAusgeschlossen }), 3000);
    return () => clearTimeout(t);
  }, [auswertungId, ergebnis, bearbeiteteRaeume, korrekturen, cad, cadAus]);

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
    // ein richtiger, deshalb hier lieber abbrechen und den Bildweg gehen.
    // Der Grund wird festgehalten: ohne ihn sieht der Nutzer nur, dass etwas
    // nicht ging, und weiß nicht, ob sein Plan überhaupt lesbar ist.
    if (!gelesen.verlaesslich) {
      setTextGrund(gelesen.grund ?? "Das Gelesene ließ sich nicht gegen den Plan selbst prüfen.");
      return false;
    }

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
      massenauszug: baueMassenauszug(gelesen.raeume, [], gelesen.kontext),
      katalog: katalogInfo(),
      quelle: "text",
    });
    return true;
  }

  async function analysieren(f: File, neuAuswerten = false) {
    setLaedt(true);
    setAusArchiv(null);
    setPlanName(f.name);
    const id = crypto.randomUUID();
    const start = Date.now();
    setAuswertungId(id);
    setAnalyseStart(start);
    setBlattzahl(1);
    setKachelzahl(0);
    setErgebnis(null);
    setTextGrund(null);
    setBearbeiteteRaeume(null);
    setKorrekturen(KEINE_KORREKTUREN);
    setSchritt("Plan wird gelesen");
    setVorschau((alt) => {
      if (alt) URL.revokeObjectURL(alt);
      return null;
    });
    vorschauBild(f).then(setVorschau).catch(() => {});
    setCad(null);
    setCadAus(new Set());
    leseCadEbenen(f).then(setCad).catch(() => {});

    // Derselbe Plan war schon einmal da: Ergebnis aus dem Konto, keine neuen Kosten.
    let hash = "";
    try {
      const puffer = await crypto.subtle.digest("SHA-256", await f.arrayBuffer());
      hash = [...new Uint8Array(puffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
    } catch {
      hash = "";
    }
    setPlanHash(hash);
    if (hash && !neuAuswerten) {
      setSchritt("Konto wird durchsucht");
      if (await ausKontoLaden(hash)) {
        setLaedt(false);
        setSchritt(null);
        return;
      }
    }

    try {
      if (await ausTextLesen(f)) {
        setLaedt(false);
        setSchritt(null);
        return;
      }
    } catch {
      // Kein Grund aufzugeben: der Bildweg bleibt.
      setTextGrund("Die Textebene des Plans ließ sich nicht öffnen.");
    }

    const fd = new FormData();
    let kacheln = 0;
    fd.append("dateiname", f.name);
    fd.append("auswertungId", id);
    if (planSpeichern) fd.append("planSpeichern", "1");

    // Das PDF wird hier im Browser in Seitenbilder umgewandelt. Als Datei
    // hochgeladen wäre ein Einreichplan oft zu groß für die Anfrage.
    try {
      const blaetter = await planZuBlaettern(f, (seite, von) =>
        setSchritt(`Blatt ${seite} von ${von} wird vorbereitet`),
      );
      setBlattzahl(Math.max(1, blaetter.length));
      kacheln = blaetter.reduce((s, b) => s + b.kacheln.length, 0);
      setKachelzahl(kacheln);
      blaetter.forEach((blatt, i) => {
        fd.append("blatt", blatt.datei, blatt.datei.name);
        for (const k of blatt.kacheln) fd.append(`kachel-${i}`, k, k.name);
      });
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
        // Gelungene KI-Auswertungen lehren den Ladebalken, wie lange so ein Plan dauert.
        if (res.ok && !("fehler" in json)) {
          void fetch("/api/dauer", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              blaetter: fd.getAll("blatt").length,
              kacheln,
              sekunden: (Date.now() - start) / 1000,
            }),
          }).catch(() => {});
        }
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

  function raumAendern(id: string, feld: "flaeche_m2" | "umfang_m", wert: number) {
    if (!ergebnis || "fehler" in ergebnis) return;
    const basis = bearbeiteteRaeume ?? ergebnis.analyse.raeume;
    setBearbeiteteRaeume(
      basis.map((r) => {
        if (r.id !== id) return r;
        if (feld === "flaeche_m2") {
          // Umfang neu schätzen, wenn er sowieso nur geschätzt war.
          const umfang = r.umfangQuelle === "geschaetzt" ? umfangAusFlaeche(wert) : {};
          return { ...r, flaeche_m2: wert, ...umfang };
        }
        return { ...r, umfang_m: wert, umfangQuelle: "gerechnet" as const };
      }),
    );
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setZiehtUeber(false);
    const f = e.dataTransfer.files?.[0];
    if (f) {
      setDatei(f);
      setWartet(true);
    }
  }

  return (
    <main className="flex-1">
      <SiteNav />

      <SeitenHero
        eyebrow="Werkzeug"
        titel="Plan analysieren"
        text="Einreichplan als PDF, Scan oder Foto hochladen. MengenWerk erkennt Räume, Wände, Fenster und Türen und erstellt den Massenauszug."
      />

      <section className="px-6 md:px-10 py-12 max-w-7xl mx-auto">

        <div className="rounded-2xl border border-line bg-surface-2 overflow-hidden">
          <div className="border-b border-line px-6 py-4 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-muted">Planupload</span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-muted">PDF · PNG · JPG</span>
          </div>

          {laedt ? (
            <div className="p-4 md:p-6">
              <ScanAnimation bild={vorschau} meldung={schritt} start={analyseStart} blaetter={blattzahl} kacheln={kachelzahl} modell={dauerModell} />
            </div>
          ) : (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setZiehtUeber(true);
            }}
            onDragLeave={() => setZiehtUeber(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`m-6 rounded-xl border-2 border-dashed p-14 text-center cursor-pointer transition-colors ${
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
                if (f) setWartet(true);
                e.target.value = "";
              }}
            />
            <p className="font-semibold">
              {laedt ? (schritt ?? "Plan wird analysiert") : datei ? datei.name : "Plan hier ablegen oder klicken"}
            </p>
            <p className="mt-2 font-mono text-xs text-fg-muted">
              {laedt ? "Vision Erkennung läuft, das kann bei mehrseitigen Plänen etwas dauern" : "Vektor PDF, Scan oder Bild werden automatisch unterschieden"}
            </p>
          </div>
          )}
          {!laedt && wartet && datei && (
            <div className="border-t border-line px-6 py-6 flex flex-col gap-5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M7 3h7l5 5v13H7z" />
                    <path d="M14 3v5h5" />
                  </svg>
                </span>
                <div className="min-w-0">
                  <p className="font-semibold truncate">{datei.name}</p>
                  <p className="text-xs text-fg-muted">{(datei.size / 1024 / 1024).toFixed(1)} MB, bereit zur Auswertung</p>
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={planSpeichern}
                onClick={() => setPlanSpeichern(!planSpeichern)}
                className={`flex items-start gap-4 rounded-xl border p-4 text-left transition ${
                  planSpeichern ? "border-accent bg-accent/5" : "border-line bg-surface hover:border-line-strong"
                }`}
              >
                <span className={`mt-0.5 flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition ${planSpeichern ? "bg-accent" : "bg-line-strong"}`}>
                  <span className={`h-5 w-5 rounded-full bg-white shadow transition ${planSpeichern ? "translate-x-5" : ""}`} />
                </span>
                <span className="text-sm">
                  <span className="block font-semibold text-fg">Plan zur Verbesserung der Erkennung beitragen</span>
                  <span className="block mt-1 text-fg-muted leading-relaxed">
                    Freiwillig. Wir speichern dann die Planbilder, um MengenWerk zu verbessern. Sie werden nicht
                    weitergegeben und auf Anfrage gelöscht. Ausgelesene Mengen und Korrekturen speichern wir immer,
                    ohne Dateiname und ohne Adresse.{" "}
                    <a href="/datenschutz" className="underline text-fg" onClick={(e) => e.stopPropagation()}>
                      Datenschutz
                    </a>
                  </span>
                </span>
              </button>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setWartet(false);
                    analysieren(datei);
                  }}
                  className="font-semibold text-[15px] px-7 py-3 rounded-xl bg-accent text-accent-fg hover:brightness-110 transition"
                >
                  Auswertung starten
                </button>
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="text-sm text-fg-muted underline hover:text-fg"
                >
                  Andere Datei wählen
                </button>
              </div>
            </div>
          )}
        </div>

        {cad && !laedt && (
          <>
            <CadErgebnis
              auswertung={cad}
              positionen={summiere(cad.konturen, cadAus)}
              ausgeschlossen={cadAus.size}
              zuruecksetzen={() => setCadAus(new Set())}
            />
            <CadKontrolle
              auswertung={cad}
              bild={vorschau}
              ausgeschlossen={cadAus}
              umschalten={(i) => {
                const neu = new Set(cadAus);
                if (neu.has(i)) neu.delete(i);
                else neu.add(i);
                setCadAus(neu);
              }}
            />
          </>
        )}

        {ausArchiv && ergebnis && !("fehler" in ergebnis) && (
          <div className="mt-6 rounded-xl border-2 border-highlight bg-highlight/10 p-5 text-sm flex flex-wrap items-center gap-4">
            <p className="flex-1 min-w-[260px]">
              <span className="font-semibold">Dieser Plan wurde bereits ausgewertet</span> am{" "}
              {new Date(ausArchiv).toLocaleString("de-AT", { dateStyle: "medium", timeStyle: "short" })}. Das Ergebnis
              kommt aus deinem Konto, es fallen keine neuen Kosten an.
            </p>
            {datei && (
              <button
                type="button"
                onClick={() => analysieren(datei, true)}
                className="font-semibold px-4 py-2 rounded-lg border border-line-strong bg-surface hover:bg-surface-2"
              >
                Trotzdem neu auswerten
              </button>
            )}
          </div>
        )}

        {ergebnis && "fehler" in ergebnis && (
          <div className="mt-6 rounded-xl border-2 border-alert bg-alert/10 p-5 text-sm space-y-3">
            {textGrund && (
              <p>
                <span className="font-semibold">Ohne KI war dieser Plan nicht lesbar.</span> {textGrund}
              </p>
            )}
            <p>{ergebnis.fehler}</p>
          </div>
        )}

        {ergebnis && "gruppen" in ergebnis && (() => {
          const effektiveRaeume = bearbeiteteRaeume ?? ergebnis.analyse.raeume;
          const aktuellerAuszug =
            bearbeiteteRaeume || !istLeer(korrekturen)
              ? baueMassenauszug(effektiveRaeume, ergebnis.analyse.elemente, ergebnis.analyse.kontext, korrekturen)
              : ergebnis.massenauszug;
          return (
          <div className="mt-10">
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="font-display font-semibold tracking-tight text-2xl">Mengenermittlung</h2>
              <span className="font-mono text-xs text-fg-muted uppercase">
                {ergebnis.analyse.dateityp} · {ergebnis.analyse.seiten} Seite(n)
              </span>
            </div>

            <HerkunftBlock verbrauch={ergebnis.analyse.verbrauch} textGrund={textGrund} />

            <PlanKontextBlock kontext={ergebnis.analyse.kontext} />

            {bearbeiteteRaeume && (
              <div className="mb-4 flex items-center gap-4 rounded-xl border border-highlight/40 bg-highlight/10 px-4 py-2.5">
                <span className="text-sm flex-1">Raumbuch enthält manuelle Korrekturen. Die Auswertung verwendet diese Werte.</span>
                <button
                  type="button"
                  onClick={() => setBearbeiteteRaeume(null)}
                  className="font-mono text-xs underline text-fg-muted hover:text-fg whitespace-nowrap"
                >
                  Korrekturen zurücksetzen
                </button>
              </div>
            )}

            <MassenauszugAnsicht
              auszug={aktuellerAuszug}
              titel={ergebnis.analyse.dateiname.replace(/\.[^.]+$/, "")}
              onRaumAendern={raumAendern}
            />

            <div className="mt-10">
              <KorrekturFeld
                korrekturen={korrekturen}
                geschosse={[...new Set(effektiveRaeume.map((r) => r.geschoss))]}
                onAendern={setKorrekturen}
              />
            </div>

            <h3 className="font-display font-semibold text-xl mt-12 mb-4 border-b-2 border-line-strong pb-2.5">
              Erkannte Bauteile
            </h3>

            <div className="overflow-x-auto rounded-2xl border border-line">
              <table className="w-full text-sm">
                <thead className="bg-surface text-left">
                  <tr className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-muted">
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
              <div className="mt-6 rounded-xl border border-line-strong/20 bg-accent/15 p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fg mb-2">Zur Kontrolle</p>
                <ul className="space-y-1 text-sm text-fg/80">
                  {ergebnis.analyse.hinweise.map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          );
        })()}
      </section>

      <SiteFooter />
    </main>
  );
}
