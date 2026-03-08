export default function DashboardLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-dvh bg-slatePro-950">
      <div className="mx-auto max-w-6xl px-6 py-10">{children}</div>
    </div>
  );
}
