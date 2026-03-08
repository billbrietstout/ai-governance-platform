export default function AuthLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-dvh bg-slatePro-950">
      <div className="mx-auto max-w-4xl px-6 py-12">{children}</div>
    </div>
  );
}
