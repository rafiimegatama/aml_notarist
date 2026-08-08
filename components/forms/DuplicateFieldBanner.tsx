"use client";

import { Search, X } from "lucide-react";
import type { DuplicateCandidate } from "@/lib/actions/duplicateLookup";

export function DuplicateFieldBanner({
  candidate,
  applying,
  onApply,
  onDismiss,
}: {
  candidate: DuplicateCandidate;
  applying: boolean;
  onApply: () => void;
  onDismiss: () => void;
}) {
  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-2xl border border-brand-subtle bg-brand-subtle px-4 py-3.5 text-sm text-blue-800"
    >
      <Search className="mt-0.5 h-5 w-5 shrink-0 text-brand-hover" strokeWidth={2} />
      <div className="min-w-0 flex-1">
        <p>
          Ditemukan klien terdaftar dengan {candidate.matchedOn} yang sama:{" "}
          <strong>{candidate.label}</strong>. Isi field lain otomatis dari data ini?
        </p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onApply}
            disabled={applying}
            className="btn btn-secondary px-3.5 py-1.5 text-xs"
          >
            {applying ? "Mengisi..." : "Isi Otomatis"}
          </button>
          <button
            type="button"
            onClick={onDismiss}
            disabled={applying}
            className="btn btn-ghost px-3.5 py-1.5 text-xs"
          >
            <X className="h-3.5 w-3.5" strokeWidth={2} />
            Abaikan
          </button>
        </div>
      </div>
    </div>
  );
}
