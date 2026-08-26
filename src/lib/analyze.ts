import Anthropic from "@anthropic-ai/sdk";
import type { AnalysisResult, DetectedElement } from "./types";

const SYSTEM_PROMPT = `Du bist ein erfahrener Baukalkulator und liest österreichische/deutsche Einreichpläne (Grundrisse, Ansichten, Schnitte).
Erkenne alle Fenster, Türen, Wände, Böden, Decken und Fundamente mit ihren Maßen (aus Maßketten/Bemaßungen im Plan, in Metern).
Wenn ein Maß nicht eindeutig im Plan steht, schätze es NICHT ohne Kennzeichnung – setze stattdessen "quelle": "geschätzt, unsicher" statt "quelle": "Maßkette im Plan".
Gib für jedes Element den Rechenweg als kurzen Text an (z.B. "Breite 1.20 m x Höhe 1.40 m aus Maßkette Achse B-C").
Antworte AUSSCHLIESSLICH mit validem JSON nach diesem Schema, keine Erklärungen außerhalb des JSON:
{
  "elemente": [
    { "type": "fenster|tuer|wand|boden|decke|fundament|sonstiges", "label": "string", "breite_m": number, "hoehe_m": number, "tiefe_m": number|null, "anzahl": number, "material": "string|null", "quelle": "string", "rechenweg": "string" }
  ],
  "hinweise": ["string"]
}`;

export async function analysiereBildseiten(bilder: Buffer[], dateiname: string, dateityp: AnalysisResult["dateityp"]): Promise<AnalysisResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY ist nicht gesetzt. Bitte in .env.local eintragen.");
  }
  const client = new Anthropic({ apiKey });

  const alleElemente: DetectedElement[] = [];
  const alleHinweise: string[] = [];

  for (let i = 0; i < bilder.length; i++) {
    const bild = bilder[i];
    const msg = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 8000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: "image/png", data: bild.toString("base64") } },
            { type: "text", text: `Analysiere diese Planseite (Seite ${i + 1} von ${bilder.length}) und liefere das JSON.` },
          ],
        },
      ],
    });

    const textBlock = msg.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") continue;

    let parsed: { elemente: unknown[]; hinweise?: string[] };
    try {
      const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : textBlock.text);
    } catch {
      alleHinweise.push(`Seite ${i + 1}: Antwort konnte nicht als JSON gelesen werden, übersprungen.`);
      continue;
    }

    for (const el of parsed.elemente ?? []) {
      const e = el as Record<string, unknown>;
      alleElemente.push({
        id: crypto.randomUUID(),
        type: (e.type as DetectedElement["type"]) ?? "sonstiges",
        label: String(e.label ?? ""),
        breite_m: Number(e.breite_m ?? 0),
        hoehe_m: Number(e.hoehe_m ?? 0),
        tiefe_m: e.tiefe_m != null ? Number(e.tiefe_m) : undefined,
        anzahl: Number(e.anzahl ?? 1),
        material: e.material ? String(e.material) : undefined,
        quelle: String(e.quelle ?? "unbekannt") + ` (Seite ${i + 1})`,
        rechenweg: String(e.rechenweg ?? ""),
      });
    }
    if (parsed.hinweise) alleHinweise.push(...parsed.hinweise.map((h) => `Seite ${i + 1}: ${h}`));
  }

  return {
    dateiname,
    dateityp,
    seiten: bilder.length,
    elemente: alleElemente,
    hinweise: alleHinweise,
  };
}
