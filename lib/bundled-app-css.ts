import { readdir, readFile } from "fs/promises";
import path from "path";

let prodBundledCssCache: string | null = null;

/**
 * WebKit (Safari, iOS browsers) often does not apply <link rel="stylesheet"> under
 * style-src 'self' 'nonce-…' CSP. Inlining the same CSS in <style nonce> fixes layout.
 * Desktop Chrome/Chromium/Edge/Firefox: false (linked chunks work).
 */
export function shouldInlineBundledCssForCsp(userAgent: string): boolean {
  if (!userAgent) return false;
  if (/Chrome|Chromium|Edg|OPR|Firefox/i.test(userAgent)) return false;
  return /\bSafari\b/i.test(userAgent);
}

function sortCssChunkFiles(files: string[]): string[] {
  const score = (n: string): number => {
    if (n.includes("dm_sans") && n.includes("font")) return 0;
    if (n.includes("dm_mono") && n.includes("font")) return 1;
    if (n.includes("app_globals")) return 2;
    if (n.includes("nprogress")) return 3;
    if (n.includes("[root-of-the-server]")) return 4;
    if (n.includes("marketing-fallback")) return 5;
    return 10;
  };
  return [...files].sort((a, b) => score(a) - score(b) || a.localeCompare(b));
}

/**
 * Reads compiled CSS chunks from .next (Turbopack dev layout or webpack prod).
 * Dev: no module cache so HMR edits apply. Prod: cached per process.
 */
export async function readBundledAppCssFromNext(): Promise<string> {
  const isProd = process.env.NODE_ENV === "production";
  if (isProd && prodBundledCssCache !== null) {
    return prodBundledCssCache;
  }

  const chunksDir = isProd
    ? path.join(process.cwd(), ".next", "static", "chunks")
    : path.join(process.cwd(), ".next", "dev", "static", "chunks");

  let files: string[];
  try {
    files = (await readdir(chunksDir)).filter((f) => f.endsWith(".css"));
  } catch {
    return "";
  }

  if (files.length === 0) {
    return "";
  }

  const sorted = sortCssChunkFiles(files);
  const parts: string[] = [];
  for (const f of sorted) {
    const text = await readFile(path.join(chunksDir, f), "utf8");
    parts.push(text);
  }
  const combined = parts.join("\n");

  if (isProd) {
    prodBundledCssCache = combined;
  }
  return combined;
}
