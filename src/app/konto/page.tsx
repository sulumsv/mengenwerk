"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SiteNav, SiteFooter } from "@/components/SiteNav";
import type { ArchivEintrag, Profil } from "@/lib/plan-archiv";
import { PREISKATALOG, type Einheitspreise } from "@/lib/preise";
import { ladeEinheitspreise } from "@/lib/einheitspreise-speicher";
import { KI_KOSTEN_ANZEIGEN } from "@/lib/einstellungen";
import { ProfilDialog, initialen, PROFILFARBEN } from "@/components/ProfilDialog";

const LEER: Profil = { firma: "", name: "", email: "", telefon: "", gewerk: "" };

const PREISGRUPPEN: { titel: string; lgs: (string | null)[] }[] = [
  { titel: "Erdbau und Rohbau", lgs: ["03", "04", "06", "07", "08"] },
  { titel: "Putz, Estrich, Abdichtung", lgs: ["10", "11", "12"] },
  { titel: "Dach und Spengler", lgs: ["21", "22", "23", "36"] },
  { titel: "Beläge", lgs: ["24", "28", "38", "49", "50"] },
  { titel: "Fenster und Türen", lgs: ["37", "43", "56", "57", "65", "73"] },
  { titel: "Fassade, Maler, Außen", lgs: ["13", "31", "39", "44", "47", "48", "58", "68", null] },
];

function zahl(n: number, dez = 0): string {
  return n.toLocaleString("de-AT", { minimumFractionDigits: dez, maximumFractionDigits: dez });
}

function datum(iso: string): string {
  return new Date(iso).toLocaleDateString("de-AT", { day: "2-digit", month: "short", year: "numeric" });
}


const SYMBOLE: Record<string, string> = {
  plaene: "M4 4h11l5 5v11H4zM15 4v5h5",
  blaetter: "M3 6h14v14H3zM7 2h14v14",
  flaeche: "M3 3h18v18H3zM3 12h18M12 3v18",
  positionen: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  kosten: "M12 2v20M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
};

function Kennzahl({ wert, titel, zusatz, symbol, leer }: { wert: string; titel: string; zusatz?: string; symbol: string; leer?: boolean }) {
  return (
    <div className="group rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur transition hover:bg-white/[0.09]">
      <div className="flex items-center justify-between">
        <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-white/60">{titel}</p>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-[#f2b233]">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d={SYMBOLE[symbol]} />
          </svg>
        </span>
      </div>
      <p className={`mt-3 text-[30px] font-semibold leading-none tracking-tight font-num ${leer ? "text-white/35" : "text-white"}`}>{wert}</p>
      <p className={`mt-2 text-[12px] ${zusatz ? "text-[#f2b233]" : "text-white/45"}`}>{zusatz ?? (leer ? "nach der ersten Auswertung" : "\u00a0")}</p>
    </div>
  );
}

