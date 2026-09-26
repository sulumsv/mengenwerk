import Link from "next/link";
import { SiteNav, SiteFooter } from "@/components/SiteNav";

const SCHRITTE = [
  { nr: "01", titel: "Plan hochladen", text: "PDF, Scan oder Foto — MengenWerk erkennt den Dateityp automatisch." },
  { nr: "02", titel: "KI analysiert", text: "Fenster, Türen, Wände, Flächen und Kubaturen werden automatisch ausgewertet." },
  { nr: "03", titel: "Ergebnis übernehmen", text: "Massenauszug nach LB-HB 023, direkt in Angebot oder Bestellung einsetzbar." },
];

const MERKMALE = [
  { titel: "22.650+ Positionen", text: "Vollständiger LB-HB 023 Katalog — alle 59 Leistungsgruppen abgedeckt." },
  { titel: "Rechenweg sichtbar", text: "Jede Menge zeigt, aus welchen Maßen sie berechnet wurde. Nachvollziehbar, prüfbar." },
  { titel: "Eigene Preise", text: "Einheitspreise des Betriebs hinterlegen und direkt zur Kostenschätzung kommen." },
  { titel: "Kein Abo nötig", text: "Sofort starten. Keine monatliche Bindung, kein Vertrag, kein Onboarding." },
];

