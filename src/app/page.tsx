import { SiteFooter } from "@/components/SiteNav";
import { PlanAnalyseSection } from "@/components/PlanAnalyse";
import { ProduktVorschau } from "@/components/ProduktVorschau";
import { StartBuehne } from "@/components/StartBuehne";
import {
  Abschnitt,
  AbschnittKopf,
  Container,
  CtaBand,
  Eyebrow,
  Karte,
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
  PLAN: "bg-[#efe4d3] text-[#141c30] border-[#e3d2b8]",
  HERLEIT: "bg-[#e6ebf2] text-[#2c4466] border-[#c9d3e1]",
  ANNAHME: "bg-[#f7ecd2] text-[#8a6412] border-[#e8d3a0]",
};

const UMFANG = [
  { titel: "Erdarbeiten", positionen: ["Baugrubenaushub"] },
  {
    titel: "Bodenaufbau & Beläge",
    positionen: ["Beläge je Material mit Verschnitt", "Heizestrich", "Estrich-Liefermasse", "Trittschalldämmung", "PE-Trennlage", "Randdämmstreifen", "Fußbodenheizung"],
  },
  { titel: "Beton & Mauerwerk", positionen: ["Bodenplatte", "Geschoßdecken", "Stützen", "Bewehrung", "Außenwand Mauerwerk"] },
  { titel: "Fassade & Gerüst", positionen: ["Fassadenfläche", "Wärmedämmverbundsystem", "Außenputz", "Fassadengerüst"] },
  {
    titel: "Dach",
    positionen: ["Dachfläche", "Dachkonstruktion", "Zwischensparrendämmung", "Lattung", "Unterspannbahn", "Dachdeckung", "Dachrinne", "Photovoltaik"],
  },
  {
    titel: "Putz, Malerei & Fliesen",
    positionen: ["Innenputz", "Deckenputz", "Malerei", "Fliesenspiegel Nassräume", "Sockelleisten"],
  },
  {
    titel: "Fenster & Türen",
    positionen: ["Fenster", "Türen", "Tore", "Fensterbänke innen und außen", "Laibungen", "Anschlussfugen", "Türzargen"],
  },
];

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


