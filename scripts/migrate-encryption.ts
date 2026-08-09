/**
 * Migrasi kunci enkripsi: SESSION_SECRET (v1, legacy) -> DATA_ENCRYPTION_KEY
 * / DOCUMENT_ENCRYPTION_KEY (v2, dedicated). Lihat lib/documentEncryption.ts
 * untuk arsitektur format v1/v2, lib/encryptionMigration.ts untuk logika
 * inti (bisa dites langsung, lihat lib/encryptionMigration.test.ts), dan
 * SECURITY.md untuk prosedur operasional.
 *
 * Alur per record: DECRYPT (kunci lama) -> VERIFY PLAINTEXT -> ENCRYPT
 * (kunci baru) -> VERIFY CIPHERTEXT BARU (round-trip) -> PERSIST.
 *
 * Sifat:
 * - Idempotent — record yang sudah format v2 dilewati (skip), aman dijalankan
 *   berulang kali.
 * - Resumable — tiap record diproses+disimpan satu per satu (bukan satu
 *   transaksi raksasa), jadi kalau proses terhenti di tengah jalan, record
 *   yang sudah bermigrasi tetap v2 dan sisanya tetap v1 (kedua state valid
 *   dan bisa dibaca aplikasi) — jalankan lagi untuk melanjutkan.
 * - Tidak pernah menulis plaintext ke disk atau log — semua dekripsi/re-
 *   enkripsi terjadi di memori, log hanya berisi id record + jumlah.
 * - Record yang gagal TIDAK dihapus/dilewati diam-diam — dihitung terpisah
 *   dan dilaporkan di akhir, file/kolom aslinya tidak tersentuh.
 *
 * Jalankan: npm run security:migrate-encryption
 */
import "dotenv/config";
import { prisma } from "@/lib/prisma";
import { isKeySeparationConfigured } from "@/lib/documentEncryption";
import { migrateDataFields, migrateFiles } from "@/lib/encryptionMigration";
import { writeEncryptionMigrationStatus } from "@/lib/encryptionMigrationStatus";

async function main() {
  if (!process.env.SESSION_SECRET) {
    console.error("SESSION_SECRET belum diset — dibutuhkan untuk membaca data terenkripsi lama (v1).");
    process.exit(1);
  }
  if (!isKeySeparationConfigured()) {
    console.error(
      "DATA_ENCRYPTION_KEY dan DOCUMENT_ENCRYPTION_KEY harus diisi KEDUANYA di .env sebelum migrasi bisa dijalankan.\n" +
        "Hasilkan dengan: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    );
    process.exit(1);
  }

  console.log("Memulai migrasi enkripsi (v1 -> v2)...\n");

  const dataFields = await migrateDataFields();
  const files = await migrateFiles();

  writeEncryptionMigrationStatus({
    lastRunAt: new Date().toISOString(),
    dataFieldsMigrated: dataFields.migrated,
    dataFieldsSkippedAlready: dataFields.skippedAlready,
    dataFieldsFailed: dataFields.failed,
    filesMigrated: files.migrated,
    filesSkippedAlready: files.skippedAlready,
    filesFailed: files.failed,
  });

  console.log("\nSelesai. Ringkasan:");
  console.log(`  Field data (OCR/terstruktur): ${dataFields.migrated} dimigrasi, ${dataFields.skippedAlready} sudah v2 (dilewati), ${dataFields.failed} gagal`);
  console.log(`  File dokumen: ${files.migrated} dimigrasi, ${files.skippedAlready} sudah v2 (dilewati), ${files.failed} gagal`);

  if (dataFields.failed > 0 || files.failed > 0) {
    console.error("\nAda record yang GAGAL dimigrasi — data/file aslinya TIDAK disentuh (masih format lama, tetap bisa dibaca via SESSION_SECRET). Jalankan ulang skrip ini setelah masalah diperbaiki.");
    process.exit(1);
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Migrasi gagal total:", err instanceof Error ? err.message : err);
  process.exit(1);
});
