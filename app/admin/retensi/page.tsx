import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Eye } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { customerTypeLabels } from "@/lib/labels";
import { formatDate } from "@/components/detail/DetailPrimitives";
import {
  getRetentionReviewDate,
  isPastRetentionReviewDate,
  RETENTION_YEARS,
} from "@/lib/retention";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { RetentionDeleteButton } from "@/components/admin/RetentionDeleteButton";

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
    <div className="space-y-8">
      <PageHeader
        title="Retensi Data"
        description={`FR-5 — daftar CDD yang sudah lewat tanggal tinjau retensi (asumsi ${RETENTION_YEARS} tahun sejak dibuat, lihat catatan di lib/retention.ts — konfirmasi ke penasihat hukum sebelum dijadikan acuan resmi). Ini laporan untuk ditinjau manual, bukan penghapusan otomatis.`}
        icon={Clock}
      />

      {overdue.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Clock}
            title="Belum ada CDD yang lewat tanggal tinjau retensi"
            description="Semua CDD masih dalam periode retensi. Laporan ini akan terisi otomatis begitu ada yang lewat tanggal tinjau."
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
                  <th className="px-5 py-3.5 font-semibold">Dibuat</th>
                  <th className="px-5 py-3.5 font-semibold">Tinjau Retensi Sejak</th>
                  <th className="px-5 py-3.5 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {overdue.map((c) => {
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
                        {formatDate(c.createdAt)}
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge tone="danger">
                          {formatDate(getRetentionReviewDate(c.createdAt))}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/cdd/${c.id}`}
                            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-brand-hover transition-colors hover:bg-brand-subtle"
                          >
                            <Eye className="h-4 w-4" strokeWidth={2} />
                            Lihat
                          </Link>
                          <RetentionDeleteButton
                            customerId={c.id}
                            customerName={name}
                          />
                        </div>
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
