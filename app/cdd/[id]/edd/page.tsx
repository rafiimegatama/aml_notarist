import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { HighRiskAdditionalInfoForm } from "@/components/forms/HighRiskAdditionalInfoForm";
import { customerTypeLabels } from "@/lib/labels";
import type { HighRiskAdditionalInfoValues } from "@/lib/validations";

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
        <h1 className="text-xl font-semibold text-gray-900">
          Informasi Tambahan (EDD)
        </h1>
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Form EDD Korporasi/Institusi belum tersedia (lihat
          reference-data.md bagian 9) — proses manual diperlukan untuk{" "}
          {customerTypeLabels[customer.type]} berkategori risiko Tinggi.
        </div>
        <Link href={`/cdd/${id}`} className="text-sm text-blue-600 hover:underline">
          &larr; Kembali ke detail CDD
        </Link>
      </div>
    );
  }

  if (riskCategory !== "TINGGI") {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-semibold text-gray-900">
          Informasi Tambahan (EDD)
        </h1>
        <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
          Informasi Tambahan hanya diperlukan untuk pengguna jasa berkategori
          risiko Tinggi. Kategori Risiko saat ini:{" "}
          {riskCategory ? riskCategory : "belum dinilai"}.
        </div>
        <Link href={`/cdd/${id}`} className="text-sm text-blue-600 hover:underline">
          &larr; Kembali ke detail CDD
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
      <div>
        <h1 className="text-xl font-semibold text-gray-900">
          Informasi Tambahan (EDD)
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Wajib diisi karena Kategori Risiko pengguna jasa ini Tinggi.
        </p>
      </div>
      <HighRiskAdditionalInfoForm
        customerId={customer.id}
        initialValues={initialValues}
      />
    </div>
  );
}
