import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Info, ShieldQuestion } from "lucide-react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { HighRiskAdditionalInfoForm } from "@/components/forms/HighRiskAdditionalInfoForm";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { customerTypeLabels, riskCategoryLabels } from "@/lib/labels";
import type { HighRiskAdditionalInfoValues } from "@/lib/validations";

export const metadata: Metadata = {
  title: "Informasi Tambahan (EDD)",
};

export default async function HighRiskAdditionalInfoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: { riskAssessment: true, highRiskAdditionalInfo: true },
  });

  if (!customer) notFound();

  const riskCategory = customer.riskAssessment?.riskCategory ?? null;

  // Section 7.A hanya berlaku untuk PERORANGAN berkategori Tinggi
  // (reference-data.md bagian 7). Untuk kombinasi lain, tampilkan penjelasan
  // dan JANGAN render form — tidak menebak/menambah cakupan di luar dokumen.
  if (customer.type !== "PERORANGAN") {
    return (
      <div className="space-y-6">
        <PageHeader title="Informasi Tambahan (EDD)" icon={ShieldQuestion} />
        <div className="card flex items-center gap-3 border-warning-subtle bg-warning-subtle/40 p-4 text-sm font-semibold text-[#b45309]">
          <Info className="h-4 w-4 shrink-0" strokeWidth={2} />
          <span>
            Form EDD Korporasi/Institusi belum tersedia (lihat
            reference-data.md bagian 9) — proses manual diperlukan untuk{" "}
            {customerTypeLabels[customer.type]} berkategori risiko Tinggi.
          </span>
        </div>
        <Link
          href={`/cdd/${id}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-hover hover:underline"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} />
          Kembali ke detail CDD
        </Link>
      </div>
    );
  }

  if (riskCategory !== "TINGGI") {
    return (
      <div className="space-y-6">
        <PageHeader title="Informasi Tambahan (EDD)" icon={ShieldQuestion} />
        <div className="card flex items-center gap-3 p-4 text-sm font-medium text-muted">
          <Info className="h-4 w-4 shrink-0" strokeWidth={2} />
          <span>
            Informasi Tambahan hanya diperlukan untuk pengguna jasa
            berkategori risiko Tinggi. Kategori Risiko saat ini:{" "}
            {riskCategory ? riskCategoryLabels[riskCategory] : "belum dinilai"}
            .
          </span>
        </div>
        <Link
          href={`/cdd/${id}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-hover hover:underline"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} />
          Kembali ke detail CDD
        </Link>
      </div>
    );
  }

  const h = customer.highRiskAdditionalInfo;
  const initialValues: HighRiskAdditionalInfoValues = {
    namaLengkap: h?.namaLengkap ?? "",
    jenisIdentitas: h?.jenisIdentitas ?? "",
    nomorIdentitas: h?.nomorIdentitas ?? "",
    tempatLahir: h?.tempatLahir ?? "",
    tanggalLahir: h?.tanggalLahir
      ? h.tanggalLahir.toISOString().slice(0, 10)
      : "",
    alamatSesuaiIdentitas: h?.alamatSesuaiIdentitas ?? "",
    jenisHighRiskCustomer: h?.jenisHighRiskCustomer ?? "",
    metodePembayaran: h?.metodePembayaran ?? "",
    tujuanTransaksi: h?.tujuanTransaksi ?? "",
    tujuanTransaksiLainnya: h?.tujuanTransaksiLainnya ?? "",
    sumberKekayaan: h?.sumberKekayaan ?? "",
    sumberKekayaanLainnya: h?.sumberKekayaanLainnya ?? "",
    namaPerusahaanTempatBekerja: h?.namaPerusahaanTempatBekerja ?? "",
    jumlahPenghasilanPerBulan: h?.jumlahPenghasilanPerBulan ?? "",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Informasi Tambahan (EDD)"
        description="Wajib diisi karena Kategori Risiko pengguna jasa ini Tinggi."
        icon={ShieldQuestion}
        actions={<Badge tone="danger">{riskCategoryLabels.TINGGI}</Badge>}
      />
      <HighRiskAdditionalInfoForm
        customerId={customer.id}
        initialValues={initialValues}
      />
    </div>
  );
}
