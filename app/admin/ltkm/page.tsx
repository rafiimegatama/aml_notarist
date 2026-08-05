import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { customerTypeLabels } from "@/lib/labels";
import { formatDate } from "@/components/detail/DetailPrimitives";

export const metadata: Metadata = {
  title: "Laporan LTKM",
};

/**
 * FR-8 baseline — daftar Customer yang ditandai LTKM (Laporan Transaksi
 * Keuangan Mencurigakan), untuk membantu notaris menyiapkan submission
 * goAML manual ke PPATK. Bukan integrasi goAML otomatis (lihat FR-10,
 * sengaja di luar cakupan) — murni laporan untuk ditinjau manual.
 */
export default async function AdminLtkmPage() {
  const customers = await prisma.customer.findMany({
    where: { isLtkm: true },
    include: {
      corporateDetail: true,
      individualDetail: true,
      legalArrangementDetail: true,
    },
    // ltkmFlaggedAt nulls (legacy rows flagged before this column existed)
    // sort after dated rows in SQLite's default null-ordering for desc.
    orderBy: { ltkmFlaggedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Laporan LTKM</h1>
          <p className="mt-1 text-sm text-gray-500">
            FR-8 — daftar pengguna jasa yang ditandai sebagai Laporan
            Transaksi Keuangan Mencurigakan (LTKM). Bukan integrasi goAML
            otomatis (lihat FR-10) — laporan ini untuk membantu menyiapkan
            submission manual ke PPATK.
          </p>
        </div>
        <a
          href="/api/ltkm-export"
          className="btn btn-primary shrink-0 px-4 py-2 text-sm"
        >
          Export CSV
        </a>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-gray-500">
              <th className="px-4 py-3 font-medium">Nama</th>
              <th className="px-4 py-3 font-medium">Tipe</th>
              <th className="px-4 py-3 font-medium">Tanggal Ditandai</th>
              <th className="px-4 py-3 font-medium">Catatan</th>
              <th className="px-4 py-3 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => {
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
                    {c.ltkmFlaggedAt ? (
                      formatDate(c.ltkmFlaggedAt)
                    ) : (
                      <span className="text-gray-400" title="Ditandai sebelum kolom tanggal ini ada">
                        Tidak diketahui
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-pre-wrap text-gray-700">
                    {c.ltkmNotes || <span className="text-gray-400">—</span>}
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
            {customers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                  Belum ada CDD yang ditandai LTKM.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
