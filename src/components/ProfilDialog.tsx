"use client";

import { useEffect, useState } from "react";
import type { Profil } from "@/lib/plan-archiv";

export const PROFILFARBEN = ["#f2b233", "#2c7a4b", "#3b6fd4", "#c0563a", "#7c5cc4", "#1f2a44"];

const GEWERKE = [
  "Baumeister",
  "Bauträger",
  "Planer, Architekt",
  "Bodenleger",
  "Fliesenleger",
  "Maler, Verputzer",
  "Dachdecker, Spengler",
  "Fenster, Türen",
  "Trockenbau",
  "Sonstiges",
];

export function initialen(p: Profil): string {
  const quelle = p.firma || p.name;
  if (!quelle) return "MW";
  return quelle
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

function Feld({
  label,
  wert,
  onAendern,
  platzhalter,
  typ = "text",
  breit = false,
}: {
  label: string;
  wert: string;
  onAendern: (v: string) => void;
  platzhalter?: string;
  typ?: string;
  breit?: boolean;
}) {
  return (
    <label className={`block ${breit ? "sm:col-span-2" : ""}`}>
      <span className="text-[13px] font-medium text-[#374151]">{label}</span>
      <input
        type={typ}
        value={wert}
        placeholder={platzhalter}
        onChange={(e) => onAendern(e.target.value)}
        className="mt-1.5 h-11 w-full rounded-xl border border-[#e2e5ea] bg-white px-3.5 text-[15px] text-[#111827] outline-none transition placeholder:text-[#a8b0bb] focus:border-[#1f2a44] focus:ring-4 focus:ring-[#1f2a44]/10"
      />
    </label>
  );
}

/** Profil des Betriebs in einem eigenen Fenster bearbeiten. */
export function ProfilDialog({
  profil,
  onSchliessen,
  onSpeichern,
}: {
  profil: Profil;
  onSchliessen: () => void;
  onSpeichern: (p: Profil) => Promise<void>;
}) {
  const [e, setE] = useState<Profil>(profil);
  const [speichert, setSpeichert] = useState(false);
  const setze = (feld: keyof Profil) => (v: string) => setE((alt) => ({ ...alt, [feld]: v }));

  useEffect(() => {
    const taste = (ev: KeyboardEvent) => ev.key === "Escape" && onSchliessen();
    window.addEventListener("keydown", taste);
    const vorher = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", taste);
      document.body.style.overflow = vorher;
    };
  }, [onSchliessen]);

  async function sichern() {
    setSpeichert(true);
    await onSpeichern(e);
    setSpeichert(false);
  }

  const farbe = e.farbe || PROFILFARBEN[0];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-6" role="dialog" aria-modal="true" aria-label="Profil bearbeiten">
      <button type="button" aria-label="Schließen" onClick={onSchliessen} className="absolute inset-0 bg-[#0d1424]/60 backdrop-blur-sm" />
      <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl bg-[#f8f9fb] text-[#111827] shadow-[0_40px_120px_-30px_rgba(0,0,0,0.6)]">
        {/* Kopf mit Vorschau */}
        <div className="scan-buehne relative px-6 pb-6 pt-6 text-white sm:px-8">
          <button type="button" onClick={onSchliessen} aria-label="Schließen" className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#f2b233]">Profil bearbeiten</p>
          <div className="mt-4 flex items-center gap-4">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-bold text-[#1f2a44] shadow-lg" style={{ background: farbe, color: farbe === "#1f2a44" ? "#fff" : "#1f2a44" }}>
              {initialen(e)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-xl font-semibold">{e.firma || "Ihr Betrieb"}</p>
              <p className="truncate text-sm text-white/70">{[e.gewerk, e.name].filter(Boolean).join(" · ") || "So erscheint Ihr Betrieb im Konto und auf den Auszügen."}</p>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            {PROFILFARBEN.map((f) => (
              <button
                key={f}
                type="button"
                aria-label={`Farbe ${f}`}
                onClick={() => setE({ ...e, farbe: f })}
                className={`h-7 w-7 rounded-full border-2 transition ${farbe === f ? "border-white scale-110" : "border-white/20"}`}
                style={{ background: f }}
              />
            ))}
          </div>
        </div>

        {/* Inhalt */}
        <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8 space-y-7">
          <section>
            <h3 className="text-[15px] font-semibold">Betrieb</h3>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <Feld label="Firmenname" wert={e.firma} onAendern={setze("firma")} platzhalter="z. B. Huber Bau GmbH" breit />
              <Feld label="UID-Nummer" wert={e.uid ?? ""} onAendern={setze("uid")} platzhalter="ATU12345678" />
              <Feld label="Website" wert={e.website ?? ""} onAendern={setze("website")} platzhalter="www.beispiel.at" />
            </div>
            <p className="mt-4 text-[13px] font-medium text-[#374151]">Gewerk</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {GEWERKE.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setE({ ...e, gewerk: e.gewerk === g ? "" : g })}
                  className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
                    e.gewerk === g ? "border-[#1f2a44] bg-[#1f2a44] text-white" : "border-[#e2e5ea] bg-white text-[#374151] hover:border-[#1f2a44]"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-[15px] font-semibold">Ansprechperson</h3>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <Feld label="Name" wert={e.name} onAendern={setze("name")} platzhalter="Vor- und Nachname" />
              <Feld label="Funktion" wert={e.rolle ?? ""} onAendern={setze("rolle")} platzhalter="z. B. Kalkulation" />
              <Feld label="E-Mail" wert={e.email} onAendern={setze("email")} platzhalter="name@firma.at" typ="email" />
              <Feld label="Telefon" wert={e.telefon} onAendern={setze("telefon")} platzhalter="+43 …" typ="tel" />
            </div>
          </section>
        </div>

        {/* Fuß */}
        <div className="flex items-center justify-end gap-3 border-t border-[#e6e8ec] bg-white px-6 py-4 sm:px-8">
          <button type="button" onClick={onSchliessen} className="h-11 rounded-xl px-5 text-sm font-semibold text-[#5b6472] hover:text-[#111827]">
            Abbrechen
          </button>
          <button
            type="button"
            onClick={sichern}
            disabled={speichert}
            className="h-11 rounded-xl bg-[#1f2a44] px-6 text-sm font-semibold text-white hover:bg-[#2c3a5c] disabled:opacity-60"
          >
            {speichert ? "Speichert …" : "Profil speichern"}
          </button>
        </div>
      </div>
    </div>
  );
}
