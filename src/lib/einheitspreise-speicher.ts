"use client";

import type { Einheitspreise } from "./preise";

/**
 * Die Einheitspreise eines Betriebs liegen im Browser, nicht auf dem Server —
 * das Projekt führt keine Datenbank, und Kalkulationspreise sind nichts, was
 * ungefragt fremd gespeichert gehört. Sie gelten damit je Gerät und Browser.
 */
const SCHLUESSEL = "mengenwerk.einheitspreise.v1";

export function ladeEinheitspreise(): Einheitspreise {
  if (typeof window === "undefined") return {};
  try {
    const roh = window.localStorage.getItem(SCHLUESSEL);
    if (!roh) return {};
    const geparst: unknown = JSON.parse(roh);
    if (typeof geparst !== "object" || geparst === null) return {};

    // Nur endliche, nicht negative Zahlen übernehmen: ein beschädigter Eintrag
    // darf die Kostenschätzung nicht mit NaN durchsetzen.
    const sauber: Einheitspreise = {};
    for (const [k, v] of Object.entries(geparst as Record<string, unknown>)) {
      if (typeof v === "number" && Number.isFinite(v) && v >= 0) sauber[k] = v;
    }
    return sauber;
  } catch {
    return {};
  }
}

export function speichereEinheitspreise(preise: Einheitspreise): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(SCHLUESSEL, JSON.stringify(preise));
    return true;
  } catch {
    return false;
  }
}

export function loescheEinheitspreise(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(SCHLUESSEL);
  } catch {
    // Ohne Speicherzugriff bleibt es bei den Richtwerten.
  }
}
