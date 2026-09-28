import { Haus3D } from "@/components/Haus3D";
import { SiteNav, SiteFooter } from "@/components/SiteNav";
import { PlanAnalyseSection } from "@/components/PlanAnalyse";
import {
  Abschnitt,
  AbschnittKopf,
  Container,
  CtaBand,
  Eyebrow,
  Karte,
  KnopfPrimaer,
  KnopfSekundaer,
} from "@/components/Marketing";

const SCHRITTE = [
  { nr: "01", titel: "Plan hochladen", text: "Sie laden Ihren Einreichplan als PDF, Scan oder Foto hoch — Grundrisse, Schnitte und Ansichten genügen." },
  { nr: "02", titel: "MengenWerk rechnet", text: "Die KI erkennt Wände, Öffnungen, Flächen und Kubaturen und leitet daraus die Mengen ab." },
  { nr: "03", titel: "Ergebnis übernehmen", text: "Sie erhalten einen Massenauszug nach LB-HB 023 mit nachvollziehbarem Rechenweg für jede Position." },
];

const BELEGE = [
  { pos: "07.01", text: "Stahlbeton Bodenplatte C25/30, d = 25 cm", menge: "34,20 m³", weg: "136,8 m² × 0,25 m", quelle: "Grundriss EG, Maßketten", art: "PLAN" },
  { pos: "08.03", text: "Mauerwerk Hochlochziegel d = 25 cm", menge: "142,40 m²", weg: "Umfang 44,5 m × 3,20 m", quelle: "Schnitt A-A, Geschoßhöhe", art: "HERLEIT" },
  { pos: "37.02", text: "Fensterelement 3-fach Verglasung", menge: "14 Stk.", weg: "Zählung aus Grundriss EG + OG", quelle: "Fenstersymbole im Plan", art: "PLAN" },
  { pos: "10.01", text: "Innenputz zweilagig", menge: "386,00 m²", weg: "Wandflächen innen − Öffnungen", quelle: "Keine Raumhöhe im OG vermerkt", art: "ANNAHME" },
];

const BADGE: Record<string, string> = {
  PLAN: "bg-[#e7f5eb] text-[#2f5fd0] border-[#bfe3c9]",
  HERLEIT: "bg-[#eef2fb] text-[#2d5bb8] border-[#cbd8f3]",
  ANNAHME: "bg-[#fdf3d7] text-[#8a6a00] border-[#f1dc9a]",
};

const FUNKTIONEN = [
  { titel: "Automatische Planauswertung", text: "Grundrisse, Schnitte und Ansichten werden gelesen — auch Scans und Fotos." },
  { titel: "Rechenweg zu jeder Menge", text: "Jede Zahl zeigt, aus welchen Maßen sie berechnet wurde. Prüfbar statt geglaubt." },
  { titel: "LB-HB 023 Zuordnung", text: "Über 22.650 Positionen in 59 Leistungsgruppen — automatisch zugeordnet." },
  { titel: "Annahmen offengelegt", text: "Fehlt eine Information im Plan, sagt MengenWerk das — statt still zu raten." },
  { titel: "Eigene Einheitspreise", text: "Hinterlegen Sie Ihre Preise und kommen direkt zur Kostenschätzung." },
  { titel: "Export für Angebot & Bestellung", text: "Massenauszug als PDF oder Excel — bereit zur Weitergabe." },
];

const ZIELGRUPPEN = [
  { titel: "Baumeister & kleine Betriebe", text: "Mengen für Angebote in Minuten statt nach Feierabend von Hand." },
  { titel: "Ausführende Gewerke", text: "Nur die Positionen, die Sie brauchen — sauber nach Leistungsgruppe." },
  { titel: "Planung & Architektur", text: "Schnelle Kostenrahmen schon in der Einreichphase." },
  { titel: "Bauherren & Prüfung", text: "Angebote gegen nachvollziehbare Mengen plausibilisieren." },
];

