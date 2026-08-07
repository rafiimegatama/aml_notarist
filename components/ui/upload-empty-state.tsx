import { FileStack } from "lucide-react";

export function UploadEmptyState({
  title = "Belum ada dokumen",
  description,
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border-subtle bg-slate-50/60 px-6 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-subtle text-brand-hover">
        <FileStack className="h-6 w-6" strokeWidth={1.5} />
      </div>
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      {description && <p className="max-w-xs text-xs font-medium text-muted">{description}</p>}
    </div>
  );
}
