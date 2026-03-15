import { PageSkeleton } from "@/components/PageSkeleton";

export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 lg:px-6 lg:py-10">
      <PageSkeleton />
    </div>
  );
}
