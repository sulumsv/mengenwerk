"use client";

/**
 * Zeigt die Originaldatei eines gespeicherten Plans in einem Popup, mit dem
 * eingebauten PDF-Betrachter des Browsers (Zoom, Seiten, Suche kommen von
 * dort). Für Bilder ein einfaches <img>.
 */
export function PlanAnsichtDialog({ titel, url, bild, onSchliessen }: { titel: string; url: string; bild: boolean; onSchliessen: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true" aria-label={titel}>
      <button type="button" aria-label="Schließen" onClick={onSchliessen} className="absolute inset-0 bg-[#0d1424]/70 backdrop-blur-sm" />
      <div className="relative flex h-full w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-[#eef0f3] px-5 py-3">
          <p className="truncate font-semibold text-[#111827]">{titel}</p>
          <div className="flex items-center gap-3 shrink-0">
            <a href={url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-[#1f2a44] underline underline-offset-2">
              In neuem Tab öffnen
            </a>
            <button type="button" onClick={onSchliessen} aria-label="Schließen" className="flex h-8 w-8 items-center justify-center rounded-lg text-[#5b6472] hover:bg-[#f8f9fb]">
              ✕
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto bg-[#f0f1f4]">
          {bild ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt={titel} className="mx-auto max-w-full" />
          ) : (
            <iframe src={url} title={titel} className="h-full w-full border-0" />
          )}
        </div>
      </div>
    </div>
  );
}
