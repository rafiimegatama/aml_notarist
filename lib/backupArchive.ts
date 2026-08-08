import { createWriteStream } from "node:fs";
import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { ZipArchive } from "archiver";
import { BACKUP_DIR, BACKUP_META_PATH, DB_PATH, UPLOAD_DIR } from "@/lib/storage";

export type BackupMeta = { lastManualBackupAt: string; fileName: string };

export type CreateBackupResult =
  | { success: true; fileName: string; createdAt: string }
  | { success: false; error: string };

/**
 * Path override — dipakai HANYA oleh test (lib/actions/backup.test.ts),
 * yang mengimpor fungsi INI secara langsung, bukan lewat Server Action
 * `createBackup()` di lib/actions/backup.ts.
 *
 * Modul ini SENGAJA TIDAK "use server" — kalau override path ada di file
 * "use server", parameter itu jadi bisa dipanggil siapa pun yang tahu action
 * ID-nya lewat POST langsung ke server (Next.js Server Action ID publik,
 * terlepas dari argumen apa yang benar-benar dikirim UI), yang berarti path
 * apa pun (mis. ".env" sebagai "dbPath") bisa dibaca lalu diunduh lewat
 * /api/backup/[filename] — arbitrary file read pasca-PIN. Memisahkan logika
 * archiving ke modul biasa (bukan Server Action) membuatnya TIDAK bisa
 * dijangkau lewat HTTP sama sekali, hanya lewat import kode langsung.
 */
export async function buildBackupZip(paths: {
  dbPath?: string;
  uploadDir?: string;
  backupDir?: string;
} = {}): Promise<CreateBackupResult> {
  const dbPath = paths.dbPath ?? DB_PATH;
  const uploadDir = paths.uploadDir ?? UPLOAD_DIR;
  const backupDir = paths.backupDir ?? BACKUP_DIR;
  const metaPath = paths.backupDir ? path.join(backupDir, "meta.json") : BACKUP_META_PATH;

  try {
    await mkdir(backupDir, { recursive: true });
    await mkdir(uploadDir, { recursive: true });

    const createdAt = new Date().toISOString();
    const fileName = `backup-${createdAt.replace(/[:.]/g, "-")}.zip`;
    const fullPath = path.join(backupDir, fileName);

    const dbExists = await access(dbPath)
      .then(() => true)
      .catch(() => false);

    await new Promise<void>((resolve, reject) => {
      const output = createWriteStream(fullPath);
      const archive = new ZipArchive({ zlib: { level: 9 } });
      output.on("close", () => resolve());
      output.on("error", reject);
      archive.on("error", reject);
      archive.pipe(output);
      if (dbExists) archive.file(dbPath, { name: "dev.db" });
      archive.directory(uploadDir, "uploads");
      archive.finalize();
    });

    const meta: BackupMeta = { lastManualBackupAt: createdAt, fileName };
    await writeFile(metaPath, JSON.stringify(meta), "utf-8");

    return { success: true, fileName, createdAt };
  } catch (err) {
    console.error("Backup gagal:", err);
    return {
      success: false,
      error: "Gagal membuat backup. Lihat log server untuk detail.",
    };
  }
}
