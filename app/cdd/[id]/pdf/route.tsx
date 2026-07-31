import { renderToBuffer } from "@react-pdf/renderer";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CddDocument } from "@/components/pdf/CddDocument";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      corporateDetail: true,
      individualDetail: true,
      legalArrangementDetail: true,
      beneficialOwners: true,
      powerOfAttorney: true,
      legalArrangementParties: true,
      notaryService: true,
      riskAssessment: {
        include: {
          userProfileScore: true,
          businessSectorScore: true,
          regionScore: true,
          countryScore: true,
          notaryServiceTypeScore: true,
        },
      },
      highRiskAdditionalInfo: true,
    },
  });

  if (!customer) notFound();

  const buffer = await renderToBuffer(<CddDocument customer={customer} />);
  const displayName =
    customer.corporateDetail?.namaKorporasi ??
    customer.individualDetail?.namaLengkap ??
    customer.legalArrangementDetail?.nama ??
    "cdd";
  const fileName = `CDD-${displayName.replace(/[^a-zA-Z0-9]+/g, "-")}.pdf`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${fileName}"`,
    },
  });
}
