/**
 * Zählt, was eine Auswertung an API-Kosten verursacht hat.
 *
 * Ein Plansatz wird in mehreren Aufrufen ausgewertet — einer für die
 * übergreifenden Angaben, einer je Blatt. Was das zusammen kostet, steht
 * sonst nur im Anthropic-Konto und dort erst am nächsten Tag. Hier wird es
 * mitgezählt und mit dem Ergebnis ausgegeben, damit nach jedem Plan sichtbar
 * ist, was er gekostet hat.
 *
 * Der Tarif hängt am Modell. Ist für das verwendete Modell keiner hinterlegt,
 * bleiben die Kosten leer und es werden nur die Token gezeigt — eine mit dem
 * falschen Tarif gerechnete Zahl wäre schlimmer als keine.
 */

/** Preise je einer Million Token, in US-Dollar. Anthropic rechnet in Dollar ab. */
interface Tarif {
  eingabe: number;
  ausgabe: number;
  /** Aufschlag für Token, die in den Zwischenspeicher geschrieben werden. */
  cacheSchreiben: number;
  /** Ermäßigung für Token, die aus dem Zwischenspeicher kommen. */
  cacheLesen: number;
}

const TARIFE: Record<string, Tarif> = {
  "claude-opus-5": { eingabe: 5.0, ausgabe: 25.0, cacheSchreiben: 6.25, cacheLesen: 0.5 },
};

/**
 * Der Ausschnitt der SDK-Antwort, der hier gebraucht wird. Die
 * Zwischenspeicher-Felder fehlen, solange nicht zwischengespeichert wird.
 */
export interface Tokenverbrauch {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number | null;
  cache_read_input_tokens?: number | null;
}

/** Was am Ende einer Auswertung angezeigt wird. Reine Daten, damit es durch JSON passt. */
export interface VerbrauchsBericht {
  modell: string;
  /** Wie viele Anfragen an die API nötig waren. */
  aufrufe: number;
  eingabeToken: number;
  ausgabeToken: number;
  /** null, wenn für das Modell kein Tarif hinterlegt ist. */
  kostenUsd: number | null;
}

function tokenKosten(verbrauch: Tokenverbrauch, tarif: Tarif): number {
  const je = (anzahl: number, preis: number) => (anzahl / 1_000_000) * preis;
  return (
    je(verbrauch.input_tokens, tarif.eingabe) +
    je(verbrauch.output_tokens, tarif.ausgabe) +
    je(verbrauch.cache_creation_input_tokens ?? 0, tarif.cacheSchreiben) +
    je(verbrauch.cache_read_input_tokens ?? 0, tarif.cacheLesen)
  );
}

/**
 * Sammelt den Verbrauch aller Aufrufe einer Auswertung. Die Blätter werden
 * nebenläufig ausgewertet, deshalb zählt ein gemeinsamer Zähler mit, statt
 * dass jede Funktion ihren Anteil durchreicht.
 */
export class Verbrauch {
  private aufrufe = 0;
  private eingabe = 0;
  private ausgabe = 0;
  private kosten = 0;

  constructor(private readonly modell: string) {}

  /** Zählt einen erfolgreichen Aufruf. Gescheiterte kosten nichts und zählen nicht. */
  addiere(verbrauch: Tokenverbrauch | undefined | null): void {
    if (!verbrauch) return;
    this.aufrufe++;
    this.eingabe +=
      verbrauch.input_tokens +
      (verbrauch.cache_creation_input_tokens ?? 0) +
      (verbrauch.cache_read_input_tokens ?? 0);
    this.ausgabe += verbrauch.output_tokens;

    const tarif = TARIFE[this.modell];
    if (tarif) this.kosten += tokenKosten(verbrauch, tarif);
  }

  bericht(): VerbrauchsBericht {
    return {
      modell: this.modell,
      aufrufe: this.aufrufe,
      eingabeToken: this.eingabe,
      ausgabeToken: this.ausgabe,
      kostenUsd: TARIFE[this.modell] ? this.kosten : null,
    };
  }
}

/** Formatiert einen Dollarbetrag. Unter einem Cent gerundet bliebe nur "0,00". */
export function formatiereKosten(usd: number): string {
  const nachkommastellen = usd > 0 && usd < 0.01 ? 4 : 2;
  return `${usd.toLocaleString("de-AT", {
    minimumFractionDigits: nachkommastellen,
    maximumFractionDigits: nachkommastellen,
  })} USD`;
}
