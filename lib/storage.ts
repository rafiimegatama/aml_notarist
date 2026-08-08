import path from "node:path";

export const UPLOAD_DIR = path.join(process.cwd(), "storage", "uploads");
export const DB_PATH = path.join(process.cwd(), "prisma", "dev.db");

// FR-1.1 — hasil "Backup Now" (zip dev.db + uploads) disimpan di sini untuk
// diunduh via app/api/backup/[filename].
export const BACKUP_DIR = path.join(process.cwd(), "storage", "backups");
export const BACKUP_META_PATH = path.join(BACKUP_DIR, "meta.json");

// FR-1.2 — cermin lokal dev.db + uploads, ditulis ulang tiap sinkronisasi
// HDD eksternal berhasil (lib/hddSync.ts). Dipakai untuk catatan "sinkronisasi
// terakhir" di UI tanpa perlu mount drive eksternal untuk membacanya.
export const HDD_SYNC_META_PATH = path.join(
  process.cwd(),
  "storage",
  "hdd-sync-meta.json"
);

// FR-11 — salinan PDF otomatis saat status Customer berubah ke COMPLETE.
export const PDF_ARCHIVE_DIR = path.join(process.cwd(), "storage", "archive");

// Dashboard hero banner (gambar latar, dapat dikonfigurasi admin) — lihat
// lib/actions/heroSettings.ts. Disimpan terpisah dari UPLOAD_DIR karena
// bukan dokumen CDD (tidak tunduk retensi FR-5).
export const HERO_DIR = path.join(process.cwd(), "storage", "hero");

// Security event log — append-only NDJSON, satu baris JSON per event.
// File-based (bukan tabel DB) supaya tamper-resistance lebih baik dan
// tidak terkena cascade delete kalau tabel Customer dihapus.
export const SECURITY_LOG_PATH = path.join(process.cwd(), "storage", "security.log");
