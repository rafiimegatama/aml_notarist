/**
 * Core migration logic for scripts/migrate-encryption.ts, extracted into an
 * importable module (not the script itself) so it can be unit-tested — a
 * script with a top-level `main()` call would execute immediately on import.
 *
 * See scripts/migrate-encryption.ts for the CLI entry point / usage, and
 * lib/documentEncryption.ts for the v1/v2 format this operates on.
 */
import { existsSync } from "node:fs";
import { readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { UPLOAD_DIR } from "@/lib/storage";
import { matchesFileSignature } from "@/lib/fileSignature";
import {
  decryptDocumentBuffer,
  decryptJsonField,
  decryptString,
  encryptDocumentBuffer,
  encryptJson,
  encryptString,
  isLegacyEncryptedFile,
  isLegacyEncryptedString,
} from "@/lib/documentEncryption";

export type MigrationCounts = { migrated: number; skippedAlready: number; failed: number };

/**
 * documentIds — optional scoping filter, used ONLY by tests
 * (lib/encryptionMigration.test.ts) to migrate a specific throwaway fixture
 * row instead of every CustomerDocument in the database. The real CLI
 * (scripts/migrate-encryption.ts) never passes this — omitting it processes
 * every document, which is the correct/intended production behavior.
 */
export async function migrateDataFields(documentIds?: string[]): Promise<MigrationCounts> {
  const counts: MigrationCounts = { migrated: 0, skippedAlready: 0, failed: 0 };
  const rows = await prisma.customerDocument.findMany({
    where: documentIds ? { id: { in: documentIds } } : undefined,
    select: { id: true, ocrRawText: true, fieldGuesses: true },
  });

  for (const row of rows) {
    let recordFailed = false;
    const data: { ocrRawText?: string; fieldGuesses?: string } = {};

    if (typeof row.ocrRawText === "string" && row.ocrRawText.length > 0) {
      if (isLegacyEncryptedString(row.ocrRawText) || !row.ocrRawText.startsWith("$enc$v2$")) {
        try {
          const plaintext = decryptString(row.ocrRawText);
          const reencrypted = encryptString(plaintext);
          if (decryptString(reencrypted) !== plaintext) {
            throw new Error("Verifikasi round-trip ciphertext baru gagal (isi tidak cocok).");
          }
          data.ocrRawText = reencrypted;
        } catch (err) {
          recordFailed = true;
          console.error(
            `[ocrRawText] gagal migrasi CustomerDocument ${row.id}:`,
            err instanceof Error ? err.message : "unknown error"
          );
        }
      }
    }

    if (row.fieldGuesses !== null && row.fieldGuesses !== undefined) {
      const isAlreadyV2 = typeof row.fieldGuesses === "string" && row.fieldGuesses.startsWith("$enc$v2$");
      if (!isAlreadyV2) {
        try {
          const plaintext = decryptJsonField<unknown>(row.fieldGuesses);
          const reencrypted = encryptJson(plaintext);
          const roundTrip = decryptJsonField<unknown>(reencrypted);
          if (JSON.stringify(roundTrip) !== JSON.stringify(plaintext)) {
            throw new Error("Verifikasi round-trip ciphertext baru gagal (isi tidak cocok).");
          }
          data.fieldGuesses = reencrypted;
        } catch (err) {
          recordFailed = true;
          console.error(
            `[fieldGuesses] gagal migrasi CustomerDocument ${row.id}:`,
            err instanceof Error ? err.message : "unknown error"
          );
        }
      }
    }

    if (recordFailed) {
      counts.failed += 1;
      continue;
    }

    if (Object.keys(data).length === 0) {
      counts.skippedAlready += 1;
      continue;
    }

    try {
      await prisma.customerDocument.update({ where: { id: row.id }, data });
      counts.migrated += 1;
    } catch (err) {
      counts.failed += 1;
      console.error(
        `[persist] gagal menyimpan CustomerDocument ${row.id}:`,
        err instanceof Error ? err.message : "unknown error"
      );
    }
  }

  return counts;
}

export async function migrateFiles(
  options: { uploadDir?: string; documentIds?: string[] } = {}
): Promise<MigrationCounts> {
  const uploadDir = options.uploadDir ?? UPLOAD_DIR;
  const counts: MigrationCounts = { migrated: 0, skippedAlready: 0, failed: 0 };
  const rows = await prisma.customerDocument.findMany({
    where: options.documentIds ? { id: { in: options.documentIds } } : undefined,
    select: { id: true, filePath: true, mimeType: true },
  });

  for (const row of rows) {
    const fullPath = path.join(uploadDir, row.filePath);
    if (!existsSync(fullPath)) {
      counts.failed += 1;
      console.error(`[file] tidak ditemukan di disk untuk CustomerDocument ${row.id}: ${row.filePath}`);
      continue;
    }

    try {
      const stored = await readFile(fullPath);
      if (!isLegacyEncryptedFile(stored)) {
        counts.skippedAlready += 1;
        continue;
      }

      const plaintext = decryptDocumentBuffer(stored);
      if (!matchesFileSignature(row.mimeType, plaintext)) {
        throw new Error("Hasil dekripsi tidak cocok dengan magic bytes MIME type yang tersimpan.");
      }

      const reencrypted = encryptDocumentBuffer(plaintext);
      const roundTrip = decryptDocumentBuffer(reencrypted);
      if (!roundTrip.equals(plaintext)) {
        throw new Error("Verifikasi round-trip ciphertext file baru gagal (isi tidak cocok).");
      }

      // Tulis ke file sementara lalu rename (atomic pada filesystem yang sama)
      // supaya kalau proses terhenti di tengah write, file asli tidak rusak.
      const tmpPath = `${fullPath}.migrating`;
      await writeFile(tmpPath, reencrypted);
      await rename(tmpPath, fullPath);
      counts.migrated += 1;
    } catch (err) {
      counts.failed += 1;
      console.error(`[file] gagal migrasi CustomerDocument ${row.id}:`, err instanceof Error ? err.message : "unknown error");
    }
  }

  return counts;
}
