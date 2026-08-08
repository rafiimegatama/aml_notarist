"use server";

import { readFile } from "node:fs/promises";
import { BACKUP_META_PATH } from "@/lib/storage";
import { buildBackupZip, type BackupMeta, type CreateBackupResult } from "@/lib/backupArchive";
import { logSecurityEvent } from "@/lib/securityLog";

/**
 * FR-1.1 — bundel prisma/dev.db + storage/uploads/ jadi satu zip
 * bertimestamp di storage/backups/, untuk diunduh notaris via tombol
 * "Backup Now" (app/admin/backup). File di-serve lewat route terpisah
 * (app/api/backup/[filename]) sesuai konvensi file-serving di app ini.
 *
 * SENGAJA tanpa parameter — ini Server Action publik (lihat "use server" di
 * atas), jadi action ID-nya bisa dipanggil langsung lewat POST oleh siapa
 * pun yang punya sesi PIN valid, terlepas dari argumen apa yang dikirim UI
 * (components/admin/BackupPanel.tsx). Path override untuk kebutuhan test
 * ADA di lib/backupArchive.ts (bukan file "use server"), bukan di sini.
 */
export async function createBackup(): Promise<CreateBackupResult> {
  const result = await buildBackupZip();
  if (result.success) {
    void logSecurityEvent("BACKUP_CREATED", result.fileName);
  }
  return result;
}

export async function getLastBackupInfo(): Promise<BackupMeta | null> {
  try {
    const raw = await readFile(BACKUP_META_PATH, "utf-8");
    return JSON.parse(raw) as BackupMeta;
  } catch {
    return null;
  }
}
