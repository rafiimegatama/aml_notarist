import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { customerTypeLabels } from "@/lib/labels";
import { formatDate } from "@/components/detail/DetailPrimitives";
import {
  getRetentionReviewDate,
  isPastRetentionReviewDate,
  RETENTION_YEARS,
} from "@/lib/retention";

export const metadata: Metadata = {
  title: "Retensi Data",
};

/**
 * FR-5 baseline — laporan "tandai yang lewat tanggal tinjau retensi", bukan
 * penghapusan otomatis (PRD FR-5 poin 4: keputusan hapus harus manual &
 * bisa diaudit, tidak boleh dijalankan diam-diam oleh sistem).
 */
export default async function AdminRetensiPage() {
  const customers = await prisma.customer.findMany({
    include: {
      corporateDetail: true,
      individualDetail: true,
      legalArrangementDetail: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const now = new Date();
  const overdue = customers.filter((c) =>
    isPastRetentionReviewDate(c.createdAt, now)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Retensi Data</h1>
        <p className="mt-1 text-sm text-gray-500">
          FR-5 — daftar CDD yang sudah lewat tanggal tinjau retensi (asumsi{" "}
          {RETENTION_YEARS} tahun sejak dibuat, lihat catatan di{" "}
          <code>lib/retention.ts</code> — konfirmasi ke penasihat hukum
          sebelum dijadikan acuan resmi). Ini laporan untuk ditinjau manual,
          bukan penghapusan otomatis.
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-gray-500">
              <th className="px-4 py-3 font-medium">Nama</th>
              <th className="px-4 py-3 font-medium">Tipe</th>
              <th className="px-4 py-3 font-medium">Dibuat</th>
              <th className="px-4 py-3 font-medium">Tinjau Retensi Sejak</th>
              <th className="px-4 py-3 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {overdue.map((c) => {
              const name =
                c.corporateDetail?.namaKorporasi ??
                c.individualDetail?.namaLengkap ??
                c.legalArrangementDetail?.nama ??
                "(tanpa nama)";
              return (
                <tr key={c.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-3 text-gray-900">{name}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {customerTypeLabels[c.type]}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {formatDate(c.createdAt)}
                  </td>
                  <td className="px-4 py-3 font-medium text-red-700">
                    {formatDate(getRetentionReviewDate(c.createdAt))}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/cdd/${c.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      Lihat Detail
                    </Link>
                  </td>
                </tr>
              );
            })}
            {overdue.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                  Belum ada CDD yang lewat tanggal tinjau retensi.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
