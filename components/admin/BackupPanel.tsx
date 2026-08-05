"use client";

import { useState } from "react";
import { createBackup, type CreateBackupResult } from "@/lib/actions/backup";

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function BackupPanel({
  initialLastBackup,
}: {
  initialLastBackup: { lastManualBackupAt: string; fileName: string } | null;
}) {
  const [result, setResult] = useState<CreateBackupResult | null>(null);
  const [pending, setPending] = useState(false);

  async function handleBackup() {
    setPending(true);
    setResult(await createBackup());
    setPending(false);
  }

  const lastBackupAt = result?.success
    ? result.createdAt
    : initialLastBackup?.lastManualBackupAt;

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">
        Backup Manual (Database + Scan Dokumen)
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        Membuat satu file .zip berisi seluruh database (dev.db) dan file
        scan/foto yang sudah diupload (storage/uploads/). Simpan file ini di
        lokasi terpisah dari PC ini (flashdisk, HDD eksternal, dsb).
      </p>

      <p className="mt-3 text-sm text-gray-600">
        Backup manual terakhir:{" "}
        <span className="font-medium">
          {lastBackupAt ? formatDateTime(lastBackupAt) : "belum pernah"}
        </span>
      </p>

      <button
        type="button"
        onClick={handleBackup}
        disabled={pending}
        className="btn btn-primary mt-4 px-4 py-2 text-sm"
      >
        {pending ? "Membuat backup..." : "Backup Now"}
      </button>

      {result && !result.success && (
        <p role="alert" className="mt-3 text-sm text-red-600">{result.error}</p>
      )}
      {result?.success && (
        <p role="status" className="mt-3 text-sm text-green-700">
          Backup berhasil dibuat.{" "}
          <a
            href={`/api/backup/${result.fileName}`}
            className="font-medium underline"
          >
            Unduh {result.fileName}
          </a>
        </p>
      )}
    </section>
  );
}
