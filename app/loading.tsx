export default function DashboardLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
      <div className="h-32 animate-pulse rounded-lg border border-gray-200 bg-gray-100" />
      <div className="h-64 animate-pulse rounded-lg border border-gray-200 bg-gray-100" />
    </div>
  );
}
