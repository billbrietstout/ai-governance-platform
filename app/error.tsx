"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center">
      <h1 className="text-4xl font-bold text-slatePro-100">500</h1>
      <p className="mt-2 text-slatePro-400">Something went wrong</p>
      <button
        type="button"
        onClick={reset}
        className="mt-4 rounded bg-navy-600 px-4 py-2 text-sm text-white hover:bg-navy-500"
      >
        Try again
      </button>
    </main>
  );
}
