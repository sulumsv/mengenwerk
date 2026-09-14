import type { Massenauszug, Position, Raum } from "./types";
import { sortiereGeschosse } from "./ableitung";

/**
 * Erzeugt den Massenauszug als eigenständige HTML-Datei.
 *
 * Die Datei trägt ihr Stylesheet in sich und lädt nichts nach, damit sie sich
 * weiterreichen, ablegen und ohne Netz öffnen lässt — und damit sie in zehn
 * Jahren noch so aussieht wie heute.
 */

const EINHEIT_TEXT: Record<string, string> = {
  m2: "m²",
  m3: "m³",
  t: "t",
  lfm: "lfm",
  Stk: "Stk",
  EUR: "EUR",
};

const KONFIDENZ_TEXT = {
  plan: "Aus Plan",
  berechnet: "Berechnet",
  annahme: "Annahme",
} as const;

function zahl(n: number, dez = 2): string {
  return n.toLocaleString("de-AT", { minimumFractionDigits: dez, maximumFractionDigits: dez });
}

/** Planinhalte sind fremder Text und dürfen das Dokument nicht aufbrechen. */
function esc(wert: unknown): string {
  return String(wert ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function punkt(konfidenz: keyof typeof KONFIDENZ_TEXT): string {
  return `<span class="punkt ${konfidenz}" title="${KONFIDENZ_TEXT[konfidenz]}"></span>`;
}

function raumbuch(raeume: Raum[]): string {
  if (raeume.length === 0) return "";

  const zeilen = sortiereGeschosse([...new Set(raeume.map((r) => r.geschoss))])
    .map((g) => {
      const kopf = `<tr class="gruppe"><td colspan="6">${esc(g)}</td></tr>`;
      const raum = raeume
        .filter((r) => r.geschoss === g)
        .map(
          (r) => `<tr>
  <td>${punkt(r.konfidenz)}</td>
  <td>${esc(r.name)}</td>
  <td class="matt">${esc(r.belag ?? "—")}</td>
  <td class="num">${zahl(r.flaeche_m2)} m²</td>
  <td class="num">${zahl(r.umfang_m)} m${r.umfangQuelle === "geschaetzt" ? '<span class="stern">*</span>' : ""}</td>
  <td class="matt">${r.beheizt ? "ja" : "nein"}</td>
</tr>`,
        )
        .join("\n");
      return kopf + "\n" + raum;
    })
    .join("\n");

  const beheizt = raeume.filter((r) => r.beheizt).reduce((s, r) => s + r.flaeche_m2, 0);

  return `<section>
<h2>1 — Raumbuch</h2>
<table>
<thead><tr><th></th><th>Raum</th><th>Belag</th><th class="num">Fläche</th><th class="num">Umfang</th><th>Beheizt</th></tr></thead>
<tbody>
${zeilen}
<tr class="summe"><td></td><td>Beheizte Nutzfläche</td><td></td><td class="num">${zahl(beheizt)} m²</td><td></td><td></td></tr>
</tbody>
</table>
</section>`;
}

function positionszeile(p: Position): string {
  const menge = p.menge === null ? "—" : zahl(p.menge);
  const ep = p.einheitspreis === undefined ? "—" : zahl(p.einheitspreis) + (p.preisQuelle === "richtwert" ? '<span class="stern">*</span>' : "");
  const betrag = p.betrag === undefined ? (p.zwischenwert ? "—" : "offen") : zahl(p.betrag);

  return `<tr>
  <td>${punkt(p.konfidenz)}</td>
  <td class="mono matt">${esc(p.nummer)}</td>
  <td><b>${esc(p.bezeichnung)}</b>${p.detail ? `<span class="detail">${esc(p.detail)}</span>` : ""}</td>
  <td class="mono matt klein">${esc(p.rechenweg)}</td>
  <td class="num">${menge}</td>
  <td class="mono matt klein">${EINHEIT_TEXT[p.einheit] ?? esc(p.einheit)}</td>
  <td class="num klein">${ep}</td>
  <td class="num">${betrag}</td>
  <td class="matt klein">${esc(p.lgKandidaten.join(", ") || "—")}</td>
</tr>`;
}

export function massenauszugAlsHtml(auszug: Massenauszug, titel: string, erstellt: Date): string {
  const abschnitte = auszug.abschnitte
    .map((a) => {
      const summe =
        a.summe !== undefined && a.summe > 0
          ? `<tr class="summe"><td colspan="7">Summe ${esc(a.titel)}</td><td class="num">${zahl(a.summe)}</td><td class="mono matt">EUR</td></tr>`
          : "";
      const tabelle =
        a.positionen.length > 0
          ? `<table>
<thead><tr><th></th><th>Pos.</th><th>Bezeichnung</th><th>Rechenweg</th><th class="num">Menge</th><th>Einh.</th><th class="num">EP</th><th class="num">Betrag</th><th>LB HB</th></tr></thead>
<tbody>
${a.positionen.map(positionszeile).join("\n")}
${summe}
</tbody>
</table>`
          : "";
      return `<section>
<h2>${a.nummer} — ${esc(a.titel)} <span class="lg">${esc(a.lgHinweis)}</span></h2>
${a.vorspann ? `<p class="vorspann">${esc(a.vorspann)}</p>` : ""}
${tabelle}
</section>`;
    })
    .join("\n");

  const kosten = auszug.kosten;
  const anteil = kosten && kosten.summe > 0 ? (kosten.summeAusRichtwerten / kosten.summe) * 100 : 0;
  const kostenBlock = kosten && kosten.summe > 0
    ? `<section class="kosten">
<div class="kosten-kopf"><span>Kostenschätzung</span><b>${zahl(kosten.summe)} EUR netto</b></div>
<p class="${anteil > 0 ? "warnung" : "matt"}">
${
  anteil >= 99.5
    ? "Die Summe beruht vollständig auf Richtwerten aus dem Katalog. Sie ist eine Größenordnung, keine Kalkulation."
    : `${zahl(anteil, 0)} % der Summe (${zahl(kosten.summeAusRichtwerten)} EUR) beruhen auf Richtwerten statt auf eigenen Preisen.`
}
${kosten.unbepreistePositionen > 0 ? ` ${kosten.unbepreistePositionen} Positionen sind ohne Preis geblieben.` : ""}
</p>
</section>`
    : "";

  const annahmen = auszug.angewandteAnnahmen.length > 0
    ? `<section class="block alert">
<p class="block-kopf">Diese Werte stehen nicht im Plan</p>
<ul>${auszug.angewandteAnnahmen
        .map((a) => `<li><b>${esc(a.titel)}</b><span>${esc(a.begruendung)} ${esc(a.auswirkung)}</span></li>`)
        .join("")}</ul>
</section>`
    : "";

  const pruefpunkte = auszug.pruefpunkte.length > 0
    ? `<section class="block accent">
<p class="block-kopf">Prüfpunkte im Plansatz</p>
<ul>${auszug.pruefpunkte.map((p) => `<li><span>${esc(p)}</span></li>`).join("")}</ul>
</section>`
    : "";

  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titel)}</title>
<style>
:root{--paper:#f7f6f1;--card:#fff;--sunk:#f0eee6;--ink:#14130f;--matt:#6b6a63;--line:#dcdacd;--gelb:#f4c400;--gruen:#1f7a33;--rot:#c0301d}
*{box-sizing:border-box}
body{background:var(--paper);color:var(--ink);font-family:Inter,system-ui,-apple-system,sans-serif;font-size:14px;line-height:1.6;margin:0;padding:0 20px 80px}
.blatt{max-width:1180px;margin:0 auto;display:flex;flex-direction:column;gap:40px}
header{border:1.5px solid var(--ink);background:var(--card);margin-top:36px;padding:24px}
h1{font-weight:900;text-transform:uppercase;letter-spacing:-.02em;line-height:.95;font-size:clamp(1.7rem,4vw,2.6rem);margin:.4em 0 0}
.eyebrow{font-family:ui-monospace,monospace;font-size:11px;text-transform:uppercase;letter-spacing:.11em;color:var(--matt);margin:0}
h2{font-weight:800;text-transform:uppercase;font-size:1.15rem;margin:0 0 14px;border-bottom:1.5px solid var(--ink);padding-bottom:8px;display:flex;flex-wrap:wrap;gap:12px;align-items:baseline}
.lg{font-family:ui-monospace,monospace;font-size:11px;letter-spacing:.07em;color:var(--matt);font-weight:400;margin-left:auto}
.vorspann{color:var(--matt);max-width:70ch;margin:0 0 14px}
table{width:100%;border-collapse:collapse;font-size:13px;background:var(--card);border:1px solid var(--line)}
thead th{background:var(--sunk);font-family:ui-monospace,monospace;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.09em;color:var(--matt);text-align:left;padding:9px 12px;border-bottom:1px solid var(--line);white-space:nowrap}
td{padding:9px 12px;border-bottom:1px solid var(--line);vertical-align:top}
.num{text-align:right;font-family:ui-monospace,monospace;font-variant-numeric:tabular-nums;white-space:nowrap}
th.num{text-align:right}
.mono{font-family:ui-monospace,monospace}
.matt{color:var(--matt)}
.klein{font-size:11.5px}
.detail{display:block;font-size:11.5px;color:var(--matt);margin-top:2px;font-weight:400}
tr.gruppe td{background:var(--sunk);font-family:ui-monospace,monospace;font-size:10px;text-transform:uppercase;letter-spacing:.09em;color:var(--matt);padding:6px 12px}
tr.summe td{background:var(--sunk);font-weight:600;border-top:1.5px solid var(--ink)}
.punkt{display:inline-block;width:9px;height:9px}
.punkt.plan{background:var(--gruen)}.punkt.berechnet{background:var(--gelb)}.punkt.annahme{background:var(--rot)}
.stern{color:var(--rot);margin-left:2px}
.legende{background:var(--sunk);border:1px solid var(--line);padding:16px 18px;display:flex;flex-wrap:wrap;gap:20px}
.legende div{display:flex;gap:8px;align-items:flex-start;font-size:13px}
.legende b{font-family:ui-monospace,monospace;font-size:11px;text-transform:uppercase;display:block}
.kosten{border:2px solid var(--ink);background:var(--card)}
.kosten-kopf{background:var(--ink);color:var(--paper);padding:14px 18px;display:flex;flex-wrap:wrap;gap:12px;align-items:baseline;font-family:ui-monospace,monospace;font-size:11px;text-transform:uppercase;letter-spacing:.09em}
.kosten-kopf b{margin-left:auto;font-size:1.4rem;font-variant-numeric:tabular-nums}
.kosten p{margin:0;padding:14px 18px;font-size:13px}
.warnung{background:rgba(192,48,29,.08);border-top:1px solid rgba(192,48,29,.3);color:var(--matt)}
.block{border:2px solid var(--rot);background:var(--card)}
.block.accent{border-color:var(--gelb)}
.block-kopf{background:var(--rot);color:var(--paper);font-family:ui-monospace,monospace;font-size:11px;text-transform:uppercase;letter-spacing:.1em;padding:8px 18px;margin:0;font-weight:600}
.block.accent .block-kopf{background:var(--gelb);color:var(--ink)}
.block ul{margin:0;padding:0;list-style:none}
.block li{padding:12px 18px;border-bottom:1px solid var(--line);display:grid;grid-template-columns:minmax(0,200px) minmax(0,1fr);gap:4px 20px;font-size:13px}
.block li:last-child{border-bottom:none}
.block li b{font-family:ui-monospace,monospace;font-size:11.5px;text-transform:uppercase}
.block li span{color:var(--matt)}
footer{border-top:1px solid var(--line);padding-top:16px;font-family:ui-monospace,monospace;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--matt)}
@media(max-width:640px){.block li{grid-template-columns:1fr}}
@media print{body{background:#fff;padding:0}section{break-inside:avoid}}
</style>
</head>
<body>
<div class="blatt">
<header>
<p class="eyebrow">Mengenermittlung und Kostenschätzung · MengenWerk</p>
<h1>${esc(titel)}</h1>
</header>

<div class="legende">
<div><span class="punkt plan"></span><span><b>Aus Plan</b>Wert steht beschriftet im Plan.</span></div>
<div><span class="punkt berechnet"></span><span><b>Berechnet</b>Aus bemaßten Planmaßen gerechnet.</span></div>
<div><span class="punkt annahme"></span><span><b>Annahme</b>Nicht im Plan enthalten. Vor Ausschreibung prüfen.</span></div>
</div>

${kostenBlock}
${raumbuch(auszug.raeume)}
${abschnitte}
${annahmen}
${pruefpunkte}

<footer>Erstellt am ${erstellt.toLocaleDateString("de-AT")} · Mit * gekennzeichnete Einheitspreise sind Richtwerte, keine eigenen Preise · Alle Beträge netto</footer>
</div>
</body>
</html>`;
}
