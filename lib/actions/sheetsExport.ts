"use server";

import { prisma } from "@/lib/prisma";
import {
  getSheetsConfig,
  readRange,
  updateRange,
  appendRange,
  columnLetter,
} from "@/lib/googleSheets/client";
import {
  customerTypeLabels,
  customerStatusLabels,
  riskCategoryLabels,
} from "@/lib/labels";
import { fmtDate, fmtDateTime, fmtStr, fmtInt, fmtTriBool } from "@/lib/googleSheets/format";
import { getNextReviewDue } from "@/lib/reviewReminder";

const HEADERS = [
  "id_pengguna_jasa",
  "nama",
  "tipe",
  "status_cdd",
  "kategori_risiko",
  "total_nilai_risiko",
  "pep",
  "ltkm",
  "catatan_ltkm",
  "tanggal_dibuat",
  "tanggal_diperbarui",
  "terakhir_ditinjau",
  "jatuh_tempo_tinjau",
  "nama_notaris",
  "jasa_yang_diberikan",
  "_synced_at",
];
const LAST_COLUMN = columnLetter(HEADERS.length);

export type ExportResult = { success: true } | { success: false; error: string };

/**
 * Export ringkasan satu CDD (tab spine "Customers") ke satu baris di Google
 * Sheet lewat Service Account. Upsert berdasarkan Customer.id di kolom A —
 * klik ulang tombol export (mis. setelah Risk Assessment diperbarui)
 * meng-update baris yang sama, bukan menambah baris duplikat.
 *
 * Untuk mirror detail penuh (CDD per jenis, BO, dsb) lihat
 * lib/actions/sheetsFullSync.ts — tab itu disinkron terpisah (full rebuild),
 * bukan lewat fungsi ini.
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
      notaryService: true,
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
  const reviewAnchor = customer.lastReviewedAt ?? customer.createdAt;
  const reviewDue = getNextReviewDue(reviewAnchor, ra?.riskCategory ?? null);

  const row = [
    customer.id,
    name,
    customerTypeLabels[customer.type],
    customerStatusLabels[customer.status],
    ra?.riskCategory ? riskCategoryLabels[ra.riskCategory] : "",
    fmtInt(ra?.totalScore),
    fmtTriBool(ra?.isPep),
    fmtTriBool(customer.isLtkm),
    fmtStr(customer.ltkmNotes),
    fmtDate(customer.createdAt),
    fmtDate(customer.updatedAt),
    fmtDate(customer.lastReviewedAt),
    fmtDate(reviewDue),
    fmtStr(customer.notaryService?.namaNotaris),
    fmtStr(customer.notaryService?.jasaYangDiberikan),
    fmtDateTime(new Date()),
  ];

  try {
    const headerRange = `${config.sheetName}!A1:${LAST_COLUMN}1`;
    const headerRow = await readRange(config, headerRange);
    if (headerRow.length === 0 || headerRow[0].length < HEADERS.length) {
      await updateRange(config, headerRange, [HEADERS]);
    }

    const idColumn = await readRange(config, `${config.sheetName}!A2:A`);
    const existingIndex = idColumn.findIndex((r) => r[0] === customerId);

    if (existingIndex !== -1) {
      const rowNumber = existingIndex + 2; // +2: header row + 1-indexed
      await updateRange(
        config,
        `${config.sheetName}!A${rowNumber}:${LAST_COLUMN}${rowNumber}`,
        [row]
      );
    } else {
      await appendRange(config, `${config.sheetName}!A:${LAST_COLUMN}`, [row]);
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
