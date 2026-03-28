import "./globals.css";
import type { Metadata } from "next";
import { DM_Sans, DM_Mono } from "next/font/google";
import { readFile } from "fs/promises";
import path from "path";
import { headers } from "next/headers";
import { NProgressProvider } from "@/components/NProgressProvider";
import {
  readBundledAppCssFromNext,
  shouldInlineBundledCssForCsp
} from "@/lib/bundled-app-css";

let marketingCriticalCssCache: string | null = null;

async function getMarketingCriticalCss(): Promise<string> {
  if (process.env.NODE_ENV === "production" && marketingCriticalCssCache !== null) {
    return marketingCriticalCssCache;
  }
  const fullPath = path.join(process.cwd(), "public", "marketing-critical.css");
  const css = await readFile(fullPath, "utf8");
  if (process.env.NODE_ENV === "production") {
    marketingCriticalCssCache = css;
  }
  return css;
}

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap"
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
  display: "swap"
});

export const metadata: Metadata = {
  title: "AI Readiness | AI Readiness Platform",
  description: "Assess, plan, and oversee your AI systems across the CoSAI five-layer framework"
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const hdrs = await headers();
  const nonce = hdrs.get("x-nonce") ?? undefined;
  const ua = hdrs.get("user-agent") ?? "";

  /* Inline marketing CSS: Safari/WebKit often ignores <link rel="stylesheet"> under strict
   * style-src nonce CSP; inline <style nonce> is the reliable pattern (see MDN CSP style-src). */
  let marketingCriticalCss = "";
  try {
    marketingCriticalCss = await getMarketingCriticalCss();
  } catch {
    marketingCriticalCss = "";
  }

  let bundledAppCss = "";
  if (shouldInlineBundledCssForCsp(ua)) {
    try {
      bundledAppCss = await readBundledAppCssFromNext();
    } catch {
      bundledAppCss = "";
    }
  }

  const inlinedCss = [bundledAppCss, marketingCriticalCss].filter(Boolean).join("\n\n");

  return (
    <html lang="en" className={`${dmSans.variable} ${dmMono.variable}`}>
      <head>
        {inlinedCss ? (
          // Browsers hide nonce from JS; hydration sees nonce="" and mismatches SSR.
          <style
            nonce={nonce}
            suppressHydrationWarning
            dangerouslySetInnerHTML={{
              __html: inlinedCss.replace(/<\/style/gi, "<\\/style")
            }}
          />
        ) : null}
      </head>
      <body className="font-sans antialiased">
        <NProgressProvider>{children}</NProgressProvider>
      </body>
    </html>
  );
}
