"use server";

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { BACKUP_DIR, BACKUP_META_PATH } from "@/lib/storage";
import {
  buildBackupZip,
  verifyBackupRestore,
  type BackupMeta,
  type CreateBackupResult,
  type RestoreVerificationResult,
} from "@/lib/backupArchive";
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

/**
 * Restores the most recent backup into an isolated temp directory and runs
 * a real validation pass (SQLite integrity, Prisma read, sample document
 * decrypt) — see verifyBackupRestore() for the full flow. Persists the
 * result onto meta.json so the dashboard can show CREATED vs VERIFIED vs
 * FAILED, and always logs the outcome (including FAILED — that is exactly
 * the case an operator most needs to know about).
 */
export async function verifyLastBackup(): Promise<
  RestoreVerificationResult | { status: "FAILED"; verifiedAt: string; checks: [{ name: "NO_BACKUP"; passed: false; detail: string }] }
> {
  const meta = await getLastBackupInfo();
  if (!meta) {
    return {
      status: "FAILED",
      verifiedAt: new Date().toISOString(),
      checks: [{ name: "NO_BACKUP", passed: false, detail: "Belum ada backup untuk diverifikasi." }],
    };
  }

  const zipPath = path.join(BACKUP_DIR, meta.fileName);
  const result = await verifyBackupRestore(zipPath);

  const updatedMeta: BackupMeta = {
    ...meta,
    restoreStatus: result.status,
    restoreVerifiedAt: result.verifiedAt,
    restoreChecks: result.checks,
  };
  await writeFile(BACKUP_META_PATH, JSON.stringify(updatedMeta), "utf-8");
  void logSecurityEvent("BACKUP_VERIFIED", `${meta.fileName}:${result.status}`);

  return result;
}
