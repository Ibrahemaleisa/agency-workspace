/**
 * Shrinks the product screenshots in place (palette PNG; visually lossless for UI captures).
 * Uses sharp, which is installed with Next.js.  Run from site/: node scripts/compress-screenshots.mjs
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import sharp from "sharp";

const dir = new URL("../src/assets/product/", import.meta.url).pathname;
let before = 0;
let after = 0;
for (const file of readdirSync(dir).filter((f) => f.endsWith(".png"))) {
  const input = readFileSync(dir + file);
  const output = await sharp(input).png({ palette: true, quality: 95, effort: 10, compressionLevel: 9, dither: 0.5 }).toBuffer();
  before += input.length;
  after += Math.min(input.length, output.length);
  if (output.length < input.length) writeFileSync(dir + file, output);
}
console.log(`${(before / 1e6).toFixed(2)} MB → ${(after / 1e6).toFixed(2)} MB`);