export default function Home() {
  return (
    <main className="flex-1 bg-[#0c0c0b] text-white">
      <SiteNav dark />

      {/* ── HERO ── */}
      <section className="px-6 md:px-10 pt-20 pb-24 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-[1fr_420px] gap-16 items-center">

          {/* Left */}
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/35 mb-7">
              Mengenermittlung · Österreich · LB-HB 023
            </p>
            <h1 className="font-display font-black uppercase leading-[0.9] tracking-tight text-[clamp(3rem,6.5vw,5.5rem)] text-white">
              Einreichplan rein.{" "}
              <span className="text-[#f4c400]">Massenauszug</span>{" "}
              raus.
            </h1>
            <p className="mt-8 text-[1.1rem] text-white/50 max-w-[38ch] leading-[1.65]">
              KI liest den Plan, erkennt alle Bauteile und erstellt
              die Mengenermittlung — strukturiert nach LB-HB,
              mit sichtbarem Rechenweg.
            </p>
            <div className="mt-10 flex items-center gap-4 flex-wrap">
              <Link
                href="/app"
                className="inline-flex items-center gap-2 rounded-lg bg-[#f4c400] text-[#0c0c0b] font-display font-black uppercase tracking-wide text-sm px-7 py-3.5 hover:brightness-105 transition-all"
              >
                Plan analysieren
                <span className="opacity-70">→</span>
              </Link>
              <Link
                href="/vorschau"
                className="inline-flex items-center gap-2 rounded-lg border border-white/15 text-white/60 font-mono text-xs uppercase tracking-widest px-6 py-3.5 hover:border-white/30 hover:text-white/80 transition-all"
              >
                Beispiel ansehen
              </Link>
            </div>

            {/* Trust row */}
            <div className="mt-12 flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#1f7a33]" />
                <span className="font-mono text-xs text-white/35 uppercase tracking-wide">Keine Anmeldung nötig</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#1f7a33]" />
                <span className="font-mono text-xs text-white/35 uppercase tracking-wide">LB-HB 023 konform</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#1f7a33]" />
                <span className="font-mono text-xs text-white/35 uppercase tracking-wide">Für Österreich</span>
              </div>
            </div>
          </div>

          {/* Right — Massenauszug mock */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] overflow-hidden">
            {/* Window chrome */}
            <div className="px-5 py-3.5 border-b border-white/10 flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
              <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
              <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
              <span className="ml-3 font-mono text-[10px] uppercase tracking-widest text-white/20">
                Massenauszug · EFH Muster
              </span>
            </div>

            {/* Table header */}
            <div className="grid grid-cols-[1fr_56px_64px] gap-3 px-5 py-2.5 border-b border-white/10">
              <span className="font-mono text-[10px] uppercase tracking-widest text-white/25">Position</span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-white/25 text-right">Menge</span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-white/25 text-right">EH</span>
            </div>

            {/* Rows */}
            {[
              { lg: "LG 07", pos: "Stahlbeton Bodenplatte C25/30", menge: "34,20", eh: "m³" },
              { lg: "LG 07", pos: "Stahlbeton Außenwand d=25cm", menge: "18,60", eh: "m³" },
              { lg: "LG 08", pos: "Mauerwerk Poroton T8 d=25cm", menge: "142,40", eh: "m²" },
              { lg: "LG 10", pos: "Innenputz zweilagig", menge: "386,00", eh: "m²" },
              { lg: "LG 37", pos: "Fensterelement 3-fach Verglasung", menge: "14", eh: "Stk." },
              { lg: "LG 24", pos: "Fliesenbelag Küche + Bad", menge: "48,60", eh: "m²" },
            ].map((row, i) => (
              <div
                key={i}
                className={`grid grid-cols-[1fr_56px_64px] gap-3 px-5 py-3 border-b border-white/[0.06] ${i === 0 ? "bg-[#f4c400]/[0.04]" : ""}`}
              >
                <div>
                  <span className="font-mono text-[9px] text-[#f4c400]/60 uppercase tracking-wide mr-2">{row.lg}</span>
                  <span className="font-mono text-[11px] text-white/60">{row.pos}</span>
                </div>
                <span className="font-mono text-[11px] text-white/80 text-right tabular-nums">{row.menge}</span>
                <span className="font-mono text-[11px] text-white/35 text-right">{row.eh}</span>
              </div>
            ))}

            {/* Footer */}
            <div className="px-5 py-4 flex items-center justify-between">
              <span className="font-mono text-[10px] text-white/20 uppercase tracking-wide">47 Positionen · 12 Leistungsgruppen</span>
              <span className="font-mono text-[10px] text-[#1f7a33] uppercase tracking-wide">✓ Rechenweg vorhanden</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <div className="border-y border-white/8 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto px-6 md:px-10 grid grid-cols-2 md:grid-cols-4">
          {[
            { wert: "< 5 Min.", label: "Plan → Massenauszug" },
            { wert: "22.650", label: "Positionen LB-HB 023" },
            { wert: "59", label: "Leistungsgruppen" },
            { wert: "100 %", label: "Rechenweg sichtbar" },
          ].map(({ wert, label }) => (
            <div key={wert} className="py-7 px-6 border-r border-white/8 last:border-r-0">
              <p className="font-display font-black text-2xl text-white">{wert}</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/30 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── WIE ES FUNKTIONIERT ── */}
      <section className="px-6 md:px-10 py-24 max-w-6xl mx-auto">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/30 mb-10">Ablauf</p>
        <div className="grid md:grid-cols-3 gap-8">
          {SCHRITTE.map(({ nr, titel, text }) => (
            <div key={nr} className="group">
              <div className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center mb-6 group-hover:border-[#f4c400]/30 transition-colors">
                <span className="font-mono text-xs text-white/30">{nr}</span>
              </div>
              <h3 className="font-display font-bold uppercase text-base text-white mb-3">{titel}</h3>
              <p className="text-sm text-white/40 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── MERKMALE ── */}
      <section className="border-t border-white/8 px-6 md:px-10 py-24 max-w-6xl mx-auto">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/30 mb-10">Was drin steckt</p>
        <div className="grid sm:grid-cols-2 gap-px bg-white/8 rounded-2xl overflow-hidden border border-white/8">
          {MERKMALE.map(({ titel, text }) => (
            <div key={titel} className="bg-[#0c0c0b] p-8 hover:bg-white/[0.03] transition-colors">
              <h3 className="font-display font-bold uppercase text-base text-white mb-3">{titel}</h3>
              <p className="text-sm text-white/40 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="border-t border-white/8 px-6 md:px-10 py-28 max-w-6xl mx-auto text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/25 mb-8">Jetzt starten</p>
        <h2 className="font-display font-black uppercase leading-[0.9] text-[clamp(2.4rem,5vw,4.2rem)] text-white mb-6">
          Testen Sie es an<br />Ihrem eigenen Plan.
        </h2>
        <p className="text-white/40 text-[1rem] leading-relaxed mb-12 max-w-[40ch] mx-auto">
          Plan hochladen, Mengen prüfen — kein Abo, kein Vertrag.
          Sofort loslegen.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            href="/app"
            className="inline-flex items-center gap-2 rounded-lg bg-[#f4c400] text-[#0c0c0b] font-display font-black uppercase tracking-wide text-sm px-8 py-4 hover:brightness-105 transition-all"
          >
            Plan analysieren →
          </Link>
          <Link
            href="/vorschau"
            className="inline-flex items-center gap-2 rounded-lg border border-white/15 text-white/50 font-mono text-xs uppercase tracking-widest px-7 py-4 hover:border-white/25 hover:text-white/70 transition-all"
          >
            Beispielauswertung
          </Link>
        </div>
      </section>

      <SiteFooter dark />
    </main>
  );
}
