import { access, cp, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { DB_PATH, HDD_SYNC_META_PATH, UPLOAD_DIR } from "@/lib/storage";

/**
 * FR-1.2 — cek apakah folder backup di HDD eksternal (mis. "E:\notaris-backup",
 * lihat BACKUP_HDD_PATH di .env.example) sedang tersedia, lalu salin dev.db +
 * uploads/ terbaru ke sana. Dipanggil sekali saat server start (lihat
 * instrumentation.ts) — bukan on-demand tombol, sesuai catatan implementasi
 * FR-1 di PRD (jadwal presisi lebih cocok di OS-level scheduler).
 *
 * Tidak PERNAH throw — kalau drive tidak terpasang atau proses copy gagal,
 * cukup log dan lanjut, sama seperti filosofi "OCR gagal tidak boleh
 * memblokir notaris" di lib/actions/document.ts.
 */
export async function syncToExternalDrive(): Promise<void> {
  const targetRoot = process.env.BACKUP_HDD_PATH;
  if (!targetRoot) return;

  const mounted = await access(targetRoot)
    .then(() => true)
    .catch(() => false);
  if (!mounted) {
    console.log(
      `FR-1.2: BACKUP_HDD_PATH (${targetRoot}) tidak ditemukan/tidak terpasang — sinkronisasi HDD dilewati.`
    );
    return;
  }

  try {
    const dbExists = await access(DB_PATH)
      .then(() => true)
      .catch(() => false);
    if (dbExists) {
      await cp(DB_PATH, path.join(targetRoot, "dev.db"), { force: true });
    }

    await mkdir(UPLOAD_DIR, { recursive: true });
    await mkdir(path.join(targetRoot, "uploads"), { recursive: true });
    await cp(UPLOAD_DIR, path.join(targetRoot, "uploads"), {
      recursive: true,
      force: true,
    });

    await writeFile(
      HDD_SYNC_META_PATH,
      JSON.stringify({ lastSyncAt: new Date().toISOString(), targetRoot }),
      "utf-8"
    );
    console.log(`FR-1.2: Sinkronisasi HDD ke ${targetRoot} berhasil.`);
  } catch (err) {
    console.error("FR-1.2: Sinkronisasi HDD gagal:", err);
  }
}
