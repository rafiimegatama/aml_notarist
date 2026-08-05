import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { customerTypeLabels, riskCategoryLabels, customerStatusLabels } from "@/lib/labels";
import { formatDate } from "@/components/detail/DetailPrimitives";
import { buildLtkmCsv, type LtkmExportRow } from "@/lib/ltkmCsv";

// FR-8 — export CSV daftar Customer yang ditandai LTKM, untuk membantu
// notaris menyiapkan submission goAML manual ke PPATK. File-serving lewat
// route handler (bukan Server Action), konsisten dengan
// app/api/backup/[filename]/route.ts. Digerbang otomatis oleh PIN gate
// (proxy.ts) karena tidak dikecualikan dari matcher-nya.
export async function GET() {
  const customers = await prisma.customer.findMany({
    where: { isLtkm: true },
    include: {
      corporateDetail: true,
      individualDetail: true,
      legalArrangementDetail: true,
      riskAssessment: true,
    },
    orderBy: { ltkmFlaggedAt: "desc" },
  });

  const rows: LtkmExportRow[] = customers.map((c) => {
    const nama =
      c.corporateDetail?.namaKorporasi ??
      c.individualDetail?.namaLengkap ??
      c.legalArrangementDetail?.nama ??
      "(tanpa nama)";
    const kategoriRisiko = c.riskAssessment?.riskCategory
      ? riskCategoryLabels[c.riskAssessment.riskCategory]
      : "Belum final";

    return {
      nama,
      tipe: customerTypeLabels[c.type],
      kategoriRisiko,
      status: customerStatusLabels[c.status],
      tanggalDitandai: c.ltkmFlaggedAt ? formatDate(c.ltkmFlaggedAt) : "Tidak diketahui",
      catatan: c.ltkmNotes ?? "",
    };
  });

  const csv = buildLtkmCsv(rows);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="ltkm-export.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
