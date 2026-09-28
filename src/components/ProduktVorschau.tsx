import { Container, Eyebrow } from "./Marketing";

const GEWERKE = [
  { k: "Erd", w: 38 },
  { k: "Beton", w: 72 },
  { k: "Mauer", w: 100 },
  { k: "Putz", w: 64 },
  { k: "Estrich", w: 46 },
  { k: "Dach", w: 58 },
];

const ANALYSEN = [
  { name: "EFH Torricelligasse", ort: "Wien 17", pos: 47, status: "fertig" },
  { name: "Doppelhaus Kagran", ort: "Wien 22", pos: 63, status: "fertig" },
  { name: "Zubau Mödling", ort: "Niederösterreich", pos: 21, status: "2 Annahmen" },
];

function Haus() {
  return (
    <svg viewBox="0 0 320 200" className="w-full h-auto" aria-hidden>
      <rect x="0" y="176" width="320" height="24" fill="#e9e3d8" />
      <path d="M40 176V92L110 34l70 58v84Z" fill="#ffffff" stroke="#231f1a" strokeWidth="2" />
      <path d="M110 34 40 92M110 34l70 58" stroke="#b98a5e" strokeWidth="7" strokeLinecap="round" />
      <rect x="70" y="84" width="80" height="54" fill="#cfd8e0" stroke="#231f1a" strokeWidth="2" />
      <path d="M96 84v54M123 84v54M70 111h80" stroke="#231f1a" strokeWidth="1.5" />
      <rect x="180" y="104" width="120" height="72" fill="#ffffff" stroke="#231f1a" strokeWidth="2" />
      <rect x="180" y="98" width="120" height="8" fill="#b98a5e" />
      <rect x="196" y="120" width="92" height="56" fill="#2a2724" />
      <path d="M196 134h92M196 148h92M196 162h92" stroke="#3a3632" strokeWidth="1" />
      <rect x="150" y="136" width="22" height="40" fill="#2a2724" />
      <rect x="146" y="132" width="30" height="4" fill="#b98a5e" />
      <rect x="54" y="144" width="30" height="32" fill="#cfd8e0" stroke="#231f1a" strokeWidth="2" />
      <circle cx="20" cy="150" r="16" fill="#cbbfa6" />
      <rect x="18" y="160" width="4" height="16" fill="#8a7a62" />
    </svg>
  );
}

export function ProduktVorschau() {
  return (
    <section className="bg-[#fbf8f3] py-20 md:py-28">
      <Container>
        <div className="max-w-2xl mb-12">
          <Eyebrow>Übersicht</Eyebrow>
          <h2 className="font-display font-medium tracking-tight text-[clamp(1.9rem,3.6vw,2.9rem)] leading-[1.08]">
            Alle Projekte und Mengen auf einen Blick.
          </h2>
          <p className="mt-4 text-sm text-[#9a9184]">Beispielansicht mit Musterprojekten.</p>
        </div>

        <div className="rounded-[1.75rem] border border-[#e8e0d2] bg-[#f3ede3] p-3 md:p-5 shadow-[0_40px_80px_-60px_rgba(120,70,40,0.6)]">
          <div className="grid gap-3 md:gap-4 lg:grid-cols-[1.35fr_1fr_0.9fr]">
            {/* Hauptkachel */}
            <div className="rounded-2xl bg-white p-6 flex flex-col justify-between gap-6 lg:row-span-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-[#9a9184]">Aktuelles Projekt</p>
                  <p className="mt-1 text-lg font-semibold">EFH Torricelligasse</p>
                </div>
                <span className="rounded-full bg-[#f6e2d7] px-3 py-1 text-xs font-medium text-[#a8461f]">Analyse fertig</span>
              </div>
              <Haus />
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-[#f6e2d7] p-4">
                  <p className="text-xs text-[#a8461f]">Positionen</p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight">47</p>
                  <div className="mt-3 h-1.5 rounded-full bg-white/70">
                    <div className="h-full w-[94%] rounded-full bg-[#c2562f]" />
                  </div>
                  <p className="mt-1.5 text-[11px] text-[#a8461f]">94 % aus dem Plan belegt</p>
                </div>
                <div className="rounded-xl bg-[#e6ebf2] p-4">
                  <p className="text-xs text-[#2c4466]">Wohnnutzfläche</p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight">222,05</p>
                  <p className="mt-3 text-[11px] text-[#2c4466]">m² laut Raumstempel</p>
                </div>
              </div>
            </div>

            {/* Balkendiagramm */}
            <div className="rounded-2xl bg-white p-6">
              <div className="flex items-baseline justify-between">
                <p className="font-semibold">Mengen nach Gewerk</p>
                <p className="text-xs text-[#9a9184]">relativ</p>
              </div>
              <div className="mt-6 flex h-36 items-end gap-2.5">
                {GEWERKE.map((g) => (
                  <div key={g.k} className="flex h-full flex-1 flex-col items-center gap-2">
                    <div className="flex w-full flex-1 items-end">
                      <div
                        className={`w-full rounded-md ${g.w === 100 ? "bg-[#c2562f]" : "bg-[#e9dcc8]"}`}
                        style={{ height: `${g.w}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-[#9a9184]">{g.k}</span>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-sm text-[#6e665b]">
                Mauerwerk <span className="font-semibold text-[#231f1a]">142,40 m²</span>
              </p>
            </div>

            {/* Kennzahl */}
            <div className="rounded-2xl bg-[#231f1a] text-[#fbf8f3] p-6 flex flex-col justify-between">
              <p className="text-xs text-[#fbf8f3]/60">Zeit bis zum Ergebnis</p>
              <div>
                <p className="text-5xl font-semibold tracking-tight">4:12</p>
                <p className="mt-1 text-sm text-[#fbf8f3]/60">Minuten für 5 Planblätter</p>
              </div>
            </div>

            {/* Letzte Analysen */}
            <div className="rounded-2xl bg-white p-6 lg:col-span-2">
              <p className="font-semibold mb-4">Letzte Analysen</p>
              <ul className="divide-y divide-[#f3ede3]">
                {ANALYSEN.map((a) => (
                  <li key={a.name} className="flex items-center gap-4 py-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f3ede3] text-xs font-semibold text-[#6e665b]">
                      {a.name.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{a.name}</p>
                      <p className="text-xs text-[#9a9184]">{a.ort}</p>
                    </div>
                    <span className="hidden sm:inline text-sm tabular-nums text-[#3f3a33]">{a.pos} Pos.</span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                        a.status === "fertig" ? "bg-[#e6ebf2] text-[#2c4466]" : "bg-[#f7ecd2] text-[#8a6412]"
                      }`}
                    >
                      {a.status}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
