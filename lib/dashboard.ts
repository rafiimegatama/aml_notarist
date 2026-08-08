import { prisma } from "@/lib/prisma";
import { STATUS_QUERY_INCLUDE } from "@/lib/status";
import { isPastRetentionReviewDate } from "@/lib/retention";
import { getBackupChannelsStatus } from "@/lib/actions/backupStatus";
import { getLastBackupInfo } from "@/lib/actions/backup";
import { getDriveConfig } from "@/lib/googleDrive/client";
import { AIProcessingService } from "@/lib/ai/services/ai-processing";
import { customerTypeLabels } from "@/lib/labels";
import type { RiskTrendPoint } from "@/components/dashboard/RiskChart";
import type { RiskDistribution } from "@/components/dashboard/RiskDonut";
import type { RiskByTypePoint } from "@/components/dashboard/RiskByTypeChart";
import type { ActivityFeedItem } from "@/components/dashboard/ActivityTimeline";
import type { SystemHealthStatus } from "@/components/dashboard/SystemStatusCard";

// Semua fungsi di file ini murni BACA (read-only) dari tabel yang sudah ada
// — tidak ada perubahan skema/skoring/logika bisnis, hanya agregasi untuk
// tampilan Dashboard. Rentang waktu dianggap "hari ini"/"kemarin" memakai
// waktu lokal server (aplikasi ini berjalan di komputer kantor notaris
// sendiri — FR-6A, jadi waktu server = waktu kantor).

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function isSameDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

export interface DashboardKpis {
  todayCdd: number;
  todayCddYesterday: number;
  pendingReview: number;
  eddRequired: number;
  highRiskClients: number;
  documentsToday: number;
  recentOcr: number;
}

export async function getDashboardKpis(): Promise<DashboardKpis> {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  const [customers, documentsToday, ocrToday] = await Promise.all([
    prisma.customer.findMany({ include: STATUS_QUERY_INCLUDE }),
    prisma.customerDocument.count({ where: { createdAt: { gte: startOfDay(now) } } }),
    prisma.customerDocument.count({
      where: { createdAt: { gte: startOfDay(now) }, ocrRawText: { not: null } },
    }),
  ]);

  const todayCdd = customers.filter((c) => isSameDay(c.createdAt, now)).length;
  const todayCddYesterday = customers.filter((c) => isSameDay(c.createdAt, yesterday)).length;
  const pendingReview = customers.filter((c) => !c.riskAssessment).length;
  const eddRequired = customers.filter(
    (c) => c.riskAssessment?.riskCategory === "TINGGI" && !c.highRiskAdditionalInfo
  ).length;
  const highRiskClients = customers.filter((c) => c.riskAssessment?.riskCategory === "TINGGI").length;

  return {
    todayCdd,
    todayCddYesterday,
    pendingReview,
    eddRequired,
    highRiskClients,
    documentsToday,
    recentOcr: ocrToday,
  };
}

export async function getRiskTrend(days = 90): Promise<RiskTrendPoint[]> {
  const now = new Date();
  const since = startOfDay(now);
  since.setDate(since.getDate() - (days - 1));

  const customers = await prisma.customer.findMany({
    where: { createdAt: { gte: since } },
    select: { createdAt: true, riskAssessment: { select: { riskCategory: true } } },
  });

  const byDay = new Map<string, { rendah: number; sedang: number; tinggi: number }>();
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    byDay.set(d.toISOString().slice(0, 10), { rendah: 0, sedang: 0, tinggi: 0 });
  }

  for (const c of customers) {
    const key = startOfDay(c.createdAt).toISOString().slice(0, 10);
    const bucket = byDay.get(key);
    if (!bucket) continue;
    const category = c.riskAssessment?.riskCategory;
    if (category === "RENDAH") bucket.rendah += 1;
    else if (category === "SEDANG") bucket.sedang += 1;
    else if (category === "TINGGI") bucket.tinggi += 1;
  }

  return Array.from(byDay.entries()).map(([date, counts]) => ({
    date,
    label: new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short" }).format(new Date(date)),
    ...counts,
  }));
}

export async function getRiskDistribution(): Promise<RiskDistribution> {
  const customers = await prisma.customer.findMany({
    select: { riskAssessment: { select: { riskCategory: true } } },
  });
  const distribution: RiskDistribution = { rendah: 0, sedang: 0, tinggi: 0, belumDinilai: 0 };
  for (const c of customers) {
    const category = c.riskAssessment?.riskCategory;
    if (category === "RENDAH") distribution.rendah += 1;
    else if (category === "SEDANG") distribution.sedang += 1;
    else if (category === "TINGGI") distribution.tinggi += 1;
    else distribution.belumDinilai += 1;
  }
  return distribution;
}

/**
 * Beda dimensi dari getRiskTrend (waktu x kategori risiko, sudah ada di
 * RiskChart) — ini komposisi risiko PER JENIS CUSTOMER (Korporasi/
 * Perorangan/Perikatan Lainnya), buat stacked bar chart baru di dashboard.
 */
