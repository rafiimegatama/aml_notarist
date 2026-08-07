import { Skeleton, SkeletonCard, SkeletonTable } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <Skeleton className="h-8 w-48" />
      <SkeletonCard />
      <SkeletonTable />
    </div>
  );
}
