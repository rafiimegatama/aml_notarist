import path from "node:path";

export const UPLOAD_DIR = path.join(process.cwd(), "storage", "uploads");
export const DB_PATH = path.join(process.cwd(), "prisma", "dev.db");

// FR-1.1 — hasil "Backup Now" (zip dev.db + uploads) disimpan di sini untuk
// diunduh via app/api/backup/[filename].
export const BACKUP_DIR = path.join(process.cwd(), "storage", "backups");
export const BACKUP_META_PATH = path.join(BACKUP_DIR, "meta.json");
