"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { uploadAndExtractDocument } from "@/lib/actions/document";
import { CustomerType } from "@/lib/generated/prisma/enums";
import { customerTypeLabels, labelOptions } from "@/lib/labels";

const typeOptions = labelOptions(customerTypeLabels);

const NEW_CDD_ROUTE: Record<CustomerType, string> = {
  KORPORASI: "/cdd/new/korporasi",
  PERORANGAN: "/cdd/new/perorangan",
  LEGAL_ARRANGEMENT: "/cdd/new/perikatan-lainnya",
};

export function ScanUploadPanel() {
  const router = useRouter();
  const formTypeId = useId();
  const fileId = useId();
  const [formType, setFormType] = useState<CustomerType | "">("");
  const [fileName, setFileName] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!formType) {
      setError("Pilih jenis CDD terlebih dahulu.");
      return;
    }
    const fd = new FormData(e.currentTarget);
    const file = fd.get("file");
    if (!(file instanceof File) || file.size === 0) {
      setError("Pilih file foto/scan terlebih dahulu.");
      return;
    }

    setSubmitting(true);
    const result = await uploadAndExtractDocument(formType, fd);
    setSubmitting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }
    router.push(`${NEW_CDD_ROUTE[formType]}?draftUploadId=${result.draftUploadId}`);
  }

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">
        Upload Formulir Cetak (OCR)
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        Untuk formulir kertas yang sudah diisi tangan: foto/scan, sistem akan
        mencoba membaca teksnya (OCR lokal) dan mengisi sebagian field
        otomatis. Hasil OCR wajib diperiksa ulang sebelum disimpan — akurasi
        untuk tulisan tangan bisa rendah.
      </p>
      <form onSubmit={handleSubmit} className="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor={formTypeId} className="block text-xs font-medium text-gray-500">
            Jenis CDD
          </label>
          <select
            id={formTypeId}
            value={formType}
            onChange={(e) => setFormType(e.target.value as CustomerType)}
            className="mt-1 rounded border border-gray-300 px-2 py-1.5 text-sm"
          >
            <option value="">-- Pilih --</option>
            {typeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={fileId} className="block text-xs font-medium text-gray-500">
            File Foto/Scan (JPG, PNG, atau WEBP)
          </label>
          <input
            id={fileId}
            name="file"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
            className="mt-1 block text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="btn btn-primary px-4 py-1.5 text-sm"
        >
          {submitting ? "Memproses OCR..." : "Proses OCR & Lanjutkan"}
        </button>
      </form>
      {fileName && !submitting && (
        <p className="mt-2 text-xs text-gray-500">File dipilih: {fileName}</p>
      )}
      {submitting && (
        <p role="status" className="mt-2 text-xs text-gray-500">
          Membaca teks dari gambar, mohon tunggu — proses ini bisa memakan
          waktu beberapa detik.
        </p>
      )}
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </section>
  );
}
