"use server";

import { unlink } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { UPLOAD_DIR } from "@/lib/storage";
import { logSecurityEvent } from "@/lib/securityLog";

export type DeleteCustomerResult =
  | { success: true }
  | { success: false; error: string };

/**
 * FR-5 enforcement — penghapusan manual CDD yang sudah lewat periode retensi.
 * PRD FR-5 poin 4 eksplisit: "keputusan hapus harus manual & bisa diaudit,
 * tidak boleh dijalankan diam-diam oleh sistem." Dipanggil HANYA dari UI
 * retensi setelah notaris mengonfirmasi secara eksplisit.
 *
 * Langkah-langkah:
 * 1. Hapus file scan/foto dari storage/uploads/ (plaintext sudah di-enkripsi
 *    AES-256-GCM — tetap hapus ciphertext, bukan hanya record DB-nya).
 * 2. Hapus Customer dari DB — cascade ke seluruh record terkait (CDD detail,
 *    risk assessment, EDD, activity log, dokumen, dll.).
 * 3. Log ke security.log sebagai "CUSTOMER_DELETED".
 *
 * File yang tidak ditemukan di disk dilewati dengan diam-diam (idempotent)
 * — menghapus record DB tetap dilanjutkan.
 */
export async function deleteCustomerRecord(customerId: string): Promise<DeleteCustomerResult> {
  try {
    // Fetch all document file paths before deleting
    const docs = await prisma.customerDocument.findMany({
      where: { customerId },
      select: { filePath: true },
    });

    // Cascade delete from DB first — if disk cleanup fails partially, the
    // record is still gone; orphaned files are inert (encrypted, unlinked).
    await prisma.customer.delete({ where: { id: customerId } });

    // Best-effort: delete files from disk after DB record is gone.
    for (const doc of docs) {
      try {
        await unlink(path.join(UPLOAD_DIR, doc.filePath));
      } catch {
        // File already missing — fine, continue.
      }
    }

    void logSecurityEvent("CUSTOMER_DELETED", `customerId=${customerId} docs=${docs.length}`);

    revalidatePath("/admin/retensi");
    revalidatePath("/");
    return { success: true };
  } catch (err) {
    console.error("deleteCustomerRecord gagal:", err);
    return { success: false, error: "Gagal menghapus data. Lihat log server." };
  }
}
