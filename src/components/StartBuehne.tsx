import Link from "next/link";
import { LogoMark } from "./Logo";

function Haus() {
  return (
    <svg viewBox="0 0 900 430" className="w-full h-auto" aria-hidden>
      <defs>
        <linearGradient id="glas" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3b4b5a" />
          <stop offset="1" stopColor="#6f8597" />
        </linearGradient>
        <linearGradient id="licht" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd9a3" />
          <stop offset="1" stopColor="#f3b56b" />
        </linearGradient>
        <linearGradient id="holz" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#c89a6a" />
          <stop offset="1" stopColor="#a87a4c" />
        </linearGradient>
      </defs>
      <ellipse cx="450" cy="412" rx="430" ry="18" fill="#cfe3ee" />
      <rect x="40" y="398" width="820" height="14" rx="7" fill="#e7eff4" />

      <path d="M120 400V175L300 40l180 135v225Z" fill="#ffffff" />
      <path d="M300 40 120 175M300 40l180 135" stroke="url(#holz)" strokeWidth="16" strokeLinecap="round" />
      <path d="M205 170 300 98l95 72v90H205Z" fill="url(#glas)" />
      <path d="M252 134v126M300 98v162M348 134v126M205 215h190" stroke="#1f2a33" strokeWidth="4" />
      <rect x="150" y="290" width="150" height="110" fill="url(#licht)" />
      <path d="M200 290v110M250 290v110" stroke="#1f2a33" strokeWidth="4" />
      <rect x="150" y="290" width="150" height="110" fill="none" stroke="#1f2a33" strokeWidth="5" />

      <rect x="480" y="210" width="330" height="190" fill="#ffffff" />
      <rect x="470" y="198" width="350" height="16" rx="3" fill="#f4f7f9" />
      <rect x="480" y="214" width="330" height="8" fill="url(#holz)" />
      <path d="M500 228v42M810 228v42M500 250h310" stroke="#1f2a33" strokeWidth="3" />
      <path d="M520 250v20M550 250v20M580 250v20M610 250v20M640 250v20M670 250v20M700 250v20M730 250v20M760 250v20M790 250v20" stroke="#1f2a33" strokeWidth="2" />
      <rect x="520" y="226" width="80" height="44" fill="url(#licht)" opacity="0.9" />
      <rect x="620" y="300" width="170" height="100" fill="#26303a" />
      <path d="M620 325h170M620 350h170M620 375h170" stroke="#3a4652" strokeWidth="2" />
      <rect x="612" y="292" width="186" height="8" fill="url(#holz)" />
      <rect x="505" y="300" width="60" height="100" fill="url(#holz)" />
      <rect x="520" y="310" width="30" height="90" fill="#1f2a33" />
      <circle cx="515" cy="318" r="3" fill="#ffe2b0" />
      <circle cx="605" cy="318" r="3" fill="#ffe2b0" />

      <circle cx="80" cy="330" r="46" fill="#b9d0c9" opacity="0.9" />
      <rect x="76" y="360" width="8" height="40" fill="#8a9a92" />
      <circle cx="850" cy="350" r="30" fill="#c5d8d2" />
      <rect x="847" y="370" width="6" height="30" fill="#8a9a92" />
      <path d="M300 405h120l-10 12H290Z" fill="#dfe8ee" />
    </svg>
  );
}

const FILTER = [
  { label: "Plan", wert: "PDF, Scan, Foto" },
  { label: "Leistungsbuch", wert: "LB-HB 023" },
  { label: "Ergebnis", wert: "Massenauszug" },
];

