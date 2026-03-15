import "./globals.css";
import type { Metadata } from "next";

import { NProgressProvider } from "@/components/NProgressProvider";

export const metadata: Metadata = {
  title: "AI Posture | AI Readiness Platform",
  description: "Assess, plan, and govern your AI systems across the CoSAI five-layer framework"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <NProgressProvider>{children}</NProgressProvider>
      </body>
    </html>
  );
}
