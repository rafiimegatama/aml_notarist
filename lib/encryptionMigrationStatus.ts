import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { ENCRYPTION_MIGRATION_STATUS_PATH } from "@/lib/storage";

export interface EncryptionMigrationStatus {
  lastRunAt: string;
  dataFieldsMigrated: number;
  dataFieldsSkippedAlready: number;
  dataFieldsFailed: number;
  filesMigrated: number;
  filesSkippedAlready: number;
  filesFailed: number;
}

/** Never throws — a missing/corrupt status file just means "never migrated". */
export function readEncryptionMigrationStatus(): EncryptionMigrationStatus | null {
  if (!existsSync(ENCRYPTION_MIGRATION_STATUS_PATH)) return null;
  try {
    return JSON.parse(readFileSync(ENCRYPTION_MIGRATION_STATUS_PATH, "utf-8")) as EncryptionMigrationStatus;
  } catch {
    return null;
  }
}

export function writeEncryptionMigrationStatus(status: EncryptionMigrationStatus): void {
  writeFileSync(ENCRYPTION_MIGRATION_STATUS_PATH, JSON.stringify(status, null, 2), "utf-8");
}
