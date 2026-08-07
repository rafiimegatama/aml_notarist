import { Skeleton, SkeletonTable } from "@/components/ui/skeleton";

export default function AdminReferensiLoading() {
  return (
    <div className="space-y-8" aria-busy="true" aria-live="polite">
      <div className="mb-8 flex items-start gap-3.5">
        <Skeleton className="h-11 w-11 rounded-2xl" />
        <div className="space-y-2.5">
          <Skeleton className="h-6 w-80" />
          <Skeleton className="h-4 w-[28rem]" />
        </div>
      </div>
      <div className="space-y-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonTable key={i} rows={4} />
        ))}
      </div>
    </div>
  );
}
