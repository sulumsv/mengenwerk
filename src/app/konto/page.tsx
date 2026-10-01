"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SiteNav, SiteFooter } from "@/components/SiteNav";
import { SeitenHero } from "@/components/Marketing";
import type { ArchivEintrag } from "@/lib/plan-archiv";

function datum(iso: string): string {
  return new Date(iso).toLocaleString("de-AT", { dateStyle: "medium", timeStyle: "short" });
}

export default function KontoSeite() {
  const [plaene, setPlaene] = useState<ArchivEintrag[] | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/plaene")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d: { plaene: ArchivEintrag[] }) => setPlaene(d.plaene))
      .catch(() => setFehler("Die Pläne konnten nicht geladen werden."));
  }, []);

  async function entfernen(e: ArchivEintrag) {
    if (!window.confirm(`„${e.name}“ aus dem Konto löschen? Beim nächsten Hochladen wird er neu ausgewertet.`)) return;
    await fetch(`/api/plaene/${e.hash}`, { method: "DELETE" });
    setPlaene((p) => (p ?? []).filter((x) => x.hash !== e.hash));
  }

  async function abmelden() {
    await fetch("/api/konto", { method: "DELETE" });
    window.location.href = "/";
  }

  const gesamt = (plaene ?? []).reduce((s, p) => s + (p.kostenUsd ?? 0), 0);

  return (
    <main className="flex-1">
      <SiteNav />
      <SeitenHero
        eyebrow="Konto"
        titel="Meine Pläne"
        text="Alle ausgewerteten Pläne mit ihrem Ergebnis. Wird ein Plan erneut hochgeladen, kommt das Ergebnis von hier, ohne neue Kosten."
      />

      <section className="px-6 md:px-10 py-12 max-w-5xl mx-auto">
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-muted">
            {plaene ? `${plaene.length} Pläne · KI-Kosten gesamt ${gesamt.toFixed(2)} USD` : "Wird geladen"}
          </span>
          <div className="ml-auto flex gap-3">
            <Link href="/einheitspreise" className="text-sm font-semibold px-4 py-2 rounded-lg border border-line-strong hover:bg-surface-2">
              Einheitspreise
            </Link>
            <Link href="/app" className="text-sm font-semibold px-4 py-2 rounded-lg bg-accent text-accent-fg">
              Neuen Plan auswerten
            </Link>
            <button type="button" onClick={abmelden} className="text-sm text-fg-muted underline hover:text-fg">
              Abmelden
            </button>
          </div>
        </div>

        {fehler && <p className="rounded-xl border border-alert bg-alert/10 p-4 text-sm">{fehler}</p>}

        {plaene && plaene.length === 0 && (
          <p className="rounded-xl border border-line bg-surface-2 p-6 text-sm text-fg-muted">
            Noch keine Pläne ausgewertet. Nach der ersten Auswertung erscheint der Plan hier.
          </p>
        )}

        {plaene && plaene.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-line bg-surface-2">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-muted">
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Ausgewertet</th>
                  <th className="px-4 py-3 text-right">Blätter</th>
                  <th className="px-4 py-3 text-right">Kosten</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {plaene.map((p) => (
                  <tr key={p.hash} className="border-t border-line">
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3 text-fg-muted">{datum(p.datum)}</td>
                    <td className="px-4 py-3 text-right font-num">{p.seiten}</td>
                    <td className="px-4 py-3 text-right font-num text-fg-muted">
                      {p.quelle === "text" ? "kostenlos" : p.kostenUsd === null ? "-" : `${p.kostenUsd.toFixed(2)} USD`}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <Link href={`/app?plan=${p.hash}`} className="font-semibold underline">
                        Öffnen
                      </Link>
                      <button type="button" onClick={() => entfernen(p)} className="ml-4 text-fg-muted hover:text-alert">
                        Löschen
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <SiteFooter />
    </main>
  );
}
