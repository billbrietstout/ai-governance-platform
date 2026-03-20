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
      <h1 className="text-slatePro-100 text-4xl font-bold">500</h1>
      <p className="text-slatePro-400 mt-2">Something went wrong</p>
      <button
        type="button"
        onClick={reset}
        className="bg-navy-600 hover:bg-navy-500 mt-4 rounded px-4 py-2 text-sm text-white"
      >
        Try again
      </button>
    </main>
  );
}
