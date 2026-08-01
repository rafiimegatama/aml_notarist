export default function AdminReferensiLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <div className="h-8 w-64 animate-pulse rounded bg-gray-200" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="h-40 animate-pulse rounded-lg border border-gray-200 bg-gray-100"
        />
      ))}
    </div>
  );
}
