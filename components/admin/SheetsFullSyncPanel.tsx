"use client";

import { useState, useTransition } from "react";
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
    <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">
        Sinkron Penuh Tab Detail Google Sheet
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        Menulis ulang seluruh tab detail (CDD per jenis, Pemilik Manfaat,
        Risk Assessment, EDD, Riwayat Aktivitas, Referensi Skor) dari data
        saat ini — bukan cuma tab ringkasan &quot;Notary_AML&quot; yang sudah
        sinkron otomatis tiap CDD selesai. Jalankan ini setelah mengedit data
        dalam jumlah banyak, atau kalau tab detail belum pernah dibuat.
      </p>

      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
      >
        {isPending ? "Menyinkronkan..." : "Sinkron Semua Tab Detail Sekarang"}
      </button>

      {result && !result.success && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {result.error}
        </p>
      )}
      {result?.success && (
        <div className="mt-3 text-sm text-green-700">
          <p>Sinkron berhasil. Jumlah baris per tab:</p>
          <ul className="mt-1 list-inside list-disc text-gray-700">
            {Object.entries(result.counts).map(([tab, count]) => (
              <li key={tab}>
                {TAB_LABELS[tab] ?? tab}: <span className="font-medium">{count}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
