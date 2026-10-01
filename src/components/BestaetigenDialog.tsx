"use client";

/**
 * Eigenes Bestätigungsfenster statt des nativen window.confirm() des
 * Browsers: wirkt wie Teil der App, lässt sich stylen und blockiert nicht
 * den ganzen Tab-Prozess.
 */
export function BestaetigenDialog({
  titel,
  text,
  bestaetigenText = "Löschen",
  gefahr = true,
  onBestaetigen,
  onAbbrechen,
}: {
  titel: string;
  text: string;
  bestaetigenText?: string;
  gefahr?: boolean;
  onBestaetigen: () => void;
  onAbbrechen: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="alertdialog" aria-modal="true" aria-label={titel}>
      <button type="button" aria-label="Abbrechen" onClick={onAbbrechen} className="absolute inset-0 bg-[#0d1424]/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <p className="text-[17px] font-semibold text-[#111827]">{titel}</p>
        <p className="mt-2 text-sm text-[#5b6472]">{text}</p>
        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onAbbrechen}
            className="h-10 rounded-lg border border-[#d4d8df] px-4 text-sm font-semibold text-[#111827] hover:bg-[#f8f9fb]"
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={onBestaetigen}
            className={`h-10 rounded-lg px-4 text-sm font-semibold text-white ${gefahr ? "bg-[#c0301d] hover:brightness-110" : "bg-[#1f2a44] hover:brightness-110"}`}
          >
            {bestaetigenText}
          </button>
        </div>
      </div>
    </div>
  );
}
