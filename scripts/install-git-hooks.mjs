#!/usr/bin/env node
// Kopiert die Hooks aus scripts/githooks/ nach .git/hooks/, damit jeder
// Commit automatisch CHANGELOG.md aktualisiert. Läuft über "npm install"
// (siehe "prepare"-Script in package.json).
import { copyFileSync, chmodSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const projektwurzel = join(dirname(fileURLToPath(import.meta.url)), "..");
const quelle = join(projektwurzel, "scripts", "githooks");
const ziel = join(projektwurzel, ".git", "hooks");

if (!existsSync(ziel)) {
  // Kein .git-Verzeichnis (z. B. Build aus einem Tarball), nichts zu tun.
  process.exit(0);
}

for (const datei of readdirSync(quelle)) {
  const zielpfad = join(ziel, datei);
  copyFileSync(join(quelle, datei), zielpfad);
  chmodSync(zielpfad, 0o755);
}
