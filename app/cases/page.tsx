import type { Metadata } from "next";
import Link from "next/link";
import { Eye, Fingerprint } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/components/detail/DetailPrimitives";
import { listCases } from "@/lib/actions/case";
import { customerTypeLabels } from "@/lib/labels";
import { CaseStatus } from "@/lib/generated/prisma/enums";

export const metadata: Metadata = { title: "Cases — AML Case Management" };

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft",
  OCR_PROCESSING: "Proses OCR",
  RISK_ASSESSMENT: "Risk Assessment",
  NEED_REVIEW: "Perlu Ditinjau",
  EDD_REQUIRED: "EDD Diperlukan",
  EDD_IN_PROGRESS: "EDD Berlangsung",
  WAITING_MANUAL_REVIEW: "Menunggu Tinjauan Manual",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
  ARCHIVED: "Diarsipkan",
};

const STATUS_TONE: Record<string, BadgeTone> = {
  APPROVED: "success",
  REJECTED: "danger",
  ARCHIVED: "neutral",
  WAITING_MANUAL_REVIEW: "brand",
  EDD_REQUIRED: "warning",
  EDD_IN_PROGRESS: "warning",
};

const STATUS_FILTERS = Object.values(CaseStatus);

function firstOrUndefined(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function CasesListPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const statusParam = firstOrUndefined(sp.status);
  const status = statusParam && (STATUS_FILTERS as string[]).includes(statusParam) ? (statusParam as CaseStatus) : undefined;

  const cases = await listCases(status);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Cases"
        description="Setiap pengguna jasa berisiko Tinggi otomatis menjadi Case AML — dari EDD sampai keputusan akhir."
        icon={Fingerprint}
      />

      <div className="flex flex-wrap gap-2">
        <Link href="/cases" className={`badge ${!status ? "badge-brand" : "badge-neutral"}`}>
          Semua
        </Link>
        {STATUS_FILTERS.map((s) => (
          <Link key={s} href={`/cases?status=${s}`} className={`badge ${status === s ? "badge-brand" : "badge-neutral"}`}>
            {STATUS_LABEL[s]}
          </Link>
        ))}
      </div>

      {cases.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Fingerprint}
            title="Belum ada Case"
            description="Case dibuat otomatis begitu Risk Assessment sebuah CDD menghasilkan kategori Tinggi."
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
                  <th className="px-5 py-3.5 font-semibold">Status</th>
                  <th className="px-5 py-3.5 font-semibold">Diperbarui</th>
                  <th className="px-5 py-3.5 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {cases.map((c) => {
                  const name =
                    c.customer.corporateDetail?.namaKorporasi ??
                    c.customer.individualDetail?.namaLengkap ??
                    c.customer.legalArrangementDetail?.nama ??
                    "(tanpa nama)";
                  return (
                    <tr key={c.id} className="transition-colors hover:bg-slate-50/70">
                      <td className="px-5 py-3.5 font-medium text-slate-900">{name}</td>
                      <td className="px-5 py-3.5 text-slate-600">{customerTypeLabels[c.customer.type]}</td>
                      <td className="px-5 py-3.5">
                        <Badge tone={STATUS_TONE[c.status] ?? "neutral"}>{STATUS_LABEL[c.status]}</Badge>
                      </td>
                      <td className="px-5 py-3.5 tabular-nums text-muted">{formatDate(c.updatedAt)}</td>
                      <td className="px-5 py-3.5 text-right">
                        <Link
                          href={`/cases/${c.id}`}
                          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-brand-hover transition-colors hover:bg-brand-subtle"
                        >
                          <Eye className="h-4 w-4" strokeWidth={2} />
                          Buka Case
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
