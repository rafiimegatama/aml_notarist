"use client";

import { useState, useTransition } from "react";
import { RefreshCw, CheckCircle2 } from "lucide-react";
import {
  syncAllDetailTabsToSheet,
  type FullSyncResult,
} from "@/lib/actions/sheetsFullSync";

const TAB_LABELS: Record<string, string> = {
  CDD_Perorangan: "CDD Perorangan",
  CDD_Korporasi: "CDD Korporasi",
  CDD_PerikatanLainnya: "CDD Perikatan Lainnya",
  BeneficialOwners: "Pemilik Manfaat (BO)",
  KuasaKorporasi: "Kuasa Korporasi",
  PihakPerikatan: "Pihak Perikatan",
  RiskAssessment: "Risk Assessment",
  EDD_BerisikoTinggi: "EDD Berisiko Tinggi",
  ActivityLog: "Riwayat Aktivitas",
  Referensi_Skor: "Referensi Skor",
};

export function SheetsFullSyncPanel() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<FullSyncResult | null>(null);

  function handleClick() {
    setResult(null);
    startTransition(async () => {
      setResult(await syncAllDetailTabsToSheet());
    });
  }

  return (
    <section className="card p-6 sm:p-7">
      <div className="flex items-start gap-3.5">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-subtle text-brand-hover">
          <RefreshCw className="h-[18px] w-[18px]" strokeWidth={2} />
        </span>
        <div>
          <h2 className="text-base font-bold text-slate-900 sm:text-lg">
            Sinkron Penuh Tab Detail Google Sheet
          </h2>
          <p className="mt-1 text-sm font-medium text-muted">
            Menulis ulang seluruh tab detail (CDD per jenis, Pemilik Manfaat,
            Risk Assessment, EDD, Riwayat Aktivitas, Referensi Skor) dari data
            saat ini — bukan cuma tab ringkasan &quot;Notary_AML&quot; yang
            sudah sinkron otomatis tiap CDD selesai. Jalankan ini setelah
            mengedit data dalam jumlah banyak, atau kalau tab detail belum
            pernah dibuat.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="btn btn-primary mt-4 px-4 py-2.5 text-sm disabled:opacity-50"
      >
        <RefreshCw
          className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`}
          strokeWidth={2}
        />
        {isPending ? "Menyinkronkan..." : "Sinkron Semua Tab Detail Sekarang"}
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
        <div
          role="status"
          className="mt-4 rounded-xl border border-success-subtle bg-success-subtle/40 px-3.5 py-2.5 text-sm font-medium text-[#15803d]"
        >
          <p className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 shrink-0" strokeWidth={2} />
            Sinkron berhasil. Jumlah baris per tab:
          </p>
          <ul className="mt-2 list-inside list-disc space-y-0.5 text-slate-700">
            {Object.entries(result.counts).map(([tab, count]) => (
              <li key={tab}>
                {TAB_LABELS[tab] ?? tab}: <span className="font-semibold">{count}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
