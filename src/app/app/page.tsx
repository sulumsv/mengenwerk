"use client";

import { useRef, useState } from "react";
import type { AnalysisResult, GroupedItem } from "@/lib/types";
import { SiteNav, SiteFooter } from "@/components/SiteNav";

type ApiResponse = { analyse: AnalysisResult; gruppen: GroupedItem[] } | { fehler: string };

export default function ToolPage() {
  const [datei, setDatei] = useState<File | null>(null);
  const [ziehtUeber, setZiehtUeber] = useState(false);
  const [laedt, setLaedt] = useState(false);
  const [ergebnis, setErgebnis] = useState<ApiResponse | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function analysieren(f: File) {
    setLaedt(true);
    setErgebnis(null);
    const fd = new FormData();
    fd.append("plan", f);
    try {
      const res = await fetch("/api/analyze", { method: "POST", body: fd });
      const json: ApiResponse = await res.json();
      setErgebnis(json);
    } catch {
      setErgebnis({ fehler: "Die Anfrage ist fehlgeschlagen. Bitte erneut versuchen." });
    } finally {
      setLaedt(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setZiehtUeber(false);
    const f = e.dataTransfer.files?.[0];
    if (f) {
      setDatei(f);
      analysieren(f);
    }
  }

  return (
    <main className="flex-1">
      <SiteNav />

      <section className="px-6 md:px-10 py-16 max-w-7xl mx-auto">
        <h1 className="font-display font-black uppercase text-3xl mb-8">Plan analysieren</h1>

        <div className="rounded-lg border border-line bg-surface-2 overflow-hidden">
          <div className="border-b border-line px-6 py-4 flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-wide text-fg-muted">Planupload</span>
            <span className="font-mono text-xs uppercase tracking-wide text-fg-muted">PDF · PNG · JPG</span>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setZiehtUeber(true);
            }}
            onDragLeave={() => setZiehtUeber(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`m-6 rounded-md border-2 border-dashed p-14 text-center cursor-pointer transition-colors ${
              ziehtUeber ? "border-line-strong bg-accent/15" : "border-line hover:border-fg-muted"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.tif,.tiff"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                setDatei(f);
                if (f) analysieren(f);
              }}
            />
            <p className="font-display font-bold uppercase tracking-wide">
              {laedt ? "Plan wird analysiert" : datei ? datei.name : "Plan hier ablegen oder klicken"}
            </p>
            <p className="mt-2 font-mono text-xs text-fg-muted">
              {laedt ? "Vision Erkennung läuft, das kann bei mehrseitigen Plänen etwas dauern" : "Vektor PDF, Scan oder Bild werden automatisch unterschieden"}
            </p>
          </div>
        </div>

        {ergebnis && "fehler" in ergebnis && (
          <div className="mt-6 rounded-md border border-alert/40 bg-alert/10 p-5 text-sm text-alert">{ergebnis.fehler}</div>
        )}

        {ergebnis && "gruppen" in ergebnis && (
          <div className="mt-10">
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="font-display font-black uppercase text-2xl">Mengenermittlung</h2>
              <span className="font-mono text-xs text-fg-muted uppercase">
                {ergebnis.analyse.dateityp} · {ergebnis.analyse.seiten} Seite(n)
              </span>
            </div>

            <div className="overflow-x-auto rounded-lg border border-line">
              <table className="w-full text-sm">
                <thead className="bg-surface text-left">
                  <tr className="font-mono text-xs uppercase tracking-wide text-fg-muted">
                    <th className="px-4 py-3 font-medium">Typ</th>
                    <th className="px-4 py-3 font-medium">Dimension</th>
                    <th className="px-4 py-3 font-medium">Anzahl</th>
                    <th className="px-4 py-3 font-medium">Gesamtfläche</th>
                    <th className="px-4 py-3 font-medium">Rechenweg</th>
                    <th className="px-4 py-3 font-medium">LB HB Gruppe</th>
                  </tr>
                </thead>
                <tbody>
                  {ergebnis.gruppen.map((g, i) => (
                    <tr key={i} className="border-t border-line">
                      <td className="px-4 py-3 capitalize">{g.label}</td>
                      <td className="px-4 py-3 font-mono font-num">{g.breite_m.toFixed(2)} × {g.hoehe_m.toFixed(2)} m</td>
                      <td className="px-4 py-3 font-mono font-num font-semibold">{g.anzahl}×</td>
                      <td className="px-4 py-3 font-mono font-num">{g.gesamt_flaeche_m2.toFixed(2)} m²</td>
                      <td className="px-4 py-3 text-fg-muted font-mono text-xs">{g.rechenweg}</td>
                      <td className="px-4 py-3 text-fg-muted text-xs">{g.lgKandidaten.join(", ") || "keine Zuordnung"}</td>
                    </tr>
                  ))}
                  {ergebnis.gruppen.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-fg-muted">
                        Auf diesem Plan wurden keine eindeutigen Elemente gefunden.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {ergebnis.analyse.hinweise.length > 0 && (
              <div className="mt-6 rounded-md border border-line-strong/20 bg-accent/15 p-5">
                <p className="font-mono text-xs uppercase tracking-wide text-fg mb-2">Zur Kontrolle</p>
                <ul className="space-y-1 text-sm text-fg/80">
                  {ergebnis.analyse.hinweise.map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>

      <SiteFooter />
    </main>
  );
}
