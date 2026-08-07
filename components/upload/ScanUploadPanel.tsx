"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ScanLine } from "lucide-react";
import { uploadAndExtractDocument } from "@/lib/actions/document";
import { CustomerType } from "@/lib/generated/prisma/enums";
import { customerTypeLabels, labelOptions } from "@/lib/labels";
import { Dropzone } from "@/components/ui/dropzone";
import { FileCard } from "@/components/ui/file-card";
import { UploadPreviewModal } from "@/components/ui/upload-preview";
import type { UploadState } from "@/components/ui/upload-status";

const typeOptions = labelOptions(customerTypeLabels);

const NEW_CDD_ROUTE: Record<CustomerType, string> = {
  KORPORASI: "/cdd/new/korporasi",
  PERORANGAN: "/cdd/new/perorangan",
  LEGAL_ARRANGEMENT: "/cdd/new/perikatan-lainnya",
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ScanUploadPanel() {
  const router = useRouter();
  const formTypeId = useId();
  const [formType, setFormType] = useState<CustomerType | "">("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const previewUrl = useMemo(
    () => (selectedFile ? URL.createObjectURL(selectedFile) : null),
    [selectedFile]
  );
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function handleFilesSelected(files: File[]) {
    setError(null);
    setSucceeded(false);
    setSelectedFile(files[0] ?? null);
  }

  function handleRemoveFile() {
    setSelectedFile(null);
    setError(null);
    setSucceeded(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!formType) {
      setError("Pilih jenis CDD terlebih dahulu.");
      return;
    }
    if (!selectedFile || selectedFile.size === 0) {
      setError("Pilih file foto/scan terlebih dahulu.");
      return;
    }

    const fd = new FormData();
    fd.append("file", selectedFile);

    setSubmitting(true);
    const result = await uploadAndExtractDocument(formType, fd);
    setSubmitting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }
    setSucceeded(true);
    router.push(`${NEW_CDD_ROUTE[formType]}?draftUploadId=${result.draftUploadId}`);
  }

  let cardStatus: UploadState = "idle";
  if (submitting) cardStatus = "processing-ocr";
  else if (error) cardStatus = "error";
  else if (succeeded) cardStatus = "success";

  const cardStatusLabel =
    cardStatus === "processing-ocr"
      ? "Membaca teks dari gambar, mohon tunggu — proses ini bisa memakan waktu beberapa detik."
      : undefined;

  return (
    <section className="card p-6">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-subtle text-brand-hover">
          <ScanLine className="h-[18px] w-[18px]" strokeWidth={2} />
        </span>
        <div>
          <h2 className="text-base font-bold text-slate-900 sm:text-lg">
            Upload Formulir Cetak (OCR)
          </h2>
          <p className="mt-1 text-sm font-medium text-muted">
            Untuk formulir kertas yang sudah diisi tangan: foto/scan, sistem akan
            mencoba membaca teksnya (OCR lokal) dan mengisi sebagian field
            otomatis. Hasil OCR wajib diperiksa ulang sebelum disimpan — akurasi
            untuk tulisan tangan bisa rendah.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
        <div className="max-w-xs">
          <label htmlFor={formTypeId} className="block text-xs font-semibold text-muted">
            Jenis CDD
          </label>
          <select
            id={formTypeId}
            value={formType}
            onChange={(e) => setFormType(e.target.value as CustomerType)}
            className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm shadow-soft-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 focus-visible:border-brand"
          >
            <option value="">-- Pilih --</option>
            {typeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {selectedFile ? (
          <FileCard
            fileName={selectedFile.name}
            extLabel={selectedFile.name.split(".").pop() ?? ""}
            sizeLabel={formatFileSize(selectedFile.size)}
            isImage={selectedFile.type.startsWith("image/")}
            thumbnailSrc={previewUrl ?? undefined}
            status={cardStatus}
            statusLabel={cardStatusLabel}
            errorMessage={error ?? undefined}
            onPreview={previewUrl ? () => setPreviewOpen(true) : undefined}
            onDelete={submitting ? undefined : handleRemoveFile}
          />
        ) : (
          <Dropzone
            name="file"
            accept="image/jpeg,image/png,image/webp"
            onFilesSelected={handleFilesSelected}
            formatBadges={["JPG", "PNG", "WEBP"]}
            maxSizeLabel="Maks 15MB"
            label="Drag & drop file foto/scan di sini"
            description="atau klik untuk memilih dari komputer"
            ariaLabel="File foto/scan formulir cetak (JPG, PNG, atau WEBP)"
          />
        )}

        {error && !selectedFile && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <div>
          <button
            type="submit"
            disabled={submitting || !selectedFile}
            className="btn btn-primary px-4 py-1.5 text-sm"
          >
            {submitting ? "Memproses OCR..." : "Proses OCR & Lanjutkan"}
          </button>
        </div>
      </form>

      {previewUrl && (
        <UploadPreviewModal
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          src={previewUrl}
          fileName={selectedFile?.name ?? ""}
        />
      )}
    </section>
  );
}