export default function KontoSeite() {
  const [plaene, setPlaene] = useState<ArchivEintrag[] | null>(null);
  const [profil, setProfil] = useState<Profil>(LEER);
  const [bearbeiten, setBearbeiten] = useState(false);
  const [gespeichert, setGespeichert] = useState(false);
  const [eigene, setEigene] = useState<Einheitspreise>({});
  const [suche, setSuche] = useState("");
  const [preiseOffen, setPreiseOffen] = useState(false);

  useEffect(() => {
    fetch("/api/plaene")
      .then((r) => (r.ok ? r.json() : { plaene: [] }))
      .then((d: { plaene: ArchivEintrag[] }) => setPlaene(d.plaene))
      .catch(() => setPlaene([]));
    fetch("/api/profil")
      .then((r) => (r.ok ? r.json() : { profil: null }))
      .then((d: { profil: Profil | null }) => {
        if (d.profil) {
          setProfil(d.profil);
        }
      })
      .catch(() => {});
    setEigene(ladeEinheitspreise());
  }, []);

  async function profilSichern(neu: Profil) {
    const res = await fetch("/api/profil", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(neu),
    }).catch(() => null);
    setProfil(neu);
    setBearbeiten(false);
    setGespeichert(Boolean(res?.ok));
    setTimeout(() => setGespeichert(false), 3000);
  }

  async function entfernen(e: ArchivEintrag) {
    if (!window.confirm(`„${e.name}“ aus dem Konto löschen? Beim nächsten Hochladen wird er neu ausgewertet.`)) return;
    await fetch(`/api/plaene/${e.hash}`, { method: "DELETE" });
    setPlaene((p) => (p ?? []).filter((x) => x.hash !== e.hash));
  }

  async function abmelden() {
    await fetch("/api/konto", { method: "DELETE" });
    window.location.href = "/";
  }

  const liste = plaene ?? [];
  const summe = useMemo(
    () => ({
      blaetter: liste.reduce((s, p) => s + (p.seiten || 0), 0),
      flaeche: liste.reduce((s, p) => s + (p.flaeche_m2 ?? 0), 0),
      positionen: liste.reduce((s, p) => s + (p.positionen ?? 0), 0),
      kosten: liste.reduce((s, p) => s + (p.kostenUsd ?? 0), 0),
    }),
    [liste],
  );
  const gefiltert = liste.filter((p) => p.name.toLowerCase().includes(suche.toLowerCase()));
  const anzahlEigene = Object.keys(eigene).length;
  const anteilEigene = PREISKATALOG.length ? anzahlEigene / PREISKATALOG.length : 0;

  return (
    <main className="flex-1 bg-[#f8f9fb]">
      <SiteNav />

      {/* Kopf mit Profil und Kennzahlen */}
      <section className="scan-buehne text-white">
        <div className="mx-auto max-w-[1120px] px-5 md:px-8 pt-12 pb-10">
          <div className="flex flex-wrap items-center gap-5">
            <span
              className="flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-bold shadow-lg"
              style={{ background: profil.farbe || PROFILFARBEN[0], color: profil.farbe === "#1f2a44" ? "#fff" : "#1f2a44" }}
            >
              {initialen(profil)}
            </span>
            <div className="flex-1 min-w-[220px]">
              <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-[#f2b233]">Mein Konto</p>
              <h1 className="mt-1 text-[clamp(1.6rem,3vw,2.3rem)] font-semibold tracking-tight">
                {profil.firma || "Ihr Betrieb"}
              </h1>
              <p className="text-white/70 text-[15px]">
                {profil.name ? `Willkommen zurück, ${profil.name}.` : "Willkommen. Ergänzen Sie Ihr Profil, damit Ihre Auszüge Ihren Namen tragen."}
                {profil.gewerk && <span className="ml-2 rounded-full bg-white/10 px-2.5 py-0.5 text-[12px]">{profil.gewerk}</span>}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setBearbeiten(true)}
                className="h-11 rounded-xl border border-white/30 px-5 text-[15px] font-semibold hover:bg-white/10"
              >
                Profil bearbeiten
              </button>
              <Link href="/app" className="flex h-11 items-center rounded-xl bg-[#f2b233] px-5 text-[15px] font-semibold text-[#1f2a44] hover:brightness-105">
                Neuen Plan auswerten
              </Link>
            </div>
          </div>

          {gespeichert && <p className="mt-4 inline-flex rounded-full bg-[#2c7a4b] px-3 py-1 text-sm text-white">✓ Profil gespeichert</p>}

          <div className={`mt-8 grid gap-4 sm:grid-cols-2 ${KI_KOSTEN_ANZEIGEN ? "lg:grid-cols-5" : "lg:grid-cols-4"}`}>
            <Kennzahl symbol="plaene" leer={liste.length === 0} titel="Pläne ausgewertet" wert={zahl(liste.length)} />
            <Kennzahl symbol="blaetter" leer={liste.length === 0} titel="Blätter gelesen" wert={zahl(summe.blaetter)} />
            <Kennzahl symbol="flaeche" leer={liste.length === 0} titel="Fläche erfasst" wert={`${zahl(summe.flaeche)} m²`} />
            <Kennzahl symbol="positionen" leer={liste.length === 0} titel="Positionen" wert={zahl(summe.positionen)} />
            {KI_KOSTEN_ANZEIGEN && (
              <Kennzahl symbol="kosten" titel="KI-Kosten" wert={`${zahl(summe.kosten, 2)} $`} zusatz="nur in der Testphase sichtbar" />
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1120px] px-5 md:px-8 py-10 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* Pläne */}
        <div className="rounded-2xl border border-[#e6e8ec] bg-white">
          <div className="flex flex-wrap items-center gap-3 border-b border-[#eef0f3] px-5 py-4">
            <h2 className="text-[17px] font-semibold text-[#111827]">Meine Pläne</h2>
            <input
              value={suche}
              onChange={(e) => setSuche(e.target.value)}
              placeholder="Plan suchen"
              className="ml-auto h-9 w-48 rounded-lg border border-[#e6e8ec] px-3 text-sm outline-none focus:border-[#1f2a44]"
            />
          </div>
          {plaene === null && <p className="px-5 py-8 text-sm text-[#5b6472]">Wird geladen …</p>}
          {plaene && gefiltert.length === 0 && (
            <div className="px-5 py-12 text-center">
              <p className="font-semibold text-[#111827]">{liste.length === 0 ? "Noch keine Pläne" : "Kein Treffer"}</p>
              <p className="mt-1 text-sm text-[#5b6472]">
                {liste.length === 0 ? "Nach der ersten Auswertung erscheint der Plan hier, mit Ergebnis jederzeit abrufbar." : "Andere Suche probieren."}
              </p>
            </div>
          )}
          <ul className="divide-y divide-[#eef0f3]">
            {gefiltert.map((p) => (
              <li key={p.hash} className="group flex flex-wrap items-center gap-4 px-5 py-4 hover:bg-[#f8f9fb]">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eef1f6] text-[#1f2a44]">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M3 5h18v14H3z" />
                    <path d="M9 5v14M3 12h6M14 9h4M14 13h4" />
                  </svg>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-[#111827]">{p.name}</p>
                  <p className="text-[13px] text-[#5b6472]">
                    {datum(p.datum)} · {p.seiten} {p.seiten === 1 ? "Blatt" : "Blätter"}
                    {p.flaeche_m2 ? ` · ${zahl(p.flaeche_m2)} m²` : ""}
                    {p.positionen ? ` · ${p.positionen} Positionen` : ""}
                    {KI_KOSTEN_ANZEIGEN && (
                      <span className="ml-2 rounded bg-[#fdf3dc] px-1.5 py-0.5 text-[11px] text-[#8a6412]">
                        {p.quelle === "text" ? "ohne KI" : p.kostenUsd === null ? "Kosten ?" : `${zahl(p.kostenUsd, 2)} $`}
                      </span>
                    )}
                  </p>
                </div>
                <Link href={`/app?plan=${p.hash}`} className="rounded-lg bg-[#1f2a44] px-4 py-2 text-sm font-semibold text-white">
                  Öffnen
                </Link>
                <button type="button" onClick={() => entfernen(p)} className="text-sm text-[#8a93a0] hover:text-[#c0301d]">
                  Löschen
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-6">
          {/* Einheitspreise */}
          <div className="rounded-2xl border border-[#e6e8ec] bg-white p-5">
            <div className="flex items-center gap-4">
              <div
                className="relative h-16 w-16 shrink-0 rounded-full"
                style={{ background: `conic-gradient(#f2b233 ${anteilEigene * 360}deg, #eef0f3 0deg)` }}
              >
                <span className="absolute inset-[6px] flex items-center justify-center rounded-full bg-white text-[13px] font-semibold text-[#111827]">
                  {Math.round(anteilEigene * 100)} %
                </span>
              </div>
              <div>
                <h2 className="text-[17px] font-semibold text-[#111827]">Einheitspreise</h2>
                <p className="text-[13px] text-[#5b6472]">
                  {anzahlEigene} von {PREISKATALOG.length} mit eigenem Preis, der Rest rechnet mit österreichischen Richtwerten.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setPreiseOffen(!preiseOffen)}
              className="mt-4 flex w-full items-center justify-between rounded-lg bg-[#f8f9fb] px-3 py-2 text-sm font-semibold text-[#111827]"
            >
              Übersicht nach Gewerk
              <span className={`transition ${preiseOffen ? "rotate-180" : ""}`}>⌄</span>
            </button>
            {preiseOffen && (
              <ul className="mt-2 divide-y divide-[#eef0f3] text-sm">
                {PREISGRUPPEN.map((g) => {
                  const pos = PREISKATALOG.filter((p) => g.lgs.includes(p.lg));
                  const eig = pos.filter((p) => eigene[p.schluessel] !== undefined).length;
                  return (
                    <li key={g.titel} className="flex items-center justify-between py-2">
                      <span className="text-[#374151]">{g.titel}</span>
                      <span className="font-num text-[#5b6472]">
                        {eig}/{pos.length}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
            <Link
              href="/einheitspreise"
              className="mt-4 flex h-10 items-center justify-center rounded-lg border border-[#d4d8df] text-sm font-semibold text-[#111827] hover:bg-[#f8f9fb]"
            >
              Einheitspreise bearbeiten
            </Link>
          </div>

          {/* Kontakt und Abmelden */}
          <div className="rounded-2xl border border-[#e6e8ec] bg-white p-5 text-sm">
            <h2 className="text-[17px] font-semibold text-[#111827]">Kontaktdaten</h2>
            <dl className="mt-3 space-y-1.5 text-[#374151]">
              <div className="flex justify-between gap-3"><dt className="text-[#5b6472]">E-Mail</dt><dd className="truncate">{profil.email || "-"}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-[#5b6472]">Telefon</dt><dd>{profil.telefon || "-"}</dd></div>
            </dl>
            <button type="button" onClick={abmelden} className="mt-4 text-[#5b6472] underline hover:text-[#111827]">
              Abmelden
            </button>
          </div>
        </div>
      </section>

      <SiteFooter />
      {bearbeiten && <ProfilDialog profil={profil} onSchliessen={() => setBearbeiten(false)} onSpeichern={profilSichern} />}
    </main>
  );
}
