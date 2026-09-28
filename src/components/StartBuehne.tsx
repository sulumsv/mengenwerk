import Link from "next/link";
import { DemoPille, Navigation } from "./Navigation";

const MARKEN = [
  { x: "13%", y: "20%", t: "Wohnen", m: "32,40 m²", d: "0s" },
  { x: "60%", y: "15%", t: "Küche", m: "14,85 m²", d: "1.2s" },
  { x: "16%", y: "63%", t: "Bad", m: "7,20 m²", d: "2.4s" },
  { x: "63%", y: "60%", t: "Zimmer", m: "12,60 m²", d: "3.6s" },
];

function Grundriss() {
  return (
    <div className="plan-kippen relative mx-auto w-full max-w-[540px]">
      <div className="relative aspect-[16/10] rounded-2xl border border-white/40 bg-white/10 backdrop-blur-sm overflow-hidden">
        <svg viewBox="0 0 400 250" className="absolute inset-0 h-full w-full text-white" fill="none" stroke="currentColor">
          <rect x="30" y="22" width="340" height="190" strokeWidth="5" />
          <path d="M190 22v95M30 117h160M225 117v95M225 117h145" strokeWidth="2.5" />
          <path d="M80 212h50M300 22h40M30 55v35M370 150v40" stroke="#d2a86e" strokeWidth="6" />
          <path d="M30 232h340M30 226v12M370 226v12" strokeWidth="1" opacity="0.7" />
          <text x="200" y="246" fontSize="10" fill="#ffffff" stroke="none" textAnchor="middle" opacity="0.85">12,10 m</text>
          <path d="M386 22v190M380 22h12M380 212h12" strokeWidth="1" opacity="0.7" />
          <text x="396" y="120" fontSize="10" fill="#ffffff" stroke="none" textAnchor="middle" opacity="0.85" transform="rotate(90 396 120)">
            8,40 m
          </text>
        </svg>
        <div className="scan-linie absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-[#d2a86e]/40 to-transparent" />
        {MARKEN.map((m) => (
          <span
            key={m.t}
            className="marke absolute rounded-lg bg-white px-2.5 py-1.5 text-[10px] leading-tight shadow-lg"
            style={{ left: m.x, top: m.y, animationDelay: m.d }}
          >
            <span className="block text-[#5d6b78]">{m.t}</span>
            <span className="block font-semibold text-[#2b2d33]">{m.m}</span>
          </span>
        ))}
      </div>
      <div className="marke absolute -right-3 -bottom-5 md:-right-10 rounded-xl bg-[#2b2d33] px-4 py-3 text-white shadow-xl" style={{ animationDelay: "4.8s" }}>
        <p className="text-[10px] text-white/60">Mauerwerk 25 cm</p>
        <p className="text-lg font-semibold">142,40 m²</p>
        <p className="text-[10px] text-[#d2a86e]">44,5 m × 3,20 m</p>
      </div>
    </div>
  );
}

export function StartBuehne() {
  return (
    <section className="seiten-himmel px-3 pt-3 pb-10 md:px-8 md:pt-8 md:pb-16">
      <div className="buehne relative mx-auto max-w-[1400px] rounded-[2rem] md:rounded-[2.5rem] border-[6px] md:border-[10px] border-white shadow-[0_40px_90px_-50px_rgba(40,40,80,0.6)]">
        <Navigation variante="buehne" />

        <div className="relative overflow-hidden rounded-b-[1.6rem] md:rounded-b-[2rem] px-5 pb-8 md:px-10 md:pb-10">
          <p
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-4 select-none text-center font-bold leading-none tracking-tight text-white/[0.14] text-[clamp(3rem,10.5vw,10.5rem)]"
          >
            MENGENWERK
          </p>

          <div className="relative mt-6 hidden sm:flex justify-between gap-6 text-[12px] leading-snug text-white/85">
            <p className="max-w-[22ch]">Mengenermittlung aus Einreichplänen für österreichische Baubetriebe.</p>
            <p className="hidden sm:block max-w-[20ch] text-right">Nach LB-HB 023, mit Rechenweg.</p>
          </div>

          <div className="relative mx-auto mt-8 md:mt-10 max-w-3xl text-center">
            <h1 className="einblenden font-semibold tracking-tight text-white leading-[1.05] text-[clamp(2rem,4.2vw,3.5rem)]">
              Plan hochladen. Mengen erhalten.
            </h1>
            <p className="einblenden einblenden-2 mx-auto mt-5 max-w-[56ch] text-[15px] md:text-[16px] leading-relaxed text-white/85">
              MengenWerk liest Ihren Einreichplan, erkennt Räume, Wände, Fenster und Türen und berechnet daraus den
              Massenauszug für Ihr Angebot. Jede Menge mit Rechenweg und Quelle im Plan.
            </p>
            <div className="einblenden einblenden-3 mt-8 flex flex-wrap items-center justify-center gap-3">
              <DemoPille />
              <Link
                href="/#ablauf"
                className="inline-flex items-center rounded-full border border-white/60 px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-white/15 transition"
              >
                So funktioniert’s
              </Link>
            </div>
          </div>

          <div className="relative mt-10 grid items-end gap-6 lg:grid-cols-[1fr_minmax(0,540px)_1fr]">
            <p className="order-3 lg:order-1 text-[17px] leading-snug text-white">
              Näher am Plan,
              <br />
              schneller zur Zahl.
            </p>
            <div className="order-1 lg:order-2">
              <Grundriss />
            </div>
            <div className="order-2 lg:order-3 grid grid-cols-2 lg:grid-cols-1 gap-3 lg:justify-self-end lg:w-56">
              {[
                ["22.650+", "Positionen aus dem LB-HB 023 hinterlegt"],
                ["5 Min.", "vom Plan zum fertigen Massenauszug"],
              ].map(([z, t]) => (
                <div key={z} className="milchglas-dunkel rounded-2xl p-5 text-white">
                  <p className="text-3xl font-light tracking-tight">{z}</p>
                  <p className="mt-2 text-[12px] leading-snug text-white/75">{t}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
