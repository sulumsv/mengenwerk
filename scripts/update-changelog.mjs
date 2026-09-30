#!/usr/bin/env node
// Wird vom post-commit-Hook (scripts/githooks/post-commit) nach jedem Commit
// aufgerufen. Trägt den zuletzt erstellten Commit oben in CHANGELOG.md ein:
// Datum und Uhrzeit (Wiener Zeit), Autor, Commit, Titel und die Einzelheiten
// aus dem Text der Commit-Message.
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const CHANGELOG_PATH = new URL("../CHANGELOG.md", import.meta.url);

function git(args) {
  return execSync(`git ${args}`, { encoding: "utf8", env: { ...process.env, TZ: "Europe/Vienna" } }).trim();
}

const TRENNER = "\u001f";
const [datumUhrzeit, autorName, kurzHash, betreff, ...rest] = git(
  `log -1 --pretty=format:"%ad%x1f%an%x1f%h%x1f%s%x1f%b" --date=format-local:"%Y-%m-%d %H:%M"`,
).split(TRENNER);

// Trailer wie Co-Authored-By oder Claude-Session gehören nicht ins Changelog.
const einzelheiten = rest
  .join(TRENNER)
  .split("\n")
  .map((z) => z.trimEnd())
  .filter((z) => !/^[A-Za-z-]+: \S/.test(z) || /^[-*] /.test(z))
  .join("\n")
  .trim();

const kopfzeile = `### ${datumUhrzeit} Uhr · ${betreff}`;
const block = [
  kopfzeile,
  "",
  `${autorName} · Commit \`${kurzHash}\``,
  ...(einzelheiten ? ["", einzelheiten] : []),
].join("\n");

const kopf = `# Changelog

Jede Änderung an MengenWerk mit Datum und Uhrzeit (Wiener Zeit), Autor,
Commit und den Einzelheiten aus der Commit-Message, neueste zuerst.
Wird von \`scripts/update-changelog.mjs\` über den \`post-commit\`-Hook
(\`scripts/githooks/post-commit\`) gepflegt, nicht händisch bearbeiten.
`;

let inhalt = existsSync(CHANGELOG_PATH) ? readFileSync(CHANGELOG_PATH, "utf8") : kopf;
if (!inhalt.startsWith("# Changelog")) inhalt = kopf;

const start = inhalt.search(/^(### |- \*\*)/m);
const eintraege = start === -1 ? "" : inhalt.slice(start);

// Beim Amend im Hook läuft das Skript erneut; denselben Commit nicht doppelt eintragen.
if (eintraege.startsWith(kopfzeile)) process.exit(0);

writeFileSync(CHANGELOG_PATH, `${kopf}\n${block}\n\n${eintraege}`.trimEnd() + "\n");
