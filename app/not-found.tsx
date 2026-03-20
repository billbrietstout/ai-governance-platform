import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center">
      <h1 className="text-slatePro-100 text-4xl font-bold">404</h1>
      <p className="text-slatePro-400 mt-2">Page not found</p>
      <Link href="/" className="text-navy-400 mt-4 hover:underline">
        Return home
      </Link>
    </main>
  );
}
