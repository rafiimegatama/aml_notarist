"use server";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { CustomerType } from "@/lib/generated/prisma/enums";
import { extractTextFromImage } from "@/lib/ocr/runOcr";
import { extractFieldGuesses, LABEL_MAPS, type FieldGuesses } from "@/lib/ocr/extractFields";
import { UPLOAD_DIR } from "@/lib/storage";
import { decryptJsonField, decryptString, encryptDocumentBuffer, encryptJson, encryptString } from "@/lib/documentEncryption";
import { backupDocumentToDrive } from "@/lib/actions/driveBackup";
import { matchesFileSignature } from "@/lib/fileSignature";
import { generateStoredFilename } from "@/lib/uploadSafety";

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB — cukup untuk foto kamera HP resolusi tinggi

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
  const storedName = generateStoredFilename(file.type);
  if (!storedName) {
    return { success: false, error: "Format file harus JPG, PNG, atau WEBP." };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { success: false, error: "Ukuran file maksimal 15MB." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!matchesFileSignature(file.type, buffer)) {
    return { success: false, error: "Isi file tidak cocok dengan format yang diklaim (JPG/PNG/WEBP)." };
  }

  await mkdir(UPLOAD_DIR, { recursive: true });

  let rawText = "";
  let words: Awaited<ReturnType<typeof extractTextFromImage>>["words"] = [];
  try {
    // OCR dijalankan di memori dari buffer plaintext — file yang ditulis ke
    // disk di bawah ini SELALU ciphertext (Phase 3, lihat lib/documentEncryption.ts),
    // plaintext gambar tidak pernah ditulis ke storage/uploads/.
    const ocrResult = await extractTextFromImage(buffer);
    rawText = ocrResult.text;
    words = ocrResult.words;
  } catch (err) {
    // OCR gagal (mis. file rusak) tidak boleh memblokir notaris — lanjut
    // dengan form kosong, file scan tetap tersimpan sebagai lampiran.
    console.error("OCR gagal:", err);
  }

  await writeFile(path.join(UPLOAD_DIR, storedName), encryptDocumentBuffer(buffer));

  const labelMap = LABEL_MAPS[formType];
  const fieldGuesses = rawText ? extractFieldGuesses(rawText, labelMap, words) : {};

  const doc = await prisma.customerDocument.create({
    data: {
      formType,
      fileName: file.name,
      filePath: storedName,
      mimeType: file.type,
      ocrRawText: rawText ? encryptString(rawText) : null,
      fieldGuesses: Object.keys(fieldGuesses).length > 0 ? encryptJson(fieldGuesses) : undefined,
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
    rawText: doc.ocrRawText ? decryptString(doc.ocrRawText) : "",
    fieldGuesses: decryptJsonField<FieldGuesses>(doc.fieldGuesses) ?? {},
  };
}
