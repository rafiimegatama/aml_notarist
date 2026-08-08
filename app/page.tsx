import Link from "next/link";
import {
  Archive,
  BookOpen,
  BrainCircuit,
  ChevronRight,
  Eye,
  FileCheck2,
  FilePlus2,
  ScanLine,
  Search,
  ShieldAlert,
  ShieldQuestion,
  SlidersHorizontal,
  TriangleAlert,
  Users,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";
import {
  CustomerType,
  CustomerStatus,
  RiskCategory,
} from "@/lib/generated/prisma/enums";
import {
  customerTypeLabels,
  customerStatusLabels,
  riskCategoryLabels,
  labelOptions,
} from "@/lib/labels";
import { formatDate } from "@/components/detail/DetailPrimitives";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { HeroBanner } from "@/components/dashboard/HeroBanner";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { RiskChart } from "@/components/dashboard/RiskChart";
import { RiskDonut } from "@/components/dashboard/RiskDonut";
import { RiskByTypeChart } from "@/components/dashboard/RiskByTypeChart";
import { ActivityTimeline } from "@/components/dashboard/ActivityTimeline";
import { QuickActionCard } from "@/components/dashboard/QuickActionCard";
import { DashboardUtilityDial } from "@/components/dashboard/DashboardUtilityDial";
import {
  computeCompletionBreakdown,
  STATUS_QUERY_INCLUDE,
  type CompletionBreakdown,
} from "@/lib/status";
import { isReviewOverdue } from "@/lib/reviewReminder";
import { greetingForTime } from "@/lib/greeting";
import { getHeroBannerSettings } from "@/lib/actions/heroSettings";
import {
  getDashboardKpis,
  getPendingTasks,
  getRecentActivityFeed,
  getRiskByCustomerType,
  getRiskDistribution,
  getRiskTrend,
  getSystemHealth,
} from "@/lib/dashboard";

const typeOptions = labelOptions(customerTypeLabels);
const statusOptions = labelOptions(customerStatusLabels);
const riskCategoryOptions = labelOptions(riskCategoryLabels);

const RISK_TONE: Record<RiskCategory, BadgeTone> = {
  TINGGI: "danger",
  SEDANG: "warning",
  RENDAH: "success",
};

function firstOrUndefined(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

// FR-4 — dipakai untuk tooltip "Menunggu: ..." di baris DRAFT pada dashboard.
function missingSectionsLabel(breakdown: CompletionBreakdown): string {
  const missing: string[] = [];
  if (breakdown.cddDasar !== "filled") missing.push("CDD Dasar");
  if (breakdown.powerOfAttorney === "not_filled") missing.push("Kuasa Korporasi");
  if (breakdown.notaryService !== "filled") missing.push("Info Jasa Notaris");
  if (breakdown.riskAssessment !== "scored") missing.push("Risk Assessment");
  if (breakdown.edd === "required_not_filled") missing.push("EDD");
  if (breakdown.edd === "manual_required") missing.push("EDD (proses manual di luar aplikasi)");
  return missing.length ? `Menunggu: ${missing.join(", ")}` : "";
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const q = firstOrUndefined(sp.q)?.trim() || undefined;
  const type = firstOrUndefined(sp.type) || undefined;
  const status = firstOrUndefined(sp.status) || undefined;
  const riskCategory = firstOrUndefined(sp.riskCategory) || undefined;
  const dateFrom = firstOrUndefined(sp.dateFrom) || undefined;
  const dateTo = firstOrUndefined(sp.dateTo) || undefined;
  const reviewOverdue = firstOrUndefined(sp.reviewOverdue) === "1";
  const ltkm = firstOrUndefined(sp.ltkm) === "1";

  const where: Prisma.CustomerWhereInput = {};
  if (ltkm) {
    where.isLtkm = true;
  }
  if (type && (Object.values(CustomerType) as string[]).includes(type)) {
    where.type = type as CustomerType;
  }
  if (status && (Object.values(CustomerStatus) as string[]).includes(status)) {
    where.status = status as CustomerStatus;
  }
  if (
    riskCategory &&
    (Object.values(RiskCategory) as string[]).includes(riskCategory)
  ) {
    where.riskAssessment = { riskCategory: riskCategory as RiskCategory };
  }
  const validDateFrom = dateFrom && !Number.isNaN(Date.parse(dateFrom)) ? dateFrom : undefined;
  const validDateTo = dateTo && !Number.isNaN(Date.parse(dateTo)) ? dateTo : undefined;
  if (validDateFrom || validDateTo) {
    where.createdAt = {
      gte: validDateFrom ? new Date(validDateFrom) : undefined,
      lte: validDateTo ? new Date(`${validDateTo}T23:59:59.999`) : undefined,
    };
  }
  if (q) {
    // Cakupan pencarian: nama (semua 3 tipe CDD) + nomor identitas + NPWP —
    // field-field ini sudah ber-index (lihat prisma/schema.prisma), jadi
    // tetap murah walau dicocokkan lintas beberapa kolom sekaligus.
    where.OR = [
      { corporateDetail: { namaKorporasi: { contains: q } } },
      { corporateDetail: { npwp: { contains: q } } },
      { individualDetail: { namaLengkap: { contains: q } } },
      { individualDetail: { noIdentitas: { contains: q } } },
      { individualDetail: { npwp: { contains: q } } },
      { legalArrangementDetail: { nama: { contains: q } } },
      { legalArrangementDetail: { noIdentitas: { contains: q } } },
    ];
  }

  const [
    customersFetched,
    heroSettings,
    kpis,
    riskTrend,
    riskDistribution,
    riskByType,
    activityFeed,
    pendingTasks,
    systemHealth,
  ] = await Promise.all([
    prisma.customer.findMany({ where, include: STATUS_QUERY_INCLUDE, orderBy: { createdAt: "desc" } }),
    getHeroBannerSettings(),
    getDashboardKpis(),
    getRiskTrend(90),
    getRiskDistribution(),
    getRiskByCustomerType(),
    getRecentActivityFeed(10),
    getPendingTasks(),
    getSystemHealth(),
  ]);

  // FR-7 — "jatuh tempo tinjau ulang" adalah nilai turunan (bukan kolom
  // tersimpan), jadi difilter di memori dari data yang sudah di-fetch, sama
  // seperti pola di app/admin/retensi/page.tsx untuk kasus analogous (retensi).
  const now = new Date();
  const customers = reviewOverdue
    ? customersFetched.filter((c) =>
        isReviewOverdue(
          c.lastReviewedAt ?? c.createdAt,
          c.riskAssessment?.riskCategory ?? null,
          now
        )
      )
    : customersFetched;

  const hasFilters = !!(
    q ||
    type ||
    status ||
    riskCategory ||
    dateFrom ||
    dateTo ||
    reviewOverdue ||
    ltkm
  );
  const hasAdvancedFilters = !!(dateFrom || dateTo || reviewOverdue || ltkm);
  const ltkmCount = customersFetched.filter((c) => c.isLtkm).length;

  return (
    <div className="space-y-8">
      <HeroBanner
        imageUrl={heroSettings.enabled && heroSettings.filename ? "/api/hero-image" : null}
        greeting={greetingForTime(now)}
        subtitle="Kelola kepatuhan AML secara efisien hari ini."
        searchDefaultValue={q ?? ""}
      />

      {/* ============ KPI Cards ============ */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <DashboardCard
          icon={Users}
          label="CDD Hari Ini"
          value={kpis.todayCdd}
          tone="brand"
          trend={{
            direction: kpis.todayCdd > kpis.todayCddYesterday ? "up" : kpis.todayCdd < kpis.todayCddYesterday ? "down" : "flat",
            label: `${kpis.todayCddYesterday} kemarin`,
          }}
        />
        <DashboardCard icon={FileCheck2} label="Menunggu Review" value={kpis.pendingReview} tone="warning" href="/?status=DRAFT" />
        <DashboardCard icon={ShieldQuestion} label="EDD Diperlukan" value={kpis.eddRequired} tone="danger" href="/cases?status=EDD_REQUIRED" />
        <DashboardCard icon={ShieldAlert} label="Klien Risiko Tinggi" value={kpis.highRiskClients} tone="danger" href="/?riskCategory=TINGGI" />
        <DashboardCard icon={FilePlus2} label="Dokumen Hari Ini" value={kpis.documentsToday} tone="brand" />
        <DashboardCard icon={ScanLine} label="OCR Hari Ini" value={kpis.recentOcr} tone="success" />
      </div>

      {/* ============ Risk Visualization ============ */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RiskChart data={riskTrend} />
        </div>
        <RiskDonut distribution={riskDistribution} />
      </div>

      <RiskByTypeChart data={riskByType} />

      {/* ============ Recent Activity ============ */}
      <ActivityTimeline items={activityFeed} />

      {/* ============ Quick Actions ============ */}
      <div>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">Aksi Cepat</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <QuickActionCard icon={Users} label="CDD Perorangan Baru" description="Mulai formulir CDD individu" href="/cdd/new/perorangan" />
          <QuickActionCard icon={FilePlus2} label="CDD Korporasi Baru" description="Mulai formulir CDD badan usaha" href="/cdd/new/korporasi" />
          <QuickActionCard icon={ScanLine} label="Unggah Dokumen" description="Scan formulir cetak untuk OCR" href="#upload-ocr" />
          <QuickActionCard icon={Archive} label="Jalankan Backup" description="Backup manual dev.db + dokumen" href="/admin/backup" />
          <QuickActionCard icon={BookOpen} label="Referensi Data" description="Kelola tabel skor risiko" href="/admin/referensi" />
          <QuickActionCard icon={BrainCircuit} label="AI Processing" description="Konfigurasi provider AI" href="/admin/ai-processing" />
        </div>
      </div>

      {ltkmCount > 0 && (
        <Link
          href="/admin/ltkm"
          className="card card-hover flex items-center gap-3 border-danger-subtle bg-danger-subtle/40 p-4 text-sm font-semibold text-[#b91c1c]"
        >
          <TriangleAlert className="h-4 w-4 shrink-0" strokeWidth={2} />
          {ltkmCount} pengguna jasa ditandai LTKM &mdash; lihat Laporan LTKM
          <ChevronRight className="ml-auto h-4 w-4 shrink-0" strokeWidth={2} />
        </Link>
      )}

      <DashboardUtilityDial pendingTasks={pendingTasks} systemHealth={systemHealth} />

      <form method="get" className="card space-y-5 p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
          <div className="sm:col-span-2">
            <label htmlFor="q" className="block text-xs font-semibold text-muted">
              Cari nama / NIK / NPWP
            </label>
            <div className="relative mt-1.5">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={2} />
              <input
                id="q"
                name="q"
                defaultValue={q ?? ""}
                placeholder="Nama, NIK, paspor, NPWP... (Ctrl+K)"
                className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3.5 text-sm shadow-soft-sm transition-colors placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
              />
            </div>
          </div>
          <div>
            <label htmlFor="type" className="block text-xs font-semibold text-muted">
              Tipe
            </label>
            <select
              id="type"
              name="type"
              defaultValue={type ?? ""}
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm shadow-soft-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
            >
              <option value="">Semua</option>
              {typeOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="riskCategory" className="block text-xs font-semibold text-muted">
              Kategori Risiko
            </label>
            <select
              id="riskCategory"
              name="riskCategory"
              defaultValue={riskCategory ?? ""}
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm shadow-soft-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
            >
              <option value="">Semua</option>
              {riskCategoryOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="status" className="block text-xs font-semibold text-muted">
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={status ?? ""}
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm shadow-soft-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
            >
              <option value="">Semua</option>
              {statusOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <details className="border-t border-border-subtle pt-4" open={hasAdvancedFilters}>
          <summary className="flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-muted hover:text-slate-700">
            <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={2} />
            Filter Lanjutan
            {hasAdvancedFilters && <span className="text-brand">(aktif)</span>}
          </summary>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-6">
            <div>
              <label htmlFor="dateFrom" className="block text-xs font-semibold text-muted">
                Dari Tanggal
              </label>
              <input
                id="dateFrom"
                name="dateFrom"
                type="date"
                defaultValue={dateFrom ?? ""}
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm shadow-soft-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
              />
            </div>
            <div>
              <label htmlFor="dateTo" className="block text-xs font-semibold text-muted">
                Sampai Tanggal
              </label>
              <input
                id="dateTo"
                name="dateTo"
                type="date"
                defaultValue={dateTo ?? ""}
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm shadow-soft-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
              />
            </div>
            <div className="flex items-end sm:col-span-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  name="reviewOverdue"
                  value="1"
                  defaultChecked={reviewOverdue}
                  className="h-4 w-4 rounded accent-brand"
                />
                Jatuh tempo tinjau ulang (PMPJ)
              </label>
            </div>
            <div className="flex items-end sm:col-span-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  name="ltkm"
                  value="1"
                  defaultChecked={ltkm}
                  className="h-4 w-4 rounded accent-brand"
                />
                Hanya LTKM
              </label>
            </div>
          </div>
        </details>

        <div className="flex items-center gap-3 border-t border-border-subtle pt-4">
          <button type="submit" className="btn btn-primary px-4 py-2 text-sm">
            Terapkan Filter
          </button>
          {hasFilters && (
            <Link href="/" className="btn btn-secondary px-4 py-2 text-sm">
              Reset
            </Link>
          )}
        </div>
      </form>

      {customers.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Search}
            title="Tidak ada CDD yang cocok"
            description={
              hasFilters
                ? "Coba ubah atau reset filter pencarian di atas."
                : "Belum ada data CDD. Mulai dengan membuat CDD baru."
            }
            action={
              hasFilters ? (
                <Link href="/" className="btn btn-secondary px-4 py-2 text-sm">
                  Reset Filter
                </Link>
              ) : (
                <Link href="/cdd/new" className="btn btn-primary px-4 py-2 text-sm">
                  <FilePlus2 className="h-4 w-4" strokeWidth={2} />
                  Buat CDD Baru
                </Link>
              )
            }
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
                  <th className="px-5 py-3.5 font-semibold">Kategori Risiko</th>
                  <th className="px-5 py-3.5 font-semibold">Status</th>
                  <th className="px-5 py-3.5 font-semibold">Tanggal Dibuat</th>
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
                  const category = c.riskAssessment?.riskCategory;
                  return (
                    <tr key={c.id} className="transition-colors hover:bg-slate-50/70">
                      <td className="px-5 py-3.5 font-medium text-slate-900">
                        <div className="flex items-center gap-2">
                          {name}
                          {c.isLtkm && <Badge tone="danger">LTKM</Badge>}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {customerTypeLabels[c.type]}
                      </td>
                      <td className="px-5 py-3.5">
                        {category ? (
                          <Badge tone={RISK_TONE[category]}>{riskCategoryLabels[category]}</Badge>
                        ) : (
                          <span className="text-sm text-slate-400">Belum final</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        {c.status === "COMPLETE" ? (
                          <Badge tone="success">{customerStatusLabels[c.status]}</Badge>
                        ) : (
                          <span title={missingSectionsLabel(computeCompletionBreakdown(c))}>
                            <Badge tone="warning" className="decoration-dotted">
                              {customerStatusLabels[c.status]}
                            </Badge>
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 tabular-nums text-muted">
                        {formatDate(c.createdAt)}
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
