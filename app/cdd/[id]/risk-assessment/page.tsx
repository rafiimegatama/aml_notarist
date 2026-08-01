import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { RiskAssessmentForm } from "@/components/forms/RiskAssessmentForm";
import type { RiskAssessmentValues } from "@/lib/validations";

function boolToYesNo(value: boolean | null | undefined): "YA" | "TIDAK" | "" {
  if (value === true) return "YA";
  if (value === false) return "TIDAK";
  return "";
}

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
    "pengguna jasa";
  return { title: `Risk Assessment — ${name}` };
}

export default async function RiskAssessmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [
    customer,
    userProfileOptions,
    businessSectorOptions,
    regionOptions,
    countryOptions,
    notaryServiceTypeOptions,
  ] = await Promise.all([
    prisma.customer.findUnique({
      where: { id },
      include: {
        riskAssessment: true,
        corporateDetail: true,
        individualDetail: true,
        legalArrangementDetail: true,
      },
    }),
    prisma.refUserProfileScore.findMany({
      where: { isActive: true },
      orderBy: { categoryName: "asc" },
    }),
    prisma.refBusinessSectorScore.findMany({
      where: { isActive: true },
      orderBy: { categoryName: "asc" },
    }),
    prisma.refRegionScore.findMany({
      where: { isActive: true },
      orderBy: { categoryName: "asc" },
    }),
    prisma.refCountryScore.findMany({
      where: { isActive: true },
      orderBy: { categoryName: "asc" },
    }),
    prisma.refNotaryServiceTypeScore.findMany({
      where: { isActive: true },
      orderBy: { categoryName: "asc" },
    }),
  ]);

  if (!customer) notFound();

  const ra = customer.riskAssessment;
  const initialValues: RiskAssessmentValues = {
    isPep: boolToYesNo(ra?.isPep),
    namaLengkapPep: ra?.namaLengkapPep ?? "",
    pepAsalNegara: ra?.pepAsalNegara ?? "",
    wargaNegaraPep: ra?.wargaNegaraPep ?? "",
    adaBeritaNegatif: boolToYesNo(ra?.adaBeritaNegatif),
    jabatanPep: ra?.jabatanPep ?? "",
    hubunganDenganPep: ra?.hubunganDenganPep ?? "",
    userProfileScoreId: ra?.userProfileScoreId ?? "",
    businessSectorScoreId: ra?.businessSectorScoreId ?? "",
    regionScoreId: ra?.regionScoreId ?? "",
    countryScoreId: ra?.countryScoreId ?? "",
    notaryServiceTypeScoreId: ra?.notaryServiceTypeScoreId ?? "",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">
          Risk Assessment
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Penilaian Tingkat Risiko untuk{" "}
          {customer.corporateDetail?.namaKorporasi ??
            customer.individualDetail?.namaLengkap ??
            customer.legalArrangementDetail?.nama ??
            "pengguna jasa ini"}
          .
        </p>
      </div>
      <RiskAssessmentForm
        customerId={customer.id}
        initialValues={initialValues}
        userProfileOptions={userProfileOptions}
        businessSectorOptions={businessSectorOptions}
        regionOptions={regionOptions}
        countryOptions={countryOptions}
        notaryServiceTypeOptions={notaryServiceTypeOptions}
      />
    </div>
  );
}
