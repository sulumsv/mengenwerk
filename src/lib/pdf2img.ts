import { execFile } from "node:child_process";
import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);

export async function pdfZuBildern(pdfBuf: Buffer): Promise<Buffer[]> {
  const dir = await mkdtemp(join(tmpdir(), "mengenwerk-"));
  const pdfPath = join(dir, "plan.pdf");
  await writeFile(pdfPath, pdfBuf);

  try {
    await run("pdftoppm", ["-png", "-r", "200", pdfPath, join(dir, "seite")]);
    const dateien = (await readdir(dir)).filter((f) => f.startsWith("seite") && f.endsWith(".png")).sort();
    const bilder = await Promise.all(dateien.map((f) => readFile(join(dir, f))));
    return bilder;
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
