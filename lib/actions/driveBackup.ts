"use server";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { UPLOAD_DIR } from "@/lib/storage";
import { getDriveConfig, uploadFileToDrive } from "@/lib/googleDrive/client";

/**
 * FR-1.4 — salin satu file scan/foto (yang sudah tersimpan lokal) ke Google
 * Drive. Dipanggil fire-and-forget dari uploadAndExtractDocument
 * (lib/actions/document.ts) — TIDAK boleh menunda respons OCR ke notaris,
 * jadi caller tidak menunggu Promise ini selesai. Gagal diam-diam + log,
 * sama seperti getSheetsConfig() kalau belum dikonfigurasi.
 */
export async function backupDocumentToDrive(documentId: string): Promise<void> {
  const config = getDriveConfig();
  if (!config) return;

  try {
    const doc = await prisma.customerDocument.findUnique({
      where: { id: documentId },
    });
    if (!doc) return;

    const buffer = await readFile(path.join(UPLOAD_DIR, doc.filePath));
    await uploadFileToDrive(config, doc.fileName, doc.mimeType, buffer);
    console.log(`FR-1.4: Backup ke Google Drive berhasil untuk dokumen ${documentId}.`);
  } catch (err) {
    console.error(`FR-1.4: Backup ke Google Drive gagal untuk dokumen ${documentId}:`, err);
  }
}
