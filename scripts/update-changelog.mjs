#!/usr/bin/env node
// Wird vom post-commit-Hook (scripts/githooks/post-commit) nach jedem Commit
// aufgerufen. Liest den zuletzt erstellten Commit und trägt ihn oben in
// CHANGELOG.md ein, damit jede Änderung am Repo dort mit Datum, Uhrzeit,
// Autor und Commit-Message dokumentiert ist.
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const CHANGELOG_PATH = new URL("../CHANGELOG.md", import.meta.url);

function git(args) {
  return execSync(`git ${args}`, { encoding: "utf8" }).trim();
}

const zeile = git(`log -1 --pretty=format:"%ad%x1f%an%x1f%h%x1f%s" --date=format:"%Y-%m-%d %H:%M"`);
const [datumUhrzeit, autorName, kurzHash, betreff] = zeile.split("\u001f");

const eintrag = `- **${datumUhrzeit}** · ${autorName} · \`${kurzHash}\` — ${betreff}`;

const kopf = `# Changelog\n\nAutomatisch aus den Commit-Messages dieses Repos erstellt. Jeder Commit,\negal von wem, erscheint hier mit Zeitpunkt, Autor und Commit-Message.\nWird von \`scripts/update-changelog.mjs\` über den \`post-commit\`-Hook\n(\`scripts/githooks/post-commit\`) gepflegt — nicht händisch bearbeiten.\n\n`;

let inhalt = existsSync(CHANGELOG_PATH) ? readFileSync(CHANGELOG_PATH, "utf8") : kopf;
if (!inhalt.startsWith("# Changelog")) inhalt = kopf;

const zeilen = inhalt.split("\n");
const kopfEndeIndex = zeilen.findIndex((z) => z.startsWith("- **"));
const bestehendeEintraege = kopfEndeIndex === -1 ? [] : zeilen.slice(kopfEndeIndex);

// Beim Amend im Hook bleibt die Commit-Message gleich; keinen doppelten
// Eintrag für denselben Commit-Betreff ganz oben anlegen.
if (bestehendeEintraege[0] === eintrag) {
  process.exit(0);
}

const kopfBlock = kopfEndeIndex === -1 ? inhalt.trimEnd() + "\n\n" : zeilen.slice(0, kopfEndeIndex).join("\n");

writeFileSync(CHANGELOG_PATH, `${kopfBlock}${eintrag}\n${bestehendeEintraege.join("\n")}`.trimEnd() + "\n");
