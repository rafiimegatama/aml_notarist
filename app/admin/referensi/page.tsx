import type { Metadata } from "next";
import { BookOpen } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AdminRefTable } from "@/components/admin/AdminRefTable";
import { REF_TABLE_CONFIG } from "@/lib/refTableConfig";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = {
  title: "Referensi Data — Tabel Skor Risiko",
};

export default async function AdminReferensiPage() {
  const [
    userProfileRows,
    businessSectorRows,
    regionRows,
    countryRows,
    notaryServiceTypeRows,
  ] = await Promise.all([
    prisma.refUserProfileScore.findMany({ orderBy: { categoryName: "asc" } }),
    prisma.refBusinessSectorScore.findMany({
      orderBy: { categoryName: "asc" },
    }),
    prisma.refRegionScore.findMany({ orderBy: { categoryName: "asc" } }),
    prisma.refCountryScore.findMany({ orderBy: { categoryName: "asc" } }),
    prisma.refNotaryServiceTypeScore.findMany({
      orderBy: { categoryName: "asc" },
    }),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Referensi Data — Tabel Skor Risiko"
        description="Kelola 5 tabel referensi skor yang dipakai Risk Assessment (reference-data.md bagian 5). Menonaktifkan kategori tidak menghapus riwayat penilaian yang sudah memakainya."
        icon={BookOpen}
      />

      <div className="space-y-6">
        <AdminRefTable
          tableKey="userProfile"
          label={REF_TABLE_CONFIG.userProfile.label}
          scoreRequired={REF_TABLE_CONFIG.userProfile.scoreRequired}
          rows={userProfileRows}
        />
        <AdminRefTable
          tableKey="businessSector"
          label={REF_TABLE_CONFIG.businessSector.label}
          note={REF_TABLE_CONFIG.businessSector.note}
          scoreRequired={REF_TABLE_CONFIG.businessSector.scoreRequired}
          rows={businessSectorRows}
        />
        <AdminRefTable
          tableKey="region"
          label={REF_TABLE_CONFIG.region.label}
          scoreRequired={REF_TABLE_CONFIG.region.scoreRequired}
          rows={regionRows}
        />
        <AdminRefTable
          tableKey="country"
          label={REF_TABLE_CONFIG.country.label}
          scoreRequired={REF_TABLE_CONFIG.country.scoreRequired}
          rows={countryRows}
        />
        <AdminRefTable
          tableKey="notaryServiceType"
          label={REF_TABLE_CONFIG.notaryServiceType.label}
          scoreRequired={REF_TABLE_CONFIG.notaryServiceType.scoreRequired}
          rows={notaryServiceTypeRows}
        />
      </div>
    </div>
  );
}
