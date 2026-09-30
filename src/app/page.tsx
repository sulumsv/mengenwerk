import { SiteNav, SiteFooter } from "@/components/SiteNav";
import { Abschnitt, AbschnittKopf, Container, CtaBand, Karte, KnopfPrimaer, KnopfSekundaer } from "@/components/Marketing";

const SCHRITTE = [
  { nr: "1", titel: "Plan hochladen", text: "Einreichplan als PDF, Scan oder Foto hochladen. Grundrisse, Schnitte und Ansichten reichen aus." },
  { nr: "2", titel: "Mengen prüfen", text: "MengenWerk erkennt Räume, Wände, Fenster und Türen und zeigt zu jeder Menge den Rechenweg." },
  { nr: "3", titel: "Ergebnis übernehmen", text: "Den Massenauszug nach LB-HB 023 als PDF oder Excel exportieren oder mit eigenen Preisen bewerten." },
];

const VORSCHAU = [
  { pos: "07.01", text: "Bodenplatte C25/30, d = 25 cm", menge: "34,20", eh: "m³", art: "Plan" },
  { pos: "08.03", text: "Mauerwerk Hochlochziegel 25 cm", menge: "142,40", eh: "m²", art: "Herleit" },
  { pos: "11.02", text: "Heizestrich CT-C25-F4", menge: "15,68", eh: "m³", art: "Herleit" },
  { pos: "24.01", text: "Bodenfliesen Nassräume", menge: "43,98", eh: "m²", art: "Plan" },
  { pos: "37.02", text: "Fenster 3-fach verglast", menge: "14", eh: "Stk", art: "Plan" },
  { pos: "10.01", text: "Innenputz zweilagig", menge: "386,00", eh: "m²", art: "Annahme" },
];

const ART_STIL: Record<string, string> = {
  Plan: "bg-[#eef1f6] text-[#1f2a44]",
  Herleit: "bg-[#eef6f1] text-[#22603f]",
  Annahme: "bg-[#fdf3dc] text-[#8a6412]",
};

const UMFANG = [
  { titel: "Erdarbeiten", text: "Baugrubenaushub" },
  { titel: "Bodenaufbau & Beläge", text: "Beläge mit Verschnitt, Heizestrich, Trittschall, Randdämmstreifen, Fußbodenheizung" },
  { titel: "Beton & Mauerwerk", text: "Bodenplatte, Decken, Stützen, Bewehrung, Außenwände" },
  { titel: "Fassade & Gerüst", text: "Fassadenfläche, Wärmedämmverbundsystem, Außenputz, Gerüst" },
  { titel: "Dach", text: "Dachfläche, Konstruktion, Dämmung, Lattung, Deckung, Rinne, Photovoltaik" },
  { titel: "Putz, Malerei & Fliesen", text: "Innenputz, Deckenputz, Malerei, Fliesenspiegel, Sockelleisten" },
  { titel: "Fenster & Türen", text: "Fenster, Türen, Tore, Fensterbänke, Laibungen, Anschlussfugen" },
  { titel: "CAD-Pläne", text: "Wände und Unterzüge nach Dicke direkt aus den Ebenen von Vektor-PDFs" },
];

const HERKUNFT = [
  { titel: "Plan", text: "Die Zahl steht so im Plan, als Maßkette, Raumstempel oder Symbol." },
  { titel: "Herleit", text: "Aus Planmaßen berechnet. Die Formel steht direkt daneben." },
  { titel: "Annahme", text: "Die Angabe fehlt im Plan. Sie sehen, was fehlt und welcher Wert angesetzt wurde." },
];

const FAQ = [
  { f: "Welche Pläne kann MengenWerk lesen?", a: "Einreichpläne als PDF, gescannte Pläne und Fotos. Am besten funktionieren vermaßte Grundrisse zusammen mit Schnitten. Vektor-PDFs mit CAD-Ebenen werden besonders genau ausgewertet." },
  { f: "Wie genau sind die Mengen?", a: "Jede Menge wird mit Rechenweg und Quelle ausgewiesen. Steht eine Angabe nicht im Plan, ist der angesetzte Wert als Annahme markiert. So wissen Sie, wo Sie nachsehen sollten." },
  { f: "Ersetzt MengenWerk den Kalkulanten?", a: "Nein. MengenWerk übernimmt das Aufmaß. Die fachliche Prüfung und die Bepreisung bleiben bei Ihnen." },
  { f: "Brauche ich ein Abo?", a: "Nein. Sie können einzelne Pläne analysieren. Für Betriebe mit laufendem Bedarf machen wir gern ein Angebot." },
  { f: "Was passiert mit meinen Plänen?", a: "Pläne werden nur für die Analyse verarbeitet. Genaueres steht in der Datenschutzerklärung." },
];

function Haken() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5 shrink-0 text-[#1f2a44]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 10.5 3.2 3L15 7" />
    </svg>
  );
}

