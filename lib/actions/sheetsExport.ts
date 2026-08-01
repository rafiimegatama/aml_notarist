"use server";

import { prisma } from "@/lib/prisma";
import {
  getSheetsConfig,
  readRange,
  updateRange,
  appendRange,
} from "@/lib/googleSheets/client";
import {
  customerTypeLabels,
  customerStatusLabels,
  riskCategoryLabels,
} from "@/lib/labels";

const HEADERS = [
  "ID Pengguna Jasa",
  "Nama",
  "Tipe",
  "Status CDD",
  "Kategori Risiko",
  "Total Nilai Risiko",
  "PEP",
  "Tanggal Dibuat",
  "Tanggal Export",
];

function formatDateForSheet(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

export type ExportResult = { success: true } | { success: false; error: string };

/**
 * Export ringkasan satu CDD (bukan seluruh ~121 field, lihat percakapan
 * scoping) ke satu baris di Google Sheet lewat Service Account. Upsert
 * berdasarkan Customer.id di kolom A — klik ulang tombol export (mis.
 * setelah Risk Assessment diperbarui) meng-update baris yang sama, bukan
 * menambah baris duplikat.
 */
export async function exportCustomerToSheet(
  customerId: string
): Promise<ExportResult> {
  const config = getSheetsConfig();
  if (!config) {
    return {
      success: false,
      error:
        "Integrasi Google Sheets belum dikonfigurasi. Set GOOGLE_SHEETS_SPREADSHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, dan GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY di .env.",
    };
  }

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      corporateDetail: true,
      individualDetail: true,
      legalArrangementDetail: true,
      riskAssessment: true,
    },
  });
  if (!customer) {
    return { success: false, error: "Data pengguna jasa tidak ditemukan." };
  }

  const name =
    customer.corporateDetail?.namaKorporasi ??
    customer.individualDetail?.namaLengkap ??
    customer.legalArrangementDetail?.nama ??
    "(tanpa nama)";
  const ra = customer.riskAssessment;
  const pepLabel =
    ra?.isPep === true ? "Ya" : ra?.isPep === false ? "Tidak" : "Belum dinilai";

  const row = [
    customer.id,
    name,
    customerTypeLabels[customer.type],
    customerStatusLabels[customer.status],
    ra?.riskCategory ? riskCategoryLabels[ra.riskCategory] : "Belum final",
    ra?.totalScore != null ? String(ra.totalScore) : "",
    pepLabel,
    formatDateForSheet(customer.createdAt),
    formatDateForSheet(new Date()),
  ];

  try {
    const headerRange = `${config.sheetName}!A1:I1`;
    const headerRow = await readRange(config, headerRange);
    if (headerRow.length === 0) {
      await updateRange(config, headerRange, [HEADERS]);
    }

    const idColumn = await readRange(config, `${config.sheetName}!A2:A`);
    const existingIndex = idColumn.findIndex((r) => r[0] === customerId);

    if (existingIndex !== -1) {
      const rowNumber = existingIndex + 2; // +2: header row + 1-indexed
      await updateRange(config, `${config.sheetName}!A${rowNumber}:I${rowNumber}`, [row]);
    } else {
      await appendRange(config, `${config.sheetName}!A:I`, [row]);
    }

    return { success: true };
  } catch (err) {
    console.error("Export ke Google Sheet gagal:", err);
    return {
      success: false,
      error:
        "Gagal menyinkronkan ke Google Sheet. Periksa kredensial Service Account dan pastikan Sheet sudah dibagikan (share) ke email Service Account.",
    };
  }
}
