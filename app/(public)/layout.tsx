/**
 * Public layout – minimal layout for landing and guest flows.
 * No sidebar, simple top nav.
 */
import Link from "next/link";
import { auth } from "@/auth";
import { ShieldLogo } from "@/components/ui/ShieldLogo";
import { PublicNav } from "./PublicNav";

export default async function PublicLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const isLoggedIn = !!session?.user;

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href={isLoggedIn ? "/dashboard" : "/"} className="flex items-center gap-2">
            <ShieldLogo className="h-8 w-8" />
            <span className="font-semibold text-slate-900">AI Posture</span>
          </Link>
          <PublicNav isLoggedIn={isLoggedIn} />
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-slate-200 bg-slate-50 py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-slate-600">
              Built on the{" "}
              <a
                href="https://cosai.org"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-navy-600 hover:underline"
              >
                CoSAI Shared Responsibility Framework
              </a>
            </p>
            <div className="flex gap-6 text-sm text-slate-600">
              <Link href="/privacy" className="hover:text-slate-900">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
