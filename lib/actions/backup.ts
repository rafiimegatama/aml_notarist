"use server";

import { createWriteStream } from "node:fs";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { ZipArchive } from "archiver";
import {
  BACKUP_DIR,
  BACKUP_META_PATH,
  DB_PATH,
  UPLOAD_DIR,
} from "@/lib/storage";

type BackupMeta = { lastManualBackupAt: string; fileName: string };

export type CreateBackupResult =
  | { success: true; fileName: string; createdAt: string }
  | { success: false; error: string };

/**
 * FR-1.1 — bundel prisma/dev.db + storage/uploads/ jadi satu zip
 * bertimestamp di storage/backups/, untuk diunduh notaris via tombol
 * "Backup Now" (app/admin/backup). File di-serve lewat route terpisah
 * (app/api/backup/[filename]) sesuai konvensi file-serving di app ini.
 */
export async function createBackup(): Promise<CreateBackupResult> {
  try {
    await mkdir(BACKUP_DIR, { recursive: true });
    await mkdir(UPLOAD_DIR, { recursive: true });

    const createdAt = new Date().toISOString();
    const fileName = `backup-${createdAt.replace(/[:.]/g, "-")}.zip`;
    const fullPath = path.join(BACKUP_DIR, fileName);

    const dbExists = await access(DB_PATH)
      .then(() => true)
      .catch(() => false);

    await new Promise<void>((resolve, reject) => {
      const output = createWriteStream(fullPath);
      const archive = new ZipArchive({ zlib: { level: 9 } });
      output.on("close", () => resolve());
      output.on("error", reject);
      archive.on("error", reject);
      archive.pipe(output);
      if (dbExists) archive.file(DB_PATH, { name: "dev.db" });
      archive.directory(UPLOAD_DIR, "uploads");
      archive.finalize();
    });

    const meta: BackupMeta = { lastManualBackupAt: createdAt, fileName };
    await writeFile(BACKUP_META_PATH, JSON.stringify(meta), "utf-8");

    return { success: true, fileName, createdAt };
  } catch (err) {
    console.error("Backup gagal:", err);
    return {
      success: false,
      error: "Gagal membuat backup. Lihat log server untuk detail.",
    };
  }
}

export async function getLastBackupInfo(): Promise<BackupMeta | null> {
  try {
    const raw = await readFile(BACKUP_META_PATH, "utf-8");
    return JSON.parse(raw) as BackupMeta;
  } catch {
    return null;
  }
}
