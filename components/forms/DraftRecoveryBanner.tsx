"use client";

import { History, X } from "lucide-react";

function formatRelative(savedAt: number): string {
  const minutes = Math.max(0, Math.round((Date.now() - savedAt) / 60000));
  if (minutes < 1) return "baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.round(minutes / 60);
  return `${hours} jam lalu`;
}

export function DraftRecoveryBanner({
  savedAt,
  onRestore,
  onDiscard,
}: {
  savedAt: number;
  onRestore: () => void;
  onDiscard: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-brand-subtle bg-brand-subtle/40 px-4 py-3.5 text-sm">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-brand-hover shadow-soft-sm">
        <History className="h-[18px] w-[18px]" strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-bold text-slate-900">Draft tersimpan ditemukan</p>
        <p className="font-medium text-muted">Otomatis tersimpan {formatRelative(savedAt)} — lanjutkan mengisi dari sana?</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button type="button" onClick={onRestore} className="btn btn-primary px-3.5 py-2 text-xs">
          Pulihkan Draft
        </button>
        <button
          type="button"
          onClick={onDiscard}
          aria-label="Buang draft"
          title="Buang draft"
          className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-white hover:text-slate-600"
        >
          <X className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
