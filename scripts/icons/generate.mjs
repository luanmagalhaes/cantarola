import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..");
const publicDir = join(root, "public");
const appDir = join(root, "src", "app");

const base = await readFile(join(appDir, "icon.svg"));
const maskable = await readFile(join(here, "maskable.svg"));

await mkdir(publicDir, { recursive: true });

const targets = [
  { source: base, output: join(publicDir, "icon-192.png"), size: 192 },
  { source: base, output: join(publicDir, "icon-512.png"), size: 512 },
  {
    source: maskable,
    output: join(publicDir, "icon-maskable-512.png"),
    size: 512,
  },
  { source: base, output: join(appDir, "apple-icon.png"), size: 180 },
];

for (const target of targets) {
  const png = await sharp(target.source)
    .resize(target.size, target.size)
    .png()
    .toBuffer();

  await writeFile(target.output, png);
  console.log(`wrote ${target.output}`);
}
