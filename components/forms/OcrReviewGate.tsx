"use client";

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
      className="rounded-md border-2 border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"
    >
      <p className="font-medium">
        {labels.length} field belum direview: {labels.join(", ")}
      </p>
      <p className="mt-1 text-amber-800">
        Nilai di atas berasal dari OCR dan belum diperiksa manual. Yakin
        sudah benar?
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onReviewNow}
          className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-500"
        >
          Tinjau sekarang
        </button>
        <button
          type="button"
          onClick={onConfirmAllAndSave}
          className="rounded-md border border-amber-400 bg-white px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100"
        >
          Tandai semua sudah benar &amp; Simpan
        </button>
        <button
          type="button"
          onClick={onProceedAnyway}
          className="px-3 py-1.5 text-xs font-medium text-amber-700 underline hover:text-amber-900"
        >
          Simpan tanpa review
        </button>
      </div>
    </div>
  );
}
