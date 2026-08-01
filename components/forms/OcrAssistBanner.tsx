export function OcrAssistBanner({ rawText }: { rawText: string }) {
  return (
    <div
      role="status"
      className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800"
    >
      <p className="font-medium">
        Sebagian field di bawah diisi otomatis dari hasil pindai (OCR).
        Akurasi OCR untuk tulisan tangan bisa rendah — periksa dan koreksi
        setiap field sebelum menyimpan.
      </p>
      {rawText && (
        <details className="mt-2">
          <summary className="cursor-pointer text-xs font-medium text-blue-700">
            Lihat teks mentah hasil OCR
          </summary>
          <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded bg-white p-3 text-xs text-gray-700">
            {rawText}
          </pre>
        </details>
      )}
    </div>
  );
}
