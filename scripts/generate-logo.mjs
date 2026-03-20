import { readFileSync } from "fs";
import sharp from "sharp";

const svg = readFileSync("public/logo.svg");
await sharp(Buffer.from(svg)).resize(256, 256).png().toFile("public/logo.png");

console.log("Logo PNG generated");
