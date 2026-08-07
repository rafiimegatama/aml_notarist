"use client";

import { useState } from "react";
import { Archive, Download, CheckCircle2 } from "lucide-react";
import { createBackup, type CreateBackupResult } from "@/lib/actions/backup";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";

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
  const { toast } = useToast();
  const [result, setResult] = useState<CreateBackupResult | null>(null);
  const [pending, setPending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function handleBackup() {
    setPending(true);
    const outcome = await createBackup();
    setResult(outcome);
    setPending(false);
    setConfirmOpen(false);
    if (outcome.success) {
      toast({ variant: "success", title: "Backup berhasil dibuat", description: outcome.fileName });
    } else {
      toast({ variant: "error", title: "Backup gagal", description: outcome.error });
    }
  }

  const lastBackupAt = result?.success
    ? result.createdAt
    : initialLastBackup?.lastManualBackupAt;

  return (
    <section className="card p-6 sm:p-7">
      <div className="flex items-start gap-3.5">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-subtle text-brand-hover">
          <Archive className="h-[18px] w-[18px]" strokeWidth={2} />
        </span>
        <div>
          <h2 className="text-base font-bold text-slate-900 sm:text-lg">
            Backup Manual (Database + Scan Dokumen)
          </h2>
          <p className="mt-1 text-sm font-medium text-muted">
            Membuat satu file .zip berisi seluruh database (dev.db) dan file
            scan/foto yang sudah diupload (storage/uploads/). Simpan file ini
            di lokasi terpisah dari PC ini (flashdisk, HDD eksternal, dsb).
          </p>
        </div>
      </div>

      <p className="mt-4 text-sm font-medium text-slate-700">
        Backup manual terakhir:{" "}
        <span className="font-semibold text-slate-900">
          {lastBackupAt ? formatDateTime(lastBackupAt) : "belum pernah"}
        </span>
      </p>

      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        disabled={pending}
        className="btn btn-primary mt-4 px-4 py-2.5 text-sm disabled:opacity-50"
      >
        <Archive className="h-4 w-4" strokeWidth={2} />
        {pending ? "Membuat backup..." : "Backup Now"}
      </button>

      {result && !result.success && (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-danger-subtle bg-danger-subtle/40 px-3.5 py-2.5 text-sm font-medium text-[#b91c1c]"
        >
          {result.error}
        </p>
      )}
      {result?.success && (
        <p
          role="status"
          className="mt-4 flex flex-wrap items-center gap-1.5 rounded-xl border border-success-subtle bg-success-subtle/40 px-3.5 py-2.5 text-sm font-medium text-[#15803d]"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" strokeWidth={2} />
          Backup berhasil dibuat.
          <a
            href={`/api/backup/${result.fileName}`}
            className="inline-flex items-center gap-1 font-semibold underline"
          >
            <Download className="h-3.5 w-3.5" strokeWidth={2} />
            Unduh {result.fileName}
          </a>
        </p>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Buat backup sekarang?"
        description="Menyalin seluruh database dan dokumen ke satu file .zip. Bisa memakan waktu beberapa detik tergantung jumlah data."
        confirmLabel="Backup Now"
        tone="default"
        pending={pending}
        onConfirm={handleBackup}
        onCancel={() => setConfirmOpen(false)}
      />
    </section>
  );
}