export function StartBuehne() {
  return (
    <section className="p-3 md:p-5">
      <div className="buehne relative overflow-hidden rounded-[2rem] md:rounded-[2.75rem] min-h-[640px] lg:min-h-[calc(100vh-2.5rem)] flex flex-col">
        {/* Filterleiste */}
        <div className="relative z-10 flex items-center justify-between gap-3 p-4 md:p-6">
          <Link href="/demo" className="milchglas hidden md:inline-flex items-center gap-3 rounded-full px-5 py-3 text-sm font-medium text-[#16202a]">
            <span className="text-[#2f78a6]">↗</span> Demo anfragen
          </Link>
          <div className="milchglas mx-auto flex items-center divide-x divide-white/80 rounded-full px-2 py-2 text-[#16202a]">
            {FILTER.map((f, i) => (
              <div key={f.label} className={`px-4 md:px-6 ${i === 2 ? "hidden sm:block" : ""}`}>
                <p className="text-[10px] text-[#5d6b78]">{f.label}</p>
                <p className="text-[13px] font-semibold whitespace-nowrap">{f.wert}</p>
              </div>
            ))}
          </div>
          <Link href="/app" className="milchglas hidden md:inline-flex items-center gap-3 rounded-full px-5 py-3 text-sm font-medium text-[#16202a]">
            Plan hochladen <span className="text-[#2f78a6]">↗</span>
          </Link>
        </div>

        {/* Überschrift */}
        <div className="relative z-10 px-6 text-center">
          <h1 className="font-display font-semibold tracking-tight leading-[0.95] text-white/90 text-[clamp(3rem,8.5vw,7.5rem)] drop-shadow-[0_2px_24px_rgba(47,120,166,0.25)]">
            Vom Plan
            <br />
            zur Menge
          </h1>
        </div>
        <p className="relative z-10 mx-6 mt-6 md:absolute md:left-12 md:top-[46%] md:mx-0 md:mt-0 max-w-[30ch] text-[15px] leading-relaxed text-[#16202a]/75">
          MengenWerk liest Ihren Einreichplan, erkennt die Bauteile und ermittelt die Mengen nach LB-HB 023. Mit Rechenweg zu
          jeder Position.
        </p>

        {/* Haus */}
        <div className="relative mt-auto px-2 md:px-24 lg:px-40">
          <Haus />
        </div>

        {/* Karten */}
        <div className="relative z-10 grid gap-3 p-3 md:absolute md:inset-x-0 md:bottom-0 md:grid-cols-[minmax(0,340px)_1fr_minmax(0,340px)] md:items-end md:p-6">
          <div className="milchglas rounded-[1.75rem] p-6">
            <p className="text-[15px] font-semibold text-[#16202a]">Mengen, die man prüfen kann</p>
            <p className="mt-2 text-[13px] leading-relaxed text-[#34424f]">
              Jede Zahl zeigt, aus welchen Maßen sie berechnet wurde. Fehlt etwas im Plan, sehen Sie die Annahme.
            </p>
            <div className="mt-5 flex items-end justify-between">
              <div>
                <p className="text-5xl font-semibold tracking-tight text-[#16202a]">22.650+</p>
                <p className="text-xs text-[#5d6b78]">Positionen hinterlegt</p>
              </div>
              <Link href="/app" aria-label="Plan analysieren" className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#16202a] hover:bg-[#dcedf7]">
                ↗
              </Link>
            </div>
          </div>

          <div className="hidden md:flex justify-center pb-6">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-[0_20px_40px_-20px_rgba(22,32,42,0.4)]">
              <LogoMark className="h-12 w-12" />
            </span>
          </div>

          <div className="milchglas rounded-[1.75rem] p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[15px] font-semibold text-[#16202a]">EFH Torricelligasse</p>
                <p className="mt-1 text-xs text-[#5d6b78]">Beispielprojekt, Wien 17</p>
              </div>
              <Link href="/vorschau" aria-label="Beispiel ansehen" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#16202a] hover:bg-[#dcedf7]">
                ↗
              </Link>
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-[#34424f]">
              Zweigeschossiges Einfamilienhaus, aus fünf Planblättern in wenigen Minuten ausgewertet.
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              {[
                ["222 m²", "Nutzfläche"],
                ["47", "Positionen"],
                ["12", "Gewerke"],
              ].map(([z, l]) => (
                <div key={l} className="rounded-2xl bg-white/70 py-2.5">
                  <p className="text-sm font-semibold text-[#16202a]">{z}</p>
                  <p className="text-[10px] text-[#5d6b78]">{l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
