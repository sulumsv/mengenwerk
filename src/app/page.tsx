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
  { nr: "01", titel: "Plan hochladen", text: "Laden Sie Ihren Einreichplan als PDF, Scan oder Foto hoch. Grundrisse, Schnitte und Ansichten reichen aus." },
  { nr: "02", titel: "MengenWerk rechnet", text: "Wände, Öffnungen, Flächen und Kubaturen werden erkannt und in Mengen umgerechnet." },
  { nr: "03", titel: "Ergebnis übernehmen", text: "Sie bekommen einen Massenauszug nach LB-HB 023. Zu jeder Position steht der Rechenweg." },
];

const BELEGE = [
  { pos: "07.01", text: "Stahlbeton Bodenplatte C25/30, d = 25 cm", menge: "34,20 m³", weg: "136,8 m² × 0,25 m", quelle: "Grundriss EG, Maßketten", art: "PLAN" },
  { pos: "08.03", text: "Mauerwerk Hochlochziegel d = 25 cm", menge: "142,40 m²", weg: "Umfang 44,5 m × 3,20 m", quelle: "Schnitt A-A, Geschoßhöhe", art: "HERLEIT" },
  { pos: "37.02", text: "Fensterelement 3-fach Verglasung", menge: "14 Stk.", weg: "Zählung aus Grundriss EG + OG", quelle: "Fenstersymbole im Plan", art: "PLAN" },
  { pos: "10.01", text: "Innenputz zweilagig", menge: "386,00 m²", weg: "Wandflächen innen minus Öffnungen", quelle: "Keine Raumhöhe im OG vermerkt", art: "ANNAHME" },
];

const BADGE: Record<string, string> = {
  PLAN: "bg-[#f6e2d7] text-[#a8461f] border-[#ecc6b3]",
  HERLEIT: "bg-[#e6ebf2] text-[#2c4466] border-[#c9d3e1]",
  ANNAHME: "bg-[#f7ecd2] text-[#8a6412] border-[#e8d3a0]",
};

const FUNKTIONEN = [
  { titel: "Planauswertung", text: "Grundrisse, Schnitte und Ansichten werden gelesen. Auch Scans und Fotos funktionieren." },
  { titel: "Rechenweg zu jeder Menge", text: "Bei jeder Zahl steht, aus welchen Maßen sie berechnet wurde. So lässt sich alles nachprüfen." },
  { titel: "LB-HB 023 Zuordnung", text: "Über 22.650 Positionen in 59 Leistungsgruppen sind hinterlegt und werden automatisch zugeordnet." },
  { titel: "Offene Annahmen", text: "Fehlt im Plan eine Angabe, wird das angezeigt. Sie sehen, welcher Wert angesetzt wurde." },
  { titel: "Eigene Einheitspreise", text: "Hinterlegen Sie Ihre Preise und rechnen Sie direkt eine Kostenschätzung." },
  { titel: "Export", text: "Den Massenauszug gibt es als PDF oder Excel für Angebot und Bestellung." },
];

const ZIELGRUPPEN = [
  { titel: "Baumeister und kleine Betriebe", text: "Mengen für ein Angebot in wenigen Minuten, statt abends von Hand." },
  { titel: "Ausführende Gewerke", text: "Nur die Positionen, die Sie brauchen, sortiert nach Leistungsgruppe." },
  { titel: "Planung und Architektur", text: "Ein erster Kostenrahmen schon in der Einreichphase." },
  { titel: "Bauherren und Prüfung", text: "Angebote mit nachvollziehbaren Mengen vergleichen." },
];

const FAQ = [
  { f: "Welche Pläne kann MengenWerk lesen?", a: "Einreichpläne als PDF, gescannte Pläne und Fotos. Am besten funktionieren vermaßte Grundrisse zusammen mit Schnitten." },
  { f: "Wie genau sind die Mengen?", a: "Jede Menge wird mit Rechenweg und Quelle ausgewiesen. Steht eine Angabe nicht im Plan, ist der angesetzte Wert als Annahme markiert. So wissen Sie, wo Sie nachsehen sollten." },
  { f: "Ersetzt MengenWerk den Kalkulanten?", a: "Nein. MengenWerk übernimmt das Aufmaß. Die fachliche Prüfung und die Bepreisung bleiben bei Ihnen." },
  { f: "Brauche ich ein Abo?", a: "Nein. Sie können einzelne Pläne analysieren. Für Betriebe mit laufendem Bedarf machen wir gern ein Angebot." },
  { f: "Was passiert mit meinen Plänen?", a: "Pläne werden nur für die Analyse verarbeitet. Genaueres steht in der Datenschutzerklärung." },
];

