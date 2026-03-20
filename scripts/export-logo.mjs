#!/usr/bin/env node
/**
 * Export ShieldLogo SVG to 256x256 PNG.
 * Run: node scripts/export-logo.mjs
 */
import sharp from "sharp";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const svgPath = join(root, "public", "logo.svg");
const pngPath = join(root, "public", "logo.png");

const svg = readFileSync(svgPath, "utf8");
const png = await sharp(Buffer.from(svg)).resize(256, 256).png().toBuffer();

writeFileSync(pngPath, png);
console.log(`Wrote ${pngPath} (256x256)`);
