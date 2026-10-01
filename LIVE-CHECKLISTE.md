# Checkliste vor dem Livegang

Was vor dem Start mit echten Kunden und eigener Domain erledigt sein muss.

- [ ] **KI-Kosten ausblenden:** `KI_KOSTEN_ANZEIGEN` in `src/lib/einstellungen.ts` auf `false` stellen. Dann sehen Kunden weder im Ergebnis noch im Konto, was eine Auswertung an API-Kosten verursacht hat.
- [ ] **Eigene Preise verpflichtend:** `EIGENE_PREISE_PFLICHT` in `src/lib/preise.ts` auf `true` stellen, sobald es Kundenkonten gibt.
- [ ] **Echte Kundenkonten:** Derzeit teilen sich alle mit dem Passwort ein Konto, Pläne und Profil liegen gemeinsam unter `konto/` in R2.
- [ ] **Datenschutzerklärung und Impressum** von einer Fachperson prüfen lassen.
- [ ] **Öffentliche r2.dev-URL** des Buckets deaktiviert lassen.
- [ ] **Eigene Domain** in Vercel verbinden.
