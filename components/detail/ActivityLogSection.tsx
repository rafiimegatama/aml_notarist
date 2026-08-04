function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/** FR-13 — timeline ringan, tanpa atribusi user (satu PIN bersama, lihat FR-6B). */
export function ActivityLogSection({
  entries,
}: {
  entries: { id: string; description: string; createdAt: Date }[];
}) {
  if (entries.length === 0) return null;

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">Riwayat Aktivitas</h2>
      <p className="mt-1 text-sm text-gray-500">
        Log ringan tanpa atribusi user (satu PIN bersama kantor) — untuk
        membantu menelusuri &ldquo;apa terjadi kapan&rdquo;, bukan audit
        trail resmi.
      </p>
      <ol className="mt-4 space-y-2 border-l border-gray-200 pl-4">
        {entries.map((entry) => (
          <li key={entry.id} className="text-sm">
            <span className="text-gray-900">{entry.description}</span>{" "}
            <span className="text-gray-400">
              — {formatDateTime(entry.createdAt)}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
