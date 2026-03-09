"use client";

import NProgress from "nprogress";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

import "nprogress/nprogress.css";

/**
 * Global navigation progress indicator – thin blue bar at top on route change.
 * YouTube/GitHub-style pattern.
 */
export function NProgressProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    NProgress.configure({
      showSpinner: false,
      trickleSpeed: 100,
      minimum: 0.08
    });
  }, []);

  useEffect(() => {
    NProgress.done();
  }, [pathname]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");
      if (
        anchor &&
        anchor.href &&
        anchor.target !== "_blank" &&
        !anchor.download &&
        !anchor.getAttribute("href")?.startsWith("#")
      ) {
        try {
          const url = new URL(anchor.href);
          if (url.origin === window.location.origin && url.pathname !== window.location.pathname) {
            NProgress.start();
          }
        } catch {
          // ignore
        }
      }
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  return <>{children}</>;
}
