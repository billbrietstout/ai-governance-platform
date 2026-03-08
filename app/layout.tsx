import "./globals.css";
import type { Metadata } from "next";

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
      <body>{children}</body>
    </html>
  );
}
