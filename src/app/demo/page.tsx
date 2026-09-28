"use client";

import { useState } from "react";
import { SiteNav, SiteFooter } from "@/components/SiteNav";
import { Abschnitt, SeitenHero } from "@/components/Marketing";

const ZIEL = "office@msv-digital.com";

const feld =
  "w-full rounded-lg border border-[#c8d4da] bg-white px-3.5 py-2.5 text-sm text-[#2b2d33] placeholder:text-[#b3bec8] outline-none focus:border-[#2b2d33] transition";

export default function DemoPage() {
  const [daten, setDaten] = useState({ name: "", firma: "", email: "", telefon: "", rolle: "", nachricht: "" });
  const setze = (k: keyof typeof daten) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setDaten({ ...daten, [k]: e.target.value });

  function absenden(e: React.FormEvent) {
    e.preventDefault();
    const text = [
      `Name: ${daten.name}`,
      `Firma: ${daten.firma}`,
      `E-Mail: ${daten.email}`,
      `Telefon: ${daten.telefon}`,
      `Tätigkeit: ${daten.rolle}`,
      "",
      daten.nachricht,
    ].join("\n");
    window.location.href = `mailto:${ZIEL}?subject=${encodeURIComponent(`Demo-Anfrage: ${daten.firma || daten.name}`)}&body=${encodeURIComponent(text)}`;
  }

  return (
    <main className="flex-1 bg-[#ffffff]">
      <SiteNav />
      <SeitenHero
        eyebrow="Demo anfragen"
        titel="Sehen Sie MengenWerk an Ihrem eigenen Plan."
        text="Vereinbaren Sie eine unverbindliche Demo. Wir laden gemeinsam einen Ihrer Einreichpläne hoch und besprechen, wie MengenWerk in Ihren Ablauf passt."
      />
      <Abschnitt>
        <div className="grid lg:grid-cols-[1.3fr_1fr] gap-12">
          <form onSubmit={absenden} className="rounded-2xl border border-[#dde6ea] bg-white p-7 md:p-9 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Feld label="Name *">
                <input required className={feld} value={daten.name} onChange={setze("name")} placeholder="Vor- und Nachname" />
              </Feld>
              <Feld label="Firma">
                <input className={feld} value={daten.firma} onChange={setze("firma")} placeholder="Baumeister GmbH" />
              </Feld>
              <Feld label="E-Mail *">
                <input required type="email" className={feld} value={daten.email} onChange={setze("email")} placeholder="name@firma.at" />
              </Feld>
              <Feld label="Telefon">
                <input type="tel" className={feld} value={daten.telefon} onChange={setze("telefon")} placeholder="+43 …" />
              </Feld>
            </div>
            <Feld label="Tätigkeit">
              <select className={feld} value={daten.rolle} onChange={setze("rolle")}>
                <option value="">Bitte wählen</option>
                <option>Baumeister / Generalunternehmer</option>
                <option>Ausführendes Gewerk</option>
                <option>Architektur / Planung</option>
                <option>Bauträger / Bauherr</option>
                <option>Sonstiges</option>
              </select>
            </Feld>
            <Feld label="Nachricht">
              <textarea
                rows={4}
                className={feld}
                value={daten.nachricht}
                onChange={setze("nachricht")}
                placeholder="Welche Projekte kalkulieren Sie? Wann passt Ihnen ein Termin?"
              />
            </Feld>
            <button
              type="submit"
              className="rounded-full bg-[#1f2a44] text-white font-semibold text-sm px-6 py-3 hover:bg-[#141c30] transition"
            >
              Demo anfragen →
            </button>
            <p className="text-xs text-[#8b98a4]">Öffnet Ihr E-Mail-Programm mit der vorbereiteten Anfrage an {ZIEL}.</p>
          </form>

          <div className="space-y-6">
            <h2 className="font-display font-extrabold tracking-tight text-xl">Was Sie in der Demo erwartet</h2>
            {[
              ["30 Minuten, online", "Kurz und konkret per Video-Call. Sie müssen nichts installieren."],
              ["Ihr eigener Plan", "Bringen Sie einen Einreichplan mit, den Sie schon kalkuliert haben, und vergleichen Sie Position für Position."],
              ["Unverbindlich", "Kein Abo, kein Vertrag. Sie entscheiden danach in Ruhe."],
            ].map(([t, x]) => (
              <div key={t} className="flex gap-3">
                <span className="mt-1 h-5 w-5 shrink-0 rounded-full bg-[#1f2a44] text-[#2b2d33] text-xs flex items-center justify-center font-bold">✓</span>
                <div>
                  <p className="font-semibold text-[15px]">{t}</p>
                  <p className="text-sm text-[#5d6b78] leading-relaxed">{x}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Abschnitt>
      <SiteFooter />
    </main>
  );
}

function Feld({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-[#5d6b78] mb-1.5">{label}</span>
      {children}
    </label>
  );
}
