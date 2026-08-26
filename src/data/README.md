# Leistungsbeschreibung Hochbau (LB-HB)

`lbhb023.json` hält den Leistungskatalog, gegen den MengenWerk erkannte Bauteile
zuordnet. Die Datei ist derzeit **unvollständig** (`"vollstaendig": false`): sie
enthält nur die dreizehn Leistungsgruppen, die vorher in `src/lib/group.ts`
hartcodiert waren. Untergruppen und Positionsnummern fehlen, weil die
vollständige LB-HB 023 dem Projekt nicht beiliegt.

Solange `vollstaendig` auf `false` steht, weist die Anwendung in der
Ergebnisansicht darauf hin, dass die Zuordnung nur auf Ebene der
Leistungsgruppen erfolgt.

## Echten Katalog einhängen

1. LB-HB 023 in die untenstehende Struktur bringen und als `lbhb023.json`
   ablegen (Dateiname und Pfad beibehalten, der Import in `src/lib/lbhb.ts`
   zeigt darauf).
2. `"vollstaendig"` auf `true` setzen.
3. `zuordnung` ergänzen: leere `lg`-Arrays bedeuten, dass für diese Kombination
   aus Bauteiltyp und Material noch keine belegte Leistungsgruppe vorliegt.

```jsonc
{
  "katalog": "LB-HB",
  "version": "023",
  "vollstaendig": true,
  "leistungsgruppen": [
    {
      "lg": "07",
      "bezeichnung": "Beton- und Stahlbetonarbeiten",
      "untergruppen": [
        {
          "ulg": "07.01",
          "bezeichnung": "…",
          "positionen": [
            { "nummer": "070101A", "kurztext": "…", "einheit": "m3" }
          ]
        }
      ]
    }
  ],
  "zuordnung": [
    { "type": "wand", "material": "ziegel", "lg": ["08"] }
  ]
}
```

## Zuordnungsregeln

`zuordnung` wird von der spezifischsten zur allgemeinsten Regel ausgewertet:
zuerst der Treffer auf `type` **und** `material`, danach der Eintrag mit
`"material": null` als Rückfallebene für denselben Typ.

Materialbezeichnungen werden vor dem Vergleich normalisiert (Kleinschreibung,
Umlaute aufgelöst, Bindestriche vereinheitlicht) — siehe
`normalisiereMaterial()` in `src/lib/lbhb.ts`. Die Planlegende österreichischer
Einreichpläne liefert diese Materialien über die Farbcodierung (rot = Ziegel,
grün = Stahlbeton, braun = Holzkonstruktion, orange = GK-Ständerwand).
