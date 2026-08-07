import type { Metadata } from "next";
import Link from "next/link";
import { TriangleAlert, Download, Eye, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { customerTypeLabels } from "@/lib/labels";
import { formatDate } from "@/components/detail/DetailPrimitives";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";

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
    <div className="space-y-8">
      <PageHeader
        title="Laporan LTKM"
        description="FR-8 — daftar pengguna jasa yang ditandai sebagai Laporan Transaksi Keuangan Mencurigakan (LTKM). Bukan integrasi goAML otomatis (lihat FR-10) — laporan ini untuk membantu menyiapkan submission manual ke PPATK."
        icon={TriangleAlert}
        actions={
          <a
            href="/api/ltkm-export"
            className="btn btn-primary px-4 py-2.5 text-sm"
          >
            <Download className="h-4 w-4" strokeWidth={2} />
            Export CSV
          </a>
        }
      />

      {customers.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={ShieldCheck}
            title="Belum ada CDD yang ditandai LTKM"
            description="Pengguna jasa yang ditandai LTKM dari halaman detail CDD akan muncul di sini."
          />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border-subtle bg-slate-50/70 text-muted">
                  <th className="px-5 py-3.5 font-semibold">Nama</th>
                  <th className="px-5 py-3.5 font-semibold">Tipe</th>
                  <th className="px-5 py-3.5 font-semibold">Tanggal Ditandai</th>
                  <th className="px-5 py-3.5 font-semibold">Catatan</th>
                  <th className="px-5 py-3.5 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {customers.map((c) => {
                  const name =
                    c.corporateDetail?.namaKorporasi ??
                    c.individualDetail?.namaLengkap ??
                    c.legalArrangementDetail?.nama ??
                    "(tanpa nama)";
                  return (
                    <tr key={c.id} className="transition-colors hover:bg-slate-50/70">
                      <td className="px-5 py-3.5 font-medium text-slate-900">{name}</td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {customerTypeLabels[c.type]}
                      </td>
                      <td className="px-5 py-3.5 tabular-nums text-muted">
                        {c.ltkmFlaggedAt ? (
                          formatDate(c.ltkmFlaggedAt)
                        ) : (
                          <span
                            className="text-slate-400"
                            title="Ditandai sebelum kolom tanggal ini ada"
                          >
                            Tidak diketahui
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 whitespace-pre-wrap text-slate-600">
                        {c.ltkmNotes || <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link
                          href={`/cdd/${c.id}`}
                          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-brand-hover transition-colors hover:bg-brand-subtle"
                        >
                          <Eye className="h-4 w-4" strokeWidth={2} />
                          Lihat Detail
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
