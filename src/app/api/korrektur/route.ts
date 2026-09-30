import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ANNAHMEN, type AnnahmeId } from "@/lib/annahmen";
import { AUTH_COOKIE, istAngemeldet } from "@/lib/auth";
import type { Korrekturen } from "@/lib/korrekturen";

export const runtime = "nodejs";

const IDS = Object.keys(ANNAHMEN) as [AnnahmeId, ...AnnahmeId[]];

const Schema = z.object({
  raumhoehe: z.array(z.object({ geschoss: z.string(), wert: z.number() })),
  deckenUnterkante: z.array(z.object({ geschoss: z.string(), wert: z.number() })),
  annahmen: z.array(z.object({ id: z.enum(IDS), wert: z.number() })),
});

const ANNAHMEN_LISTE = Object.values(ANNAHMEN)
  .map((a) => `- ${a.id}: ${a.titel} (Einheit ${a.einheit === "-" ? "Anteil 0-1" : a.einheit})`)
  .join("\n");

const SYSTEM = `Du übersetzt Korrekturen eines Bauunternehmers an einer Mengenermittlung in strukturierte Werte.

Mögliche Korrekturen:
- raumhoehe: lichte Raumhöhe in Metern je Geschoß. Geschoß "*" wenn für alle Geschoße gemeint.
- deckenUnterkante: Unterkante einer abgehängten Decke in Metern je Geschoß ("*" für alle).
- annahmen: ersetzt eine Standardannahme. Werte in der angegebenen Einheit (Stärken und Höhen in Metern, also 6 cm = 0.06).
${ANNAHMEN_LISTE}

Übernimm nur Werte, die der Text ausdrücklich als richtigen Wert nennt. Ein Wert hinter "statt" oder "anstatt" ist der alte, falsche Wert. Was sich keiner Kategorie zuordnen lässt, lässt du weg.`;

export async function POST(req: NextRequest) {
  if (!(await istAngemeldet(req.cookies.get(AUTH_COOKIE)?.value))) {
    return NextResponse.json({ fehler: "Nicht angemeldet." }, { status: 401 });
  }

  let text = "";
  let geschosse: string[] = [];
  try {
    const body = (await req.json()) as { text?: unknown; geschosse?: unknown };
    text = typeof body.text === "string" ? body.text.slice(0, 2000) : "";
    geschosse = Array.isArray(body.geschosse) ? body.geschosse.filter((g): g is string => typeof g === "string") : [];
  } catch {
    return NextResponse.json({ fehler: "Die Anfrage war nicht lesbar." }, { status: 400 });
  }
  if (!text.trim()) return NextResponse.json({ fehler: "Kein Text übermittelt." }, { status: 400 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { fehler: "Diese Formulierung wurde nicht erkannt, und für die KI-Auswertung ist kein ANTHROPIC_API_KEY hinterlegt." },
      { status: 503 },
    );
  }

  const client = new Anthropic({ maxRetries: 1 });
  try {
    const antwort = await client.beta.messages.parse(
      {
        model: "claude-sonnet-5-5",
        max_tokens: 16000,
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        thinking: { type: "adaptive" },
        output_config: { effort: "low", format: betaZodOutputFormat(Schema) },
        system: SYSTEM,
        messages: [
          {
            role: "user",
            content: `Geschoße im Plan: ${geschosse.join(", ") || "unbekannt"}\n\nKorrektur:\n${text}`,
          },
        ],
      },
      { timeout: 60_000 },
    );

    if (antwort.stop_reason === "refusal" || !antwort.parsed_output) {
      return NextResponse.json({ fehler: "Die Korrektur konnte nicht ausgewertet werden." }, { status: 422 });
    }

    const g = antwort.parsed_output;
    const korrekturen: Korrekturen = {
      raumhoehe: Object.fromEntries(g.raumhoehe.map((e) => [e.geschoss, e.wert])),
      deckenUnterkante: Object.fromEntries(g.deckenUnterkante.map((e) => [e.geschoss, e.wert])),
      annahmen: Object.fromEntries(g.annahmen.map((e) => [e.id, e.wert])),
    };
    return NextResponse.json({ korrekturen });
  } catch (err) {
    console.error("Korrektur fehlgeschlagen", err);
    if (err instanceof Anthropic.AuthenticationError) {
      return NextResponse.json({ fehler: "Der hinterlegte ANTHROPIC_API_KEY wurde abgelehnt." }, { status: 500 });
    }
    if (err instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ fehler: "Die KI ist gerade ausgelastet. Bitte gleich noch einmal versuchen." }, { status: 503 });
    }
    return NextResponse.json({ fehler: "Die Korrektur konnte nicht ausgewertet werden." }, { status: 502 });
  }
}
