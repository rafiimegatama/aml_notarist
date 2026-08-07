import { ScanLine } from "lucide-react";

export function OcrAssistBanner({ rawText }: { rawText: string }) {
  return (
    <div
      role="status"
      className="flex gap-3 rounded-2xl border border-brand-subtle bg-brand-subtle px-4 py-3.5 text-sm text-blue-800"
    >
      <ScanLine className="mt-0.5 h-5 w-5 shrink-0 text-brand-hover" strokeWidth={2} />
      <div className="min-w-0">
        <p className="font-semibold text-blue-900">
          Sebagian field di bawah diisi otomatis dari hasil pindai (OCR).
          Akurasi OCR untuk tulisan tangan bisa rendah — periksa dan koreksi
          setiap field sebelum menyimpan.
        </p>
        {rawText && (
          <details className="mt-2">
            <summary className="cursor-pointer text-xs font-semibold text-brand-hover">
              Lihat teks mentah hasil OCR
            </summary>
            <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded-xl border border-border-subtle bg-white p-3 text-xs text-slate-700 shadow-soft-sm">
              {rawText}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
