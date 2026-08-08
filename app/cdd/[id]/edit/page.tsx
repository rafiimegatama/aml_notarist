import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, Scale, TriangleAlert, User } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { IndividualForm } from "@/components/forms/IndividualForm";
import { CorporateForm } from "@/components/forms/CorporateForm";
import { LegalArrangementForm } from "@/components/forms/LegalArrangementForm";
import {
  loadIndividualForEdit,
  loadCorporateForEdit,
  loadLegalArrangementForEdit,
} from "@/lib/actions/customerEdit";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id },
    select: {
      corporateDetail: { select: { namaKorporasi: true } },
      individualDetail: { select: { namaLengkap: true } },
      legalArrangementDetail: { select: { nama: true } },
    },
  });
  const name =
    customer?.corporateDetail?.namaKorporasi ??
    customer?.individualDetail?.namaLengkap ??
    customer?.legalArrangementDetail?.nama ??
    "Edit Data CDD";
  return { title: `Edit — ${name}` };
}

export default async function EditCddPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id },
    select: { type: true },
  });
  if (!customer) notFound();

  const backLink = (
    <Link href={`/cdd/${id}`} className="btn btn-secondary px-4 py-2.5 text-sm">
      <ArrowLeft className="h-4 w-4" strokeWidth={2} />
      Kembali ke Detail
    </Link>
  );

  const banner = (
    <div
      role="status"
      className="-mt-4 flex items-start gap-3 rounded-2xl border border-warning-subtle bg-warning-subtle/40 px-4 py-3.5 text-sm font-medium text-[#b45309]"
    >
      <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={2} />
      <p>
        Anda mengedit data CDD yang sudah tersimpan — perubahan langsung
        menimpa data lama dan tercatat di Riwayat Aktivitas. Gunakan halaman
        ini hanya untuk mengoreksi kesalahan input, bukan untuk transaksi/
        engagement baru (buat CDD baru untuk itu).
      </p>
    </div>
  );

  if (customer.type === "PERORANGAN") {
    const data = await loadIndividualForEdit(id);
    if (!data) notFound();
    return (
      <div className="space-y-8">
        <PageHeader icon={User} title={`Edit Data CDD — ${data.displayName}`} actions={backLink} />
        {banner}
        <IndividualForm editCustomer={{ customerId: id, data }} />
      </div>
    );
  }

  if (customer.type === "KORPORASI") {
    const data = await loadCorporateForEdit(id);
    if (!data) notFound();
    return (
      <div className="space-y-8">
        <PageHeader icon={Building2} title={`Edit Data CDD — ${data.displayName}`} actions={backLink} />
        {banner}
        <CorporateForm editCustomer={{ customerId: id, data }} />
      </div>
    );
  }

  const data = await loadLegalArrangementForEdit(id);
  if (!data) notFound();
  return (
    <div className="space-y-8">
      <PageHeader icon={Scale} title={`Edit Data CDD — ${data.displayName}`} actions={backLink} />
      {banner}
      <LegalArrangementForm editCustomer={{ customerId: id, data }} />
    </div>
  );
}
