import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center">
      <h1 className="text-4xl font-bold text-slatePro-100">404</h1>
      <p className="mt-2 text-slatePro-400">Page not found</p>
      <Link href="/" className="mt-4 text-navy-400 hover:underline">
        Return home
      </Link>
    </main>
  );
}