export default function Home() {
  return (
    <main className="flex-1 bg-[#ffffff]">
      <StartBuehne />

      {/* Kennzahlen */}
      <section className="bg-[#ffffff] border-b border-[#dde6ea]">
        <Container className="grid grid-cols-2 md:grid-cols-4">
          {[
            { wert: "5 Min.", label: "vom Plan zum Massenauszug" },
            { wert: "22.650", label: "Positionen im LB-HB 023" },
            { wert: "59", label: "Leistungsgruppen" },
            { wert: "100 %", label: "Mengen mit Rechenweg" },
          ].map(({ wert, label }, i) => (
            <div key={label} className={`py-10 px-6 ${i > 0 ? "md:border-l border-[#dde6ea]" : ""}`}>
              <p className="font-display text-4xl text-[#2b2d33]">{wert}</p>
              <p className="text-xs text-[#5d6b78] mt-2">{label}</p>
            </div>
          ))}
        </Container>
      </section>

      <ProduktVorschau />

      {/* Problem */}
      <Abschnitt>
        <div className="grid md:grid-cols-[1fr_1.1fr] gap-14 items-start">
          <div>
            <Eyebrow>Warum MengenWerk</Eyebrow>
            <h2 className="font-display font-semibold tracking-tight text-[clamp(1.9rem,3.6vw,2.9rem)] leading-[1.08]">
              Das Aufmaß dauert lange. Und eine vergessene Position kostet Geld.
            </h2>
          </div>
          <div className="space-y-5 text-[15px] leading-relaxed text-[#5d6b78] md:pt-10">
            <p>
              Mengen von Hand aus Plänen zu messen ist langsam und fehleranfällig. Eine übersehene Wand oder ein falsch
              abgezogenes Fenster fällt oft erst auf der Baustelle auf.
            </p>
            <p className="text-[#2b2d33]">
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

      {/* Umfang */}
      <Abschnitt id="umfang">
        <AbschnittKopf
          eyebrow="Was berechnet wird"
          titel="Sieben Gewerke, vom Aushub bis zur Fensterbank."
          text="Aus Raumstempeln, Maßketten, Schnitten und Nachweisen leitet MengenWerk diese Positionen ab. Jede mit Rechenweg und, wo der Plan etwas offen lässt, mit markierter Annahme."
        />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {UMFANG.map((u, i) => (
            <div key={u.titel} className="rounded-2xl border border-[#e8ecef] bg-white p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#efe4d3] text-xs font-semibold text-[#141c30]">
                  {i + 1}
                </span>
                <h3 className="font-semibold text-[16px]">{u.titel}</h3>
              </div>
              <ul className="flex flex-wrap gap-1.5">
                {u.positionen.map((p) => (
                  <li key={p} className="rounded-full bg-[#f4f6f8] px-3 py-1 text-[12px] text-[#34424f]">
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="rounded-2xl bg-[#2b2d33] p-6 text-white flex flex-col justify-between">
            <p className="text-[15px] leading-relaxed text-white/80">
              Mit Ihren eigenen Einheitspreisen wird aus dem Massenauszug direkt eine Kostenschätzung.
            </p>
            <a href="/einheitspreise" className="mt-6 text-sm font-semibold text-[#f2b233] hover:underline">
              Einheitspreise hinterlegen →
            </a>
          </div>
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
        <div className="rounded-xl border border-[#dde6ea] bg-[#ffffff] overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-[0.14em] text-[#8b98a4] border-b border-[#dde6ea]">
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
                <tr key={b.pos} className="border-b border-[#f5f8fa] last:border-0 align-top">
                  <td className="px-5 py-4 font-mono text-xs text-[#8b98a4]">{b.pos}</td>
                  <td className="px-5 py-4 font-medium text-[#2b2d33]">{b.text}</td>
                  <td className="px-5 py-4 text-right font-num whitespace-nowrap">{b.menge}</td>
                  <td className="px-5 py-4 text-[#5d6b78] font-mono text-xs">{b.weg}</td>
                  <td className="px-5 py-4 text-[#5d6b78] text-xs">{b.quelle}</td>
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
            <div key={t} className="border-t border-[#dde6ea] pt-4">
              <p className="font-display text-lg mb-1">{t}</p>
              <p className="text-[#5d6b78]">{x}</p>
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
              <div key={f.titel} className="border-t border-[#c8d4da] py-6">
                <p className="font-mono text-[11px] text-[#1f2a44] mb-2">{String(i + 1).padStart(2, "0")}</p>
                <h3 className="font-display text-[1.2rem] mb-2">{f.titel}</h3>
                <p className="text-sm leading-relaxed text-[#5d6b78]">{f.text}</p>
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
        <div className="mt-14 rounded-2xl border border-[#dde6ea] bg-[#ffffff] p-8 md:p-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-xl">
            <h2 className="font-display font-semibold tracking-tight text-2xl">Sehen Sie sich ein echtes Ergebnis an.</h2>
            <p className="mt-3 text-sm text-[#5d6b78] leading-relaxed">
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
          <div className="border-t border-[#c8d4da]">
            {FAQ.map(({ f, a }) => (
              <details key={f} className="group border-b border-[#c8d4da] py-5">
                <summary className="flex items-center justify-between gap-6 cursor-pointer list-none font-display text-[1.15rem]">
                  {f}
                  <span className="text-[#1f2a44] group-open:rotate-45 transition-transform text-2xl leading-none">+</span>
                </summary>
                <p className="mt-3 text-sm text-[#5d6b78] leading-relaxed max-w-2xl">{a}</p>
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
