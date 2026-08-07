import { History } from "lucide-react";

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
    <section className="card p-6 sm:p-7">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-subtle text-brand-hover">
          <History className="h-[18px] w-[18px]" strokeWidth={2} />
        </span>
        <div>
          <h2 className="text-base font-bold text-slate-900 sm:text-lg">
            Riwayat Aktivitas
          </h2>
          <p className="mt-1 text-sm font-medium text-muted">
            Log ringan tanpa atribusi user (satu PIN bersama kantor) — untuk
            membantu menelusuri &ldquo;apa terjadi kapan&rdquo;, bukan audit
            trail resmi.
          </p>
        </div>
      </div>
      <ol className="mt-6 space-y-0">
        {entries.map((entry, i) => (
          <li key={entry.id} className="relative flex gap-3 pb-5 last:pb-0">
            {i < entries.length - 1 && (
              <span className="absolute left-[5px] top-3 h-full w-px bg-border-subtle" aria-hidden />
            )}
            <span className="relative mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-brand ring-4 ring-brand-subtle" />
            <div className="min-w-0 flex-1 text-sm">
              <p className="font-medium text-slate-900">{entry.description}</p>
              <p className="mt-0.5 text-xs text-muted">
                {formatDateTime(entry.createdAt)}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