export default function Home() {
  return (
    <main className="flex-1 bg-white">
      <SiteNav />

      {/* Einstieg */}
      <section className="border-b border-[#eef0f3] bg-white">
        <Container className="py-16 md:py-20">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#eef1f6] px-3 py-1 text-sm font-medium text-[#1f2a44]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#f2b233]" />
            Mengenermittlung nach LB-HB 023
          </p>
          <h1 className="text-[clamp(2.25rem,5vw,3.5rem)] font-semibold leading-[1.08] tracking-tight text-[#111827]">
            Vom Einreichplan zum Massenauszug
            <br className="hidden sm:block" /> in wenigen Minuten.
          </h1>
          <div className="mt-10 grid items-start gap-12 lg:grid-cols-[1fr_1.05fr]">
            <div>
              <p className="max-w-xl text-[18px] leading-relaxed text-[#5b6472]">
                Laden Sie Ihren Plan hoch. MengenWerk ermittelt die Mengen für Ihr Angebot und zeigt zu jeder Position,
                wie sie gerechnet wurde.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <KnopfPrimaer href="/demo">Demo anfragen</KnopfPrimaer>
                <KnopfSekundaer href="/vorschau">Beispiel ansehen</KnopfSekundaer>
              </div>
              <ul className="mt-8 grid gap-2.5 text-[15px] text-[#374151] sm:grid-cols-2">
                {["Rechenweg zu jeder Menge", "Annahmen klar markiert", "Export als PDF und Excel", "Kein Abo nötig"].map((t) => (
                  <li key={t} className="flex items-center gap-2">
                    <Haken />
                    {t}
                  </li>
                ))}
              </ul>
            </div>

          <div className="rounded-2xl border border-[#e6e8ec] bg-white shadow-[0_24px_48px_-32px_rgba(17,24,39,0.35)]">
            <div className="flex items-center justify-between border-b border-[#eef0f3] px-5 py-3.5">
              <div>
                <p className="text-[15px] font-semibold text-[#111827]">Massenauszug</p>
                <p className="text-[13px] text-[#8a93a0]">Einfamilienhaus, Beispielprojekt</p>
              </div>
              <span className="rounded-md bg-[#eef6f1] px-2 py-1 text-[12px] font-medium text-[#22603f]">47 Positionen</span>
            </div>
            <table className="w-full text-[14px]">
              <tbody>
                {VORSCHAU.map((z) => (
                  <tr key={z.pos} className="border-b border-[#f3f4f6] last:border-0">
                    <td className="hidden py-3 pl-5 pr-2 font-num text-[12px] text-[#8a93a0] sm:table-cell">{z.pos}</td>
                    <td className="py-3 pl-5 pr-2 text-[#111827] sm:pl-0">{z.text}</td>
                    <td className="whitespace-nowrap py-3 pr-2 text-right font-num font-medium text-[#111827]">
                      {z.menge} <span className="text-[#8a93a0]">{z.eh}</span>
                    </td>
                    <td className="py-3 pr-5 text-right">
                      <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${ART_STIL[z.art]}`}>{z.art}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>
        </Container>
      </section>

      {/* Ablauf */}
      <Abschnitt ton="grau" id="ablauf">
        <AbschnittKopf eyebrow="So funktioniert’s" titel="Drei Schritte, kein Einarbeiten." mittig />
        <div className="grid gap-5 md:grid-cols-3">
          {SCHRITTE.map((s) => (
            <Karte key={s.nr} nummer={s.nr} titel={s.titel}>
              {s.text}
            </Karte>
          ))}
        </div>
      </Abschnitt>

      {/* Umfang */}
      <Abschnitt id="umfang">
        <AbschnittKopf
          eyebrow="Was berechnet wird"
          titel="Die Mengen für alle wichtigen Gewerke."
          text="Aus Raumstempeln, Maßketten, Schnitten und Nachweisen leitet MengenWerk die Positionen ab und ordnet sie dem LB-HB 023 zu."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {UMFANG.map((u) => (
            <div key={u.titel} className="rounded-xl border border-[#e6e8ec] bg-white p-5">
              <h3 className="text-[16px] font-semibold text-[#111827]">{u.titel}</h3>
              <p className="mt-1.5 text-[14px] leading-relaxed text-[#5b6472]">{u.text}</p>
            </div>
          ))}
        </div>
      </Abschnitt>

      {/* Nachvollziehbar */}
      <Abschnitt ton="grau">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <AbschnittKopf
            eyebrow="Nachvollziehbar"
            titel="Bei jeder Zahl steht, woher sie kommt."
            text="Jede Position ist gekennzeichnet. So sehen Sie auf einen Blick, was direkt aus dem Plan stammt und wo Sie nachprüfen sollten."
          />
          <div className="grid gap-3">
            {HERKUNFT.map((h) => (
              <div key={h.titel} className="flex gap-4 rounded-xl border border-[#e6e8ec] bg-white p-5">
                <span className={`h-fit rounded-md px-2 py-0.5 text-[12px] font-medium ${ART_STIL[h.titel]}`}>{h.titel}</span>
                <p className="text-[15px] leading-relaxed text-[#374151]">{h.text}</p>
              </div>
            ))}
          </div>
        </div>
      </Abschnitt>

      {/* FAQ */}
      <Abschnitt>
        <AbschnittKopf eyebrow="Fragen" titel="Häufige Fragen" mittig />
        <div className="mx-auto max-w-3xl divide-y divide-[#eef0f3] rounded-xl border border-[#e6e8ec] bg-white">
          {FAQ.map(({ f, a }) => (
            <details key={f} className="group px-6 py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-[16px] font-semibold text-[#111827]">
                {f}
                <span className="text-xl leading-none text-[#8a93a0] transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-[15px] leading-relaxed text-[#5b6472]">{a}</p>
            </details>
          ))}
        </div>
      </Abschnitt>

      <CtaBand />
      <SiteFooter />
    </main>
  );
}