const FAQ = [
  { f: "Welche Pläne kann MengenWerk lesen?", a: "Einreichpläne als PDF, gescannte Pläne und Fotos. Am besten funktionieren vermaßte Grundrisse mit Schnitten." },
  { f: "Wie genau sind die Mengen?", a: "Jede Menge wird mit Rechenweg und Quelle ausgewiesen. Wo der Plan keine Angabe enthält, wird eine Annahme sichtbar markiert, damit Sie gezielt prüfen können." },
  { f: "Ersetzt MengenWerk den Kalkulanten?", a: "Nein. Es nimmt die mühsame Vorarbeit ab — das Aufmaß. Die fachliche Prüfung und Bepreisung bleibt bei Ihnen." },
  { f: "Brauche ich ein Abo?", a: "Nein. Sie können einzelne Pläne analysieren. Für Betriebe mit laufendem Bedarf gibt es ein Angebot auf Anfrage." },
  { f: "Was passiert mit meinen Plänen?", a: "Pläne werden nur für die Analyse verarbeitet. Details finden Sie in der Datenschutzerklärung." },
];

export default function Home() {
  return (
    <main className="flex-1 bg-[#f7f9fc]">
      <SiteNav />

      {/* Hero */}
      <section className="bg-[#121b30] text-white bg-raster">
        <Container className="pt-20 pb-24 grid lg:grid-cols-[1.25fr_1fr] gap-14 items-center">
          <div>
            <p className="inline-block rounded-full border border-white/15 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-white/55 mb-7">
              KI-Mengenermittlung · Österreich
            </p>
            <h1 className="font-display font-extrabold tracking-tight leading-[1.02] text-[clamp(2.4rem,5.5vw,4.2rem)]">
              Vom Einreichplan zum <span className="text-[#b6e36b]">belastbaren Massenauszug.</span>
            </h1>
            <p className="mt-7 text-[1.05rem] text-white/60 max-w-[46ch] leading-relaxed">
              MengenWerk liest Ihren Plan, erkennt alle Bauteile und erstellt die Mengenermittlung — strukturiert nach
              LB-HB 023, mit sichtbarem Rechenweg für jede Position.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <KnopfPrimaer href="/demo">Demo anfragen →</KnopfPrimaer>
              <KnopfSekundaer href="/app">Plan analysieren</KnopfSekundaer>
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40 mb-2">Input</p>
              <p className="font-semibold mb-3">Einreichplan (PDF)</p>
              <ul className="grid grid-cols-2 gap-1.5 text-sm text-white/55">
                {["Grundrisse", "Schnitte", "Ansichten", "Maßketten"].map((x) => (
                  <li key={x}>· {x}</li>
                ))}
              </ul>
            </div>
            <p className="text-center font-mono text-xs text-[#b6e36b]">↓ MengenWerk rechnet</p>
            <div className="rounded-xl border border-[#b6e36b]/30 bg-[#b6e36b]/[0.06] p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#b6e36b]/80 mb-2">Output</p>
              <p className="font-semibold mb-3">Massenauszug + Rechenweg</p>
              <ul className="space-y-1.5 text-sm text-white/65">
                {[
                  "Mengen nach LB-HB 023",
                  "Rechenweg und Quelle je Position",
                  "Offen markierte Annahmen",
                  "Export als PDF und Excel",
                ].map((x) => (
                  <li key={x}>✓ {x}</li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </section>

      {/* Kennzahlen */}
      <section className="bg-white border-b border-[#e3e8f0]">
        <Container className="grid grid-cols-2 md:grid-cols-4">
          {[
            { wert: "< 5 Min.", label: "vom Plan zum Massenauszug" },
            { wert: "LB-HB 023", label: "Standardleistungsbuch Hochbau" },
            { wert: "22.650+", label: "hinterlegte Positionen" },
            { wert: "100 %", label: "Rechenweg sichtbar" },
          ].map(({ wert, label }) => (
            <div key={label} className="py-8 pr-6">
              <p className="font-display font-extrabold text-2xl text-[#0f172a]">{wert}</p>
              <p className="text-xs text-[#5f6b80] mt-1">{label}</p>
            </div>
          ))}
        </Container>
      </section>

      {/* Leitsatz */}
      <section className="bg-[#121b30] text-white">
        <Container className="py-14">
          <p className="font-display font-extrabold tracking-tight text-[clamp(1.4rem,3vw,2rem)] leading-tight max-w-3xl">
            Vom Plan zur Menge — <span className="text-[#b6e36b]">in Minuten</span>, nicht in Stunden oder Tagen.
          </p>
        </Container>
      </section>

      {/* Problem */}
      <Abschnitt>
        <div className="grid md:grid-cols-2 gap-14 items-center">
          <div>
            <Eyebrow tone="light">Das Problem</Eyebrow>
            <h2 className="font-display font-extrabold tracking-tight text-[clamp(1.6rem,3vw,2.25rem)] leading-[1.1]">
              Aufmaß kostet Tage — und verzeiht keine vergessene Position.
            </h2>
            <p className="mt-5 text-[15px] text-[#56627a] leading-relaxed">
              Mengen aus Plänen von Hand herauszumessen ist langsam, fehleranfällig und schwer nachvollziehbar. Eine
              übersehene Wand oder ein falsch abgezogenes Fenster fällt oft erst auf der Baustelle auf.
            </p>
            <p className="mt-4 text-[15px] text-[#0f172a] leading-relaxed font-medium">
              MengenWerk liest den Einreichplan, ermittelt die Mengen und zeigt für jede Position, woher sie kommt.
            </p>
          </div>
          <div className="rounded-xl bg-[#121b30] bg-raster aspect-[4/3] p-8 flex flex-col justify-between">
            <svg viewBox="0 0 200 130" className="w-full text-white/70" fill="none" stroke="currentColor">
              <rect x="20" y="15" width="160" height="100" strokeWidth="2.5" />
              <path d="M95 15v55M20 70h75M130 70v45" strokeWidth="1.5" />
              <path d="M55 115h20M150 15h20" stroke="#b6e36b" strokeWidth="3" />
              <path d="M20 125h160M20 122v6M180 122v6" stroke="#5b8cff" strokeWidth="1" />
              <text x="100" y="128" fontSize="6" fill="#5b8cff" stroke="none" textAnchor="middle">12,10 m</text>
            </svg>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40 text-center">
              Aus dem Plan zur Menge
            </p>
          </div>
        </div>
      </Abschnitt>

      {/* Ablauf */}
      <Abschnitt ton="dunkel" id="ablauf">
        <AbschnittKopf
          ton="dunkel"
          eyebrow="So funktioniert's"
          titel="In drei Schritten zum Massenauszug."
          text="Sie laden den Plan hoch — den Rest übernimmt MengenWerk. Was im Hintergrund passiert, ist komplex; für Sie bleibt es einfach."
        />
        <div className="grid md:grid-cols-3 gap-4">
          {SCHRITTE.map((s) => (
            <Karte key={s.nr} ton="dunkel" nummer={s.nr} titel={s.titel}>
              {s.text}
            </Karte>
          ))}
        </div>
      </Abschnitt>

      {/* Animationen */}
      <div className="bg-[#121b30] text-white">
        <PlanAnalyseSection />
        <Haus3D />
      </div>

      {/* Belege */}
      <Abschnitt ton="grau">
        <AbschnittKopf
          eyebrow="So sieht das Ergebnis aus"
          titel="Fragen Sie bei jeder Zahl: Woher kommt sie?"
          text="Vier Zeilen aus einem Massenauszug für ein Einfamilienhaus. Jede Position trägt ihre Rechnung, ihre Quelle im Plan und eine klare Kennzeichnung."
        />
        <div className="rounded-xl border border-[#e3e8f0] bg-white overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="text-left font-mono text-[10px] uppercase tracking-[0.15em] text-[#8b95a7] border-b border-[#eef2f7]">
                <th className="px-5 py-3 font-normal">Pos.</th>
                <th className="px-5 py-3 font-normal">Leistung</th>
                <th className="px-5 py-3 font-normal text-right">Menge</th>
                <th className="px-5 py-3 font-normal">Rechenweg</th>
                <th className="px-5 py-3 font-normal">Quelle</th>
                <th className="px-5 py-3 font-normal">Beleg</th>
              </tr>
            </thead>
            <tbody>
              {BELEGE.map((b) => (
                <tr key={b.pos} className="border-b border-[#f1f4f9] last:border-0 align-top">
                  <td className="px-5 py-4 font-mono text-xs text-[#8b95a7]">{b.pos}</td>
                  <td className="px-5 py-4 font-medium">{b.text}</td>
                  <td className="px-5 py-4 text-right font-num whitespace-nowrap">{b.menge}</td>
                  <td className="px-5 py-4 text-[#56627a] font-mono text-xs">{b.weg}</td>
                  <td className="px-5 py-4 text-[#56627a] text-xs">{b.quelle}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-block rounded border px-2 py-0.5 font-mono text-[10px] ${BADGE[b.art]}`}>
                      {b.art}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-8 grid md:grid-cols-3 gap-6 text-sm">
          <div>
            <p className="font-semibold mb-1">Plan</p>
            <p className="text-[#5f6b80]">Die Zahl steht so im Plan — Maßkette, Beschriftung, Symbol.</p>
          </div>
          <div>
            <p className="font-semibold mb-1">Herleit</p>
            <p className="text-[#5f6b80]">Aus Planmaßen berechnet. Die Formel steht daneben und lässt sich nachrechnen.</p>
          </div>
          <div>
            <p className="font-semibold mb-1">Annahme</p>
            <p className="text-[#5f6b80]">Die Information fehlt im Plan. MengenWerk sagt, was fehlt und welcher Wert angesetzt wurde.</p>
          </div>
        </div>
      </Abschnitt>

      {/* Funktionen */}
      <Abschnitt id="funktionen">
        <AbschnittKopf eyebrow="Funktionen" titel="Gebaut für belastbare Zahlen." />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FUNKTIONEN.map((f) => (
            <Karte key={f.titel} titel={f.titel}>
              {f.text}
            </Karte>
          ))}
        </div>
      </Abschnitt>

      {/* Zielgruppen */}
      <Abschnitt ton="grau">
        <AbschnittKopf eyebrow="Für wen" titel="Für alle, die aus Plänen Zahlen machen." />
        <div className="grid sm:grid-cols-2 gap-4">
          {ZIELGRUPPEN.map((z) => (
            <Karte key={z.titel} titel={z.titel}>
              {z.text}
            </Karte>
          ))}
        </div>
      </Abschnitt>

      {/* Beispiel */}
      <Abschnitt>
        <div className="rounded-2xl border border-[#e3e8f0] bg-white p-8 md:p-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-xl">
            <Eyebrow tone="light">Beispielauswertung</Eyebrow>
            <h2 className="font-display font-extrabold tracking-tight text-2xl">Sehen Sie ein echtes Ergebnis.</h2>
            <p className="mt-3 text-sm text-[#5f6b80] leading-relaxed">
              Ein vollständiger Massenauszug für ein Einfamilienhaus — mit allen Positionen, Rechenwegen und
              markierten Annahmen.
            </p>
          </div>
          <KnopfSekundaer href="/vorschau" ton="hell">Beispiel ansehen →</KnopfSekundaer>
        </div>
      </Abschnitt>

      {/* FAQ */}
      <Abschnitt ton="grau">
        <AbschnittKopf eyebrow="FAQ" titel="Häufige Fragen" />
        <div className="rounded-xl border border-[#e3e8f0] bg-white divide-y divide-[#eef2f7]">
          {FAQ.map(({ f, a }) => (
            <details key={f} className="group px-6 py-5">
              <summary className="flex items-center justify-between cursor-pointer list-none font-medium text-[15px]">
                {f}
                <span className="text-[#8b95a7] group-open:rotate-45 transition-transform text-xl leading-none">+</span>
              </summary>
              <p className="mt-3 text-sm text-[#5f6b80] leading-relaxed max-w-3xl">{a}</p>
            </details>
          ))}
        </div>
      </Abschnitt>

      <CtaBand />
      <SiteFooter />
    </main>
  );
}
