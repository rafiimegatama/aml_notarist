"use client";

import { CircleAlert } from "lucide-react";

/**
 * FR-3 (Must) — dismissable, bukan hard block: notaris bisa "Tinjau sekarang"
 * (fokus ke field pertama yang belum diverifikasi), "Tandai semua sudah
 * benar" (percaya semua guess, langsung simpan), atau tetap "Simpan tanpa
 * review" kalau memang mau lanjut — sekali sudah lihat panel ini, percobaan
 * submit berikutnya tidak diinterupsi lagi (lihat pola pakai di *Form.tsx).
 */
export function OcrReviewGate({
  labels,
  onReviewNow,
  onConfirmAllAndSave,
  onProceedAnyway,
}: {
  labels: string[];
  onReviewNow: () => void;
  onConfirmAllAndSave: () => void;
  onProceedAnyway: () => void;
}) {
  return (
    <div
      role="alertdialog"
      aria-label="Field OCR belum direview"
      className="flex gap-3 rounded-2xl border-2 border-warning bg-warning-subtle px-4 py-3.5 text-sm text-amber-900 shadow-soft-sm"
    >
      <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-warning" strokeWidth={2} />
      <div className="min-w-0">
        <p className="font-semibold">
          {labels.length} field belum direview: {labels.join(", ")}
        </p>
        <p className="mt-1 text-amber-800">
          Nilai di atas berasal dari OCR dan belum diperiksa manual. Yakin
          sudah benar?
        </p>
        <div className="mt-3 flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={onReviewNow}
            className="btn px-3.5 py-1.5 text-xs bg-amber-600 text-white shadow-soft-sm hover:bg-amber-500"
          >
            Tinjau sekarang
          </button>
          <button
            type="button"
            onClick={onConfirmAllAndSave}
            className="btn btn-secondary px-3.5 py-1.5 text-xs border-amber-300 text-amber-800 hover:bg-amber-100"
          >
            Tandai semua sudah benar &amp; Simpan
          </button>
          <button
            type="button"
            onClick={onProceedAnyway}
            className="btn btn-ghost px-3.5 py-1.5 text-xs text-amber-700 underline hover:text-amber-900"
          >
            Simpan tanpa review
          </button>
        </div>
      </div>
    </div>
  );
}
