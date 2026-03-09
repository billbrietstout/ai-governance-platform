import "./globals.css";
import type { Metadata } from "next";

import { NProgressProvider } from "@/components/NProgressProvider";

export const metadata: Metadata = {
  title: "AI Governance Platform",
  description: "AI governance platform scaffold"
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
