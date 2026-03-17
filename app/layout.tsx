import "./globals.css";
import type { Metadata } from "next";
import { NProgressProvider } from "@/components/NProgressProvider";
import { SessionProvider } from "next-auth/react";

export const metadata: Metadata = {
  title: "AI Readiness | AI Readiness Platform",
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
        <SessionProvider>
          <NProgressProvider>{children}</NProgressProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