export async function getRiskByCustomerType(): Promise<RiskByTypePoint[]> {
  const customers = await prisma.customer.findMany({
    select: { type: true, riskAssessment: { select: { riskCategory: true } } },
  });

  const buckets = {
    PERORANGAN: { rendah: 0, sedang: 0, tinggi: 0, belumDinilai: 0 },
    KORPORASI: { rendah: 0, sedang: 0, tinggi: 0, belumDinilai: 0 },
    LEGAL_ARRANGEMENT: { rendah: 0, sedang: 0, tinggi: 0, belumDinilai: 0 },
  };

  for (const c of customers) {
    const bucket = buckets[c.type];
    const category = c.riskAssessment?.riskCategory;
    if (category === "RENDAH") bucket.rendah += 1;
    else if (category === "SEDANG") bucket.sedang += 1;
    else if (category === "TINGGI") bucket.tinggi += 1;
    else bucket.belumDinilai += 1;
  }

  return (["PERORANGAN", "KORPORASI", "LEGAL_ARRANGEMENT"] as const).map((type) => ({
    type: customerTypeLabels[type],
    ...buckets[type],
  }));
}

export async function getRecentActivityFeed(limit = 12): Promise<ActivityFeedItem[]> {
  const entries = await prisma.activityLogEntry.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      customer: {
        select: {
          corporateDetail: { select: { namaKorporasi: true } },
          individualDetail: { select: { namaLengkap: true } },
          legalArrangementDetail: { select: { nama: true } },
        },
      },
    },
  });

  return entries.map((entry) => ({
    id: entry.id,
    description: entry.description,
    customerId: entry.customerId,
    customerName:
      entry.customer.corporateDetail?.namaKorporasi ??
      entry.customer.individualDetail?.namaLengkap ??
      entry.customer.legalArrangementDetail?.nama ??
      "(tanpa nama)",
    createdAt: entry.createdAt,
  }));
}

export interface PendingTask {
  key: string;
  label: string;
  count: number;
  href: string;
}

export async function getPendingTasks(): Promise<PendingTask[]> {
  const now = new Date();
  const [unattachedDocs, customers, missingDocsCustomers] = await Promise.all([
    prisma.customerDocument.count({ where: { customerId: null } }),
    prisma.customer.findMany({
      select: { id: true, createdAt: true, riskAssessment: { select: { riskCategory: true } }, highRiskAdditionalInfo: { select: { id: true } } },
    }),
    prisma.customer.findMany({
      select: { id: true, _count: { select: { documents: true } } },
    }),
  ]);

  const needRiskReview = customers.filter((c) => !c.riskAssessment).length;
  const eddRequired = customers.filter((c) => c.riskAssessment?.riskCategory === "TINGGI" && !c.highRiskAdditionalInfo).length;
  const missingDocuments = missingDocsCustomers.filter((c) => c._count.documents === 0).length;
  const expiringRetention = customers.filter((c) => isPastRetentionReviewDate(c.createdAt, now)).length;

  return [
    { key: "waitingOcr", label: "Menunggu Ditautkan ke CDD", count: unattachedDocs, href: "/" },
    { key: "needRiskReview", label: "Perlu Risk Assessment", count: needRiskReview, href: "/?status=DRAFT" },
    { key: "eddRequired", label: "EDD Diperlukan", count: eddRequired, href: "/cases?status=EDD_REQUIRED" },
    { key: "missingDocuments", label: "Tanpa Dokumen Terlampir", count: missingDocuments, href: "/" },
    { key: "expiringRetention", label: "Retensi Jatuh Tempo", count: expiringRetention, href: "/admin/retensi" },
  ];
}

export interface SystemHealthItem {
  key: string;
  label: string;
  status: SystemHealthStatus;
  detail?: string;
}

export async function getSystemHealth(): Promise<SystemHealthItem[]> {
  const [dbOk, aiSnapshot, backupChannels, lastBackup] = await Promise.all([
    prisma.customer.count().then(() => true).catch(() => false),
    AIProcessingService.getHealthSnapshot().catch(() => null),
    getBackupChannelsStatus().catch(() => null),
    getLastBackupInfo().catch(() => null),
  ]);

  const driveConfigured = !!getDriveConfig();

  const aiHealthy = aiSnapshot?.providers.some((p) => p.healthy) ?? false;
  const aiConfigured = (aiSnapshot?.providers.length ?? 0) > 0;

  return [
    { key: "database", label: "Database", status: dbOk ? "healthy" : "down", detail: "SQLite lokal" },
    {
      key: "aiEngine",
      label: "AI Engine",
      status: !aiConfigured ? "unknown" : aiHealthy ? "healthy" : "down",
      detail: aiSnapshot ? `Mode ${aiSnapshot.mode}` : undefined,
    },
    { key: "ocr", label: "OCR", status: "healthy", detail: "Tesseract.js (lokal)" },
    {
      key: "googleDrive",
      label: "Google Drive",
      status: driveConfigured ? "healthy" : "unknown",
      detail: driveConfigured ? "Terkonfigurasi" : "Belum dikonfigurasi",
    },
    {
      key: "backup",
      label: "Backup",
      status: backupChannels ? "healthy" : "unknown",
      detail: lastBackup ? `Terakhir: ${new Date(lastBackup.lastManualBackupAt).toLocaleDateString("id-ID")}` : "Belum pernah backup manual",
    },
  ];
}
