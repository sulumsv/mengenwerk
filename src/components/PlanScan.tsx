/**
 * Animierter Einreichplan für die Startseite: eine Scanlinie fährt über den
 * Grundriss, erkannte Räume, Fenster und Wände leuchten nacheinander auf, am
 * Ende steht das Ergebnis. Reines CSS, ohne Bibliothek; bei reduzierter
 * Bewegung steht alles still und vollständig da (siehe globals.css).
 */

const RAEUME = [
  { x: 40, y: 40, w: 200, h: 140, name: "Wohnküche", m2: "32,40 m²", d: "0.6s" },
  { x: 240, y: 40, w: 120, h: 90, name: "Zimmer", m2: "12,60 m²", d: "1.4s" },
  { x: 360, y: 40, w: 120, h: 90, name: "Schlafen", m2: "14,85 m²", d: "2.2s" },
  { x: 240, y: 130, w: 70, h: 50, name: "Bad", m2: "7,20 m²", d: "3.0s" },
  { x: 310, y: 130, w: 50, h: 50, name: "WC", m2: "2,71 m²", d: "3.4s" },
  { x: 360, y: 130, w: 120, h: 50, name: "Gang", m2: "6,81 m²", d: "3.8s" },
];

const FENSTER = [
  { x: 80, y: 36, w: 60, h: 8, t: "FE 150/140", d: "4.4s" },
  { x: 280, y: 36, w: 45, h: 8, t: "FE 120/140", d: "4.7s" },
  { x: 400, y: 36, w: 45, h: 8, t: "FE 120/140", d: "5.0s" },
  { x: 36, y: 90, w: 8, h: 50, t: "FE 90/140", d: "5.3s" },
];

export function PlanScan() {
  return (
    <div className="relative mx-auto w-full max-w-[640px]">
      <div className="plan-kippen relative">
        <div className="relative aspect-[520/260] overflow-hidden rounded-2xl border border-white/25 bg-[#fdfcf9] shadow-[0_40px_80px_-40px_rgba(0,0,0,0.7)]">
          <svg viewBox="0 0 520 260" className="absolute inset-0 h-full w-full" fill="none">
            {/* Raster */}
            <g stroke="#e9e6dc" strokeWidth="0.5">
              {Array.from({ length: 26 }, (_, i) => (
                <line key={`v${i}`} x1={i * 20} y1="0" x2={i * 20} y2="260" />
              ))}
              {Array.from({ length: 13 }, (_, i) => (
                <line key={`h${i}`} x1="0" y1={i * 20} x2="520" y2={i * 20} />
              ))}
            </g>

            {/* Erkannte Raumflächen */}
            {RAEUME.map((r) => (
              <rect
                key={r.name}
                className="scan-flaeche"
                style={{ animationDelay: r.d }}
                x={r.x + 3}
                y={r.y + 3}
                width={r.w - 6}
                height={r.h - 6}
                fill="#f2b233"
                fillOpacity="0.22"
                stroke="#f2b233"
                strokeWidth="1.5"
              />
            ))}

            {/* Wände */}
            <g stroke="#1f2a44" strokeLinecap="square">
              <rect x="40" y="40" width="440" height="140" strokeWidth="7" />
              <path d="M240 40v140M360 40v140M240 130h240M310 130v50" strokeWidth="3.5" />
            </g>

            {/* Fenster */}
            {FENSTER.map((f, i) => (
              <g key={i}>
                <rect x={f.x} y={f.y} width={f.w} height={f.h} fill="#fdfcf9" stroke="#1f2a44" strokeWidth="1" />
                <rect
                  className="scan-flaeche"
                  style={{ animationDelay: f.d }}
                  x={f.x - 3}
                  y={f.y - 3}
                  width={f.w + 6}
                  height={f.h + 6}
                  rx="2"
                  stroke="#2c7a4b"
                  strokeWidth="2"
                />
              </g>
            ))}

            {/* Türbögen */}
            <g stroke="#1f2a44" strokeWidth="0.9">
              <path d="M240 150 a26 26 0 0 1 -26 -26" />
              <path d="M360 100 a24 24 0 0 0 24 -24" />
              <path d="M310 175 a20 20 0 0 1 20 -20" />
            </g>

            {/* Raumstempel */}
            <g fontFamily="var(--font-body), sans-serif" textAnchor="middle">
              {RAEUME.map((r) => (
                <g key={`t-${r.name}`}>
                  <text x={r.x + r.w / 2} y={r.y + r.h / 2 - 2} fontSize="9" fill="#1f2a44" fontWeight="600">
                    {r.name}
                  </text>
                  <text x={r.x + r.w / 2} y={r.y + r.h / 2 + 10} fontSize="7.5" fill="#5b6472">
                    {r.m2}
                  </text>
                </g>
              ))}
            </g>

            {/* Maßketten */}
            <g stroke="#5b6472" strokeWidth="0.7" fill="#5b6472" fontFamily="var(--font-body), sans-serif" fontSize="8">
              <line x1="40" y1="210" x2="480" y2="210" />
              {[40, 240, 360, 480].map((x) => (
                <line key={x} x1={x - 3} y1="213" x2={x + 3} y2="207" />
              ))}
              <text x="140" y="223" textAnchor="middle" stroke="none">5,00</text>
              <text x="300" y="223" textAnchor="middle" stroke="none">3,00</text>
              <text x="420" y="223" textAnchor="middle" stroke="none">3,00</text>
              <line
                className="scan-flaeche"
                style={{ animationDelay: "5.8s" }}
                x1="40"
                y1="210"
                x2="480"
                y2="210"
                stroke="#f2b233"
                strokeWidth="3"
              />
            </g>
            <text x="40" y="248" fontFamily="var(--font-body), sans-serif" fontSize="7" fill="#8a93a0" letterSpacing="0.6">
              EINREICHPLAN · GRUNDRISS EG · M 1:100
            </text>
          </svg>

          <div className="scan-linie absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-[#f2b233]/45 to-transparent" />
        </div>

        {/* Beschriftungen, die beim Erkennen aufpoppen */}
        <span className="marke absolute left-[6%] top-[-6%] rounded-lg bg-white px-2.5 py-1.5 text-[11px] leading-tight shadow-lg" style={{ animationDelay: "1s" }}>
          <span className="block text-[#5b6472]">Raumstempel erkannt</span>
          <span className="block font-semibold text-[#111827]">Wohnküche · 32,40 m²</span>
        </span>
        <span className="marke absolute right-[2%] top-[-8%] rounded-lg bg-white px-2.5 py-1.5 text-[11px] leading-tight shadow-lg" style={{ animationDelay: "4.6s" }}>
          <span className="block text-[#2c7a4b]">4 Fenster gefunden</span>
          <span className="block font-semibold text-[#111827]">Fensterfläche 6,72 m²</span>
        </span>
      </div>

      <div
        className="marke absolute -bottom-8 right-0 md:-right-8 rounded-xl bg-[#111827] px-4 py-3 text-white shadow-xl"
        style={{ animationDelay: "6.2s" }}
      >
        <p className="text-[11px] text-white/60">Mauerwerk 25 cm, aus Wandlänge × Höhe</p>
        <p className="text-xl font-semibold">142,40 m²</p>
        <p className="text-[11px] text-[#f2b233]">44,50 m × 3,20 m</p>
      </div>
    </div>
  );
}