const RAUMMARKEN = [
  { x: "14%", y: "26%", t: "Wohnen", m: "32,40 m²" },
  { x: "56%", y: "22%", t: "Küche", m: "14,85 m²" },
  { x: "18%", y: "64%", t: "Bad", m: "7,20 m²" },
  { x: "60%", y: "62%", t: "Zimmer", m: "12,60 m²" },
];

export default function Home() {
  return (
    <main className="flex-1 bg-[#fbf8f3]">
      <SiteNav />

      {/* Hero */}
      <section className="bg-himmel border-b border-[#e8e0d2]">
        <Container className="grid lg:grid-cols-[1.05fr_1fr] gap-14 items-center pt-16 pb-20 md:pt-24 md:pb-24">
          <div>
            <Eyebrow>Mengenermittlung für Österreich</Eyebrow>
            <h1 className="font-display font-medium tracking-tight leading-[0.98] text-[clamp(2.8rem,6vw,5rem)] text-[#231f1a]">
              Aus dem Einreichplan wird ein <span className="text-[#c2562f]">Massenauszug.</span>
            </h1>
            <p className="mt-7 text-[1.1rem] text-[#6e665b] max-w-[46ch] leading-relaxed">
              MengenWerk liest Ihren Plan, erkennt die Bauteile und ermittelt die Mengen nach LB-HB 023. Zu jeder Position
              sehen Sie, wie sie gerechnet wurde.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <KnopfPrimaer href="/demo">Demo anfragen →</KnopfPrimaer>
              <KnopfSekundaer href="/app">Plan analysieren</KnopfSekundaer>
            </div>
            <p className="mt-8 text-xs text-[#9a9184]">Keine Einrichtung, kein Abo. Für Einreichpläne nach österreichischem Standard.</p>
          </div>

          <div className="relative">
            <div className="relative rounded-2xl border border-[#e8e0d2] bg-[#fffdf9] p-5 shadow-[0_40px_80px_-50px_rgba(120,70,40,0.55)]">
              <div className="flex items-center justify-between text-[11px] text-[#9a9184] mb-4">
                <span className="font-mono">EFH_Einreichplan_EG.pdf</span>
                <span className="rounded-full bg-[#f6e2d7] px-2.5 py-0.5 text-[#a8461f]">wird gelesen</span>
              </div>
              <div className="relative aspect-[4/3] rounded-lg bg-[#fbf8f3] border border-[#efe8dc]">
                <svg viewBox="0 0 400 300" className="absolute inset-0 w-full h-full text-[#231f1a]" fill="none" stroke="currentColor">
                  <rect x="40" y="30" width="320" height="220" strokeWidth="5" />
                  <path d="M200 30v110M40 140h160M240 140v110M240 140h120" strokeWidth="2.5" />
                  <path d="M90 250h50M290 30h40M40 70v40M360 170v40" stroke="#c2562f" strokeWidth="6" />
                  <path d="M40 275h320M40 268v14M360 268v14" stroke="#9a9184" strokeWidth="1" />
                  <text x="200" y="292" fontSize="11" fill="#6e665b" stroke="none" textAnchor="middle">12,10 m</text>
                  <path d="M385 30v220M378 30h14M378 250h14" stroke="#9a9184" strokeWidth="1" />
                </svg>
                {RAUMMARKEN.map((r) => (
                  <span
                    key={r.t}
                    className="absolute rounded-md border border-[#e8e0d2] bg-white/95 px-2 py-1 text-[10px] leading-tight shadow-sm"
                    style={{ left: r.x, top: r.y }}
                  >
                    <span className="block text-[#6e665b]">{r.t}</span>
                    <span className="block font-semibold text-[#231f1a]">{r.m}</span>
                  </span>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-3 divide-x divide-[#efe8dc] text-center">
                {[
                  ["47", "Positionen"],
                  ["12", "Gewerke"],
                  ["3", "Annahmen"],
                ].map(([z, l]) => (
                  <div key={l}>
                    <p className="font-display text-2xl text-[#231f1a]">{z}</p>
                    <p className="text-[11px] text-[#9a9184]">{l}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute -top-8 -left-8 hidden md:block rounded-xl bg-[#231f1a] text-[#fbf8f3] px-5 py-4 shadow-xl">
              <p className="text-[11px] text-[#fbf8f3]/60">Mauerwerk 25 cm</p>
              <p className="font-display text-xl">142,40 m²</p>
              <p className="font-mono text-[10px] text-[#e07a52]">44,5 m × 3,20 m</p>
            </div>
          </div>
        </Container>
      </section>

      {/* Kennzahlen */}
      <section className="bg-[#fbf8f3] border-b border-[#e8e0d2]">
        <Container className="grid grid-cols-2 md:grid-cols-4">
          {[
            { wert: "5 Min.", label: "vom Plan zum Massenauszug" },
            { wert: "22.650", label: "Positionen im LB-HB 023" },
            { wert: "59", label: "Leistungsgruppen" },
            { wert: "100 %", label: "Mengen mit Rechenweg" },
          ].map(({ wert, label }, i) => (
            <div key={label} className={`py-10 px-6 ${i > 0 ? "md:border-l border-[#e8e0d2]" : ""}`}>
              <p className="font-display text-4xl text-[#231f1a]">{wert}</p>
              <p className="text-xs text-[#6e665b] mt-2">{label}</p>
            </div>
          ))}
        </Container>
      </section>

      {/* Problem */}
      <Abschnitt>
        <div className="grid md:grid-cols-[1fr_1.1fr] gap-14 items-start">
          <div>
            <Eyebrow>Warum MengenWerk</Eyebrow>
            <h2 className="font-display font-medium tracking-tight text-[clamp(1.9rem,3.6vw,2.9rem)] leading-[1.08]">
              Das Aufmaß dauert lange. Und eine vergessene Position kostet Geld.
            </h2>
          </div>
          <div className="space-y-5 text-[15px] leading-relaxed text-[#6e665b] md:pt-10">
            <p>
              Mengen von Hand aus Plänen zu messen ist langsam und fehleranfällig. Eine übersehene Wand oder ein falsch
              abgezogenes Fenster fällt oft erst auf der Baustelle auf.
            </p>
            <p className="text-[#231f1a]">
              MengenWerk liest den Einreichplan, ermittelt die Mengen und zeigt bei jeder Position, woher sie kommt.
            </p>
          </div>
        </div>
      </Abschnitt>

      {/* Ablauf */}
      <Abschnitt ton="grau" id="ablauf">
        <AbschnittKopf
          eyebrow="Ablauf"
          titel="In drei Schritten zum Massenauszug."
          text="Sie laden den Plan hoch. Um den Rest kümmert sich MengenWerk."
        />
        <div className="grid md:grid-cols-3 gap-5">
          {SCHRITTE.map((s) => (
            <Karte key={s.nr} nummer={s.nr} titel={s.titel}>
              {s.text}
            </Karte>
          ))}
        </div>
      </Abschnitt>

      <PlanAnalyseSection />

      {/* Belege */}
      <Abschnitt>
        <AbschnittKopf
          eyebrow="Ergebnis"
          titel="Bei jeder Zahl steht, woher sie kommt."
          text="Vier Zeilen aus dem Massenauszug für ein Einfamilienhaus. Jede Position hat ihre Rechnung, ihre Quelle im Plan und eine Kennzeichnung."
        />
        <div className="rounded-xl border border-[#e8e0d2] bg-[#fffdf9] overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-[0.14em] text-[#9a9184] border-b border-[#e8e0d2]">
                <th className="px-5 py-3 font-medium">Pos.</th>
                <th className="px-5 py-3 font-medium">Leistung</th>
                <th className="px-5 py-3 font-medium text-right">Menge</th>
                <th className="px-5 py-3 font-medium">Rechenweg</th>
                <th className="px-5 py-3 font-medium">Quelle</th>
                <th className="px-5 py-3 font-medium">Beleg</th>
              </tr>
            </thead>
            <tbody>
              {BELEGE.map((b) => (
                <tr key={b.pos} className="border-b border-[#f3ede3] last:border-0 align-top">
                  <td className="px-5 py-4 font-mono text-xs text-[#9a9184]">{b.pos}</td>
                  <td className="px-5 py-4 font-medium text-[#231f1a]">{b.text}</td>
                  <td className="px-5 py-4 text-right font-num whitespace-nowrap">{b.menge}</td>
                  <td className="px-5 py-4 text-[#6e665b] font-mono text-xs">{b.weg}</td>
                  <td className="px-5 py-4 text-[#6e665b] text-xs">{b.quelle}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-block rounded-md border px-2 py-0.5 text-[10px] font-medium ${BADGE[b.art]}`}>
                      {b.art}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-8 grid md:grid-cols-3 gap-6 text-sm">
          {[
            ["Plan", "Die Zahl steht so im Plan, als Maßkette, Beschriftung oder Symbol."],
            ["Herleit", "Aus Planmaßen berechnet. Die Formel steht daneben."],
            ["Annahme", "Die Angabe fehlt im Plan. Sie sehen, was fehlt und welcher Wert angesetzt wurde."],
          ].map(([t, x]) => (
            <div key={t} className="border-t border-[#e8e0d2] pt-4">
              <p className="font-display text-lg mb-1">{t}</p>
              <p className="text-[#6e665b]">{x}</p>
            </div>
          ))}
        </div>
      </Abschnitt>

      {/* Funktionen */}
      <Abschnitt ton="grau" id="funktionen">
        <div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-14">
          <AbschnittKopf eyebrow="Funktionen" titel="Was MengenWerk für Sie erledigt." />
          <div className="grid sm:grid-cols-2 gap-x-10">
            {FUNKTIONEN.map((f, i) => (
              <div key={f.titel} className="border-t border-[#d5c9b5] py-6">
                <p className="font-mono text-[11px] text-[#c2562f] mb-2">{String(i + 1).padStart(2, "0")}</p>
                <h3 className="font-display text-[1.2rem] mb-2">{f.titel}</h3>
                <p className="text-sm leading-relaxed text-[#6e665b]">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </Abschnitt>

      {/* Zielgruppen */}
      <Abschnitt>
        <AbschnittKopf eyebrow="Für wen" titel="Für alle, die aus Plänen Zahlen machen." />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {ZIELGRUPPEN.map((z) => (
            <Karte key={z.titel} titel={z.titel}>
              {z.text}
            </Karte>
          ))}
        </div>
        <div className="mt-14 rounded-2xl border border-[#e8e0d2] bg-[#fffdf9] p-8 md:p-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-xl">
            <h2 className="font-display font-medium tracking-tight text-2xl">Sehen Sie sich ein echtes Ergebnis an.</h2>
            <p className="mt-3 text-sm text-[#6e665b] leading-relaxed">
              Ein vollständiger Massenauszug für ein Einfamilienhaus mit allen Positionen, Rechenwegen und markierten
              Annahmen.
            </p>
          </div>
          <KnopfSekundaer href="/vorschau">Beispiel ansehen →</KnopfSekundaer>
        </div>
      </Abschnitt>

      {/* FAQ */}
      <Abschnitt ton="grau">
        <div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-14">
          <AbschnittKopf eyebrow="Fragen" titel="Häufige Fragen" />
          <div className="border-t border-[#d5c9b5]">
            {FAQ.map(({ f, a }) => (
              <details key={f} className="group border-b border-[#d5c9b5] py-5">
                <summary className="flex items-center justify-between gap-6 cursor-pointer list-none font-display text-[1.15rem]">
                  {f}
                  <span className="text-[#c2562f] group-open:rotate-45 transition-transform text-2xl leading-none">+</span>
                </summary>
                <p className="mt-3 text-sm text-[#6e665b] leading-relaxed max-w-2xl">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </Abschnitt>

      <CtaBand />
      <SiteFooter />
    </main>
  );
}
