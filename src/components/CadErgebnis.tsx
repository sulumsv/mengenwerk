import { BAUTEIL_TITEL, type CadAuswertung, type CadPosition } from "@/lib/cad-ebenen";

const zahl = (n: number, d = 2) => n.toLocaleString("de-AT", { minimumFractionDigits: d, maximumFractionDigits: d });

export function CadErgebnis({
  auswertung,
  positionen,
  ausgeschlossen,
  zuruecksetzen,
}: {
  auswertung: CadAuswertung;
  positionen: CadPosition[];
  ausgeschlossen: number;
  zuruecksetzen: () => void;
}) {
  return (
    <section className="mt-8 rounded-2xl border border-[#e8ecef] bg-white overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e8ecef] bg-[#faf6ef] px-6 py-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#1f2a44]">Aus den CAD-Ebenen gelesen</p>
          <p className="mt-1 text-sm text-[#5d6b78]">
            Maßstab 1:{auswertung.massstab} · {auswertung.ebenen.length} Ebenen im Plan, davon{" "}
            {auswertung.erkannteEbenen.length} als Bauteil erkannt
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {auswertung.erkannteEbenen.map((e) => (
            <span key={e.name} className="rounded-full bg-white border border-[#e8ecef] px-3 py-1 text-[12px] text-[#34424f]">
              {e.name} → {BAUTEIL_TITEL[e.art]}
            </span>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[560px]">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-[0.12em] text-[#8b98a4] border-b border-[#eef1f3]">
              <th className="px-6 py-3 font-semibold">Bauteil</th>
              <th className="px-6 py-3 font-semibold text-right">Dicke</th>
              <th className="px-6 py-3 font-semibold text-right">Länge</th>
              <th className="px-6 py-3 font-semibold text-right">Grundrissfläche</th>
              <th className="px-6 py-3 font-semibold text-right">Teile</th>
            </tr>
          </thead>
          <tbody>
            {positionen.map((p) => (
              <tr key={`${p.art}-${p.dicke_m}`} className="border-b border-[#f3f5f7] last:border-0">
                <td className="px-6 py-3 font-medium">
                  {BAUTEIL_TITEL[p.art]} d={zahl(p.dicke_m)}
                </td>
                <td className="px-6 py-3 text-right font-num">{zahl(p.dicke_m)} m</td>
                <td className="px-6 py-3 text-right font-num">{zahl(p.laenge_m, 1)} m</td>
                <td className="px-6 py-3 text-right font-num">{zahl(p.flaeche_m2, 1)} m²</td>
                <td className="px-6 py-3 text-right text-[#8b98a4]">{p.teile}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {ausgeschlossen > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eef1f3] bg-[#faf6ef] px-6 py-3 text-[13px]">
          <span>
            {ausgeschlossen} {ausgeschlossen === 1 ? "Bauteil" : "Bauteile"} in der Kontrollansicht ausgeschlossen
          </span>
          <button type="button" onClick={zuruecksetzen} className="font-semibold text-[#1f2a44] underline underline-offset-4">
            Alle wieder zählen
          </button>
        </div>
      )}

      <p className="border-t border-[#eef1f3] px-6 py-4 text-[13px] leading-relaxed text-[#5d6b78]">
        Längen und Dicken stammen aus den gefüllten Flächen der Wand- und Unterzugebenen. Für die Kubatur fehlen die
        Höhen: sie stehen in den Schnitten. Wandstücke an Öffnungen und Anschlüssen können die Längen um einige Prozent
        verschieben.
      </p>
    </section>
  );
}
