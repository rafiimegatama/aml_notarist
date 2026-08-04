"use server";

import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";
import { CustomerType } from "@/lib/generated/prisma/enums";
import { extractTextFromImage } from "@/lib/ocr/runOcr";
import { extractFieldGuesses, LABEL_MAPS, type FieldGuesses } from "@/lib/ocr/extractFields";
import { UPLOAD_DIR } from "@/lib/storage";
import { backupDocumentToDrive } from "@/lib/actions/driveBackup";

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB — cukup untuk foto kamera HP resolusi tinggi
const ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export type UploadOcrResult =
  | {
      success: true;
      draftUploadId: string;
      rawText: string;
      fieldGuesses: FieldGuesses;
    }
  | { success: false; error: string };

export async function uploadAndExtractDocument(
  formType: CustomerType,
  formData: FormData
): Promise<UploadOcrResult> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: "Pilih file foto/scan terlebih dahulu." };
  }
  const ext = ALLOWED_MIME[file.type];
  if (!ext) {
    return { success: false, error: "Format file harus JPG, PNG, atau WEBP." };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { success: false, error: "Ukuran file maksimal 15MB." };
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
  const storedName = `${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, storedName), buffer);

  let rawText = "";
  let words: Awaited<ReturnType<typeof extractTextFromImage>>["words"] = [];
  try {
    const ocrResult = await extractTextFromImage(path.join(UPLOAD_DIR, storedName));
    rawText = ocrResult.text;
    words = ocrResult.words;
  } catch (err) {
    // OCR gagal (mis. file rusak) tidak boleh memblokir notaris — lanjut
    // dengan form kosong, file scan tetap tersimpan sebagai lampiran.
    console.error("OCR gagal:", err);
  }

  const labelMap = LABEL_MAPS[formType];
  const fieldGuesses = rawText ? extractFieldGuesses(rawText, labelMap, words) : {};

  const doc = await prisma.customerDocument.create({
    data: {
      formType,
      fileName: file.name,
      filePath: storedName,
      mimeType: file.type,
      ocrRawText: rawText || null,
      fieldGuesses,
    },
  });

  // FR-1.4 — fire-and-forget, tidak di-await: backup Drive tidak boleh
  // menunda respons OCR yang sedang ditunggu notaris di form.
  void backupDocumentToDrive(doc.id);

  return { success: true, draftUploadId: doc.id, rawText, fieldGuesses };
}

export type DraftDocument = {
  id: string;
  rawText: string;
  fieldGuesses: FieldGuesses;
};

/**
 * Dipanggil dari halaman "CDD Baru" untuk memuat hasil OCR yang dibuat lewat
 * uploadAndExtractDocument, sebagai default value form. Mengembalikan null
 * (bukan error) kalau id tidak ada/tipe tidak cocok/sudah pernah dipakai —
 * ini hanya fitur bantu, gagal diam-diam ke form kosong lebih aman daripada
 * memblokir notaris membuat CDD baru.
 */
export async function loadDraftDocument(
  draftUploadId: string,
  expectedFormType: CustomerType
): Promise<DraftDocument | null> {
  const doc = await prisma.customerDocument.findUnique({
    where: { id: draftUploadId },
  });
  if (!doc || doc.formType !== expectedFormType || doc.customerId !== null) {
    return null;
  }
  return {
    id: doc.id,
    rawText: doc.ocrRawText ?? "",
    fieldGuesses: (doc.fieldGuesses as FieldGuesses | null) ?? {},
  };
}

/**
 * Dipanggil di dalam $transaction createXCustomer setelah Customer dibuat,
 * untuk menautkan dokumen scan (kalau ada) ke record yang baru dibuat.
 * updateMany + guard customerId:null dipakai supaya idempotent & tidak
 * throw kalau draftUploadId sudah tidak valid/sudah pernah dipakai.
 */
export async function attachDraftDocument(
  tx: Prisma.TransactionClient,
  draftUploadId: string | undefined,
  customerId: string
): Promise<void> {
  if (!draftUploadId) return;
  await tx.customerDocument.updateMany({
    where: { id: draftUploadId, customerId: null },
    data: { customerId },
  });
}
