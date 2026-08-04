"use server";

import { readFile } from "node:fs/promises";
import { HDD_SYNC_META_PATH } from "@/lib/storage";
import { getSheetsConfig } from "@/lib/googleSheets/client";
import { getDriveConfig } from "@/lib/googleDrive/client";

export type BackupChannelsStatus = {
  hdd: { configured: boolean; lastSyncAt: string | null };
  sheets: { configured: boolean };
  drive: { configured: boolean };
};

/**
 * FR-1 acceptance criteria: "silence isn't mistaken for success" — panel
 * kecil di /admin/backup ini menampilkan status tiap channel backup selain
 * tombol manual (FR-1.1, sudah punya status sendiri lewat getLastBackupInfo).
 */
export async function getBackupChannelsStatus(): Promise<BackupChannelsStatus> {
  let hddLastSyncAt: string | null = null;
  try {
    const raw = await readFile(HDD_SYNC_META_PATH, "utf-8");
    hddLastSyncAt = (JSON.parse(raw) as { lastSyncAt: string }).lastSyncAt;
  } catch {
    hddLastSyncAt = null;
  }

  return {
    hdd: {
      configured: !!process.env.BACKUP_HDD_PATH,
      lastSyncAt: hddLastSyncAt,
    },
    sheets: { configured: !!getSheetsConfig() },
    drive: { configured: !!getDriveConfig() },
  };
}
