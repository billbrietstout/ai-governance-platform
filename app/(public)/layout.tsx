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
    <div className="public-site-shell flex min-h-dvh min-h-screen flex-col">
      <header className="public-site-header">
        <div className="public-site-header-bar">
          <Link href={isLoggedIn ? "/dashboard" : "/"} className="public-site-logo-link">
            <ShieldLogo className="h-8 w-8 shrink-0" />
            <span className="font-semibold text-slate-900">AI Readiness</span>
          </Link>
          <PublicNav isLoggedIn={isLoggedIn} />
        </div>
      </header>

      <main className="public-site-main flex-1">{children}</main>

      <footer className="public-site-footer border-t border-slate-200 bg-slate-50 py-8">
        <div className="public-footer-inner">
          <div className="public-footer-bar flex flex-col items-center justify-between space-y-4 sm:flex-row sm:space-y-0">
            <p className="text-sm text-slate-600">
              Built on the{" "}
              <a
                href="https://coalitionforsecureai.org"
                target="_blank"
                rel="noopener noreferrer"
                className="public-footer-navy font-medium hover:underline"
              >
                CoSAI Shared Responsibility Framework
              </a>
            </p>
            <div className="public-footer-link-row flex text-sm text-slate-600">
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
