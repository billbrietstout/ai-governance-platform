import { DashboardNav } from "@/components/DashboardNav";

export default function DashboardLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-dvh bg-slatePro-950">
      <DashboardNav />
      <div className="mx-auto max-w-6xl px-4 py-6 lg:px-6 lg:py-10">{children}</div>
    </div>
  );
}
