import { createHash } from "node:crypto";
import { createWriteStream, existsSync } from "node:fs";
import { access, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { ZipArchive } from "archiver";
import unzipper from "unzipper";
import { BACKUP_DIR, BACKUP_META_PATH, DB_PATH, UPLOAD_DIR } from "@/lib/storage";

export type BackupMeta = {
  lastManualBackupAt: string;
  fileName: string;
  sha256: string;
  // Populated only after verifyLastBackup() (lib/actions/backup.ts) has
  // actually run a restore-and-validate pass — absent means CREATED but
  // never verified, which is a distinct state from FAILED.
  restoreStatus?: "VERIFIED" | "FAILED";
  restoreVerifiedAt?: string;
  restoreChecks?: RestoreCheck[];
};

export type RestoreCheck = { name: string; passed: boolean; detail: string };
export type RestoreVerificationResult = {
  status: "VERIFIED" | "FAILED";
  verifiedAt: string;
  checks: RestoreCheck[];
};

export type CreateBackupResult =
  | { success: true; fileName: string; createdAt: string }
  | { success: false; error: string };

function sha256(data: Buffer): string {
  return createHash("sha256").update(data).digest("hex");
}

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

    // Build manifest — SHA-256 of each file that goes into the zip.
    const manifest: Record<string, string> = {};

    if (dbExists) {
      const dbBuf = await readFile(dbPath);
      manifest["dev.db"] = sha256(dbBuf);
    }

    const uploadFiles = await readdir(uploadDir).catch(() => [] as string[]);
    for (const f of uploadFiles) {
      const buf = await readFile(path.join(uploadDir, f));
      manifest[`uploads/${f}`] = sha256(buf);
    }

    await new Promise<void>((resolve, reject) => {
      const output = createWriteStream(fullPath);
      const archive = new ZipArchive({ zlib: { level: 9 } });
      output.on("close", () => resolve());
      output.on("error", reject);
      archive.on("error", reject);
      archive.pipe(output);
      if (dbExists) archive.file(dbPath, { name: "dev.db" });
      archive.directory(uploadDir, "uploads");
      archive.append(JSON.stringify(manifest, null, 2), { name: "manifest.json" });
      archive.finalize();
    });

    // Checksum of the zip itself — stored externally for quick verification.
    const zipBuf = await readFile(fullPath);
    const zipSha256 = sha256(zipBuf);

    const meta: BackupMeta = { lastManualBackupAt: createdAt, fileName, sha256: zipSha256 };
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

/**
 * Verify a backup zip: check external SHA-256 (from meta.json) matches the
 * file on disk. Returns a descriptive result.
 */
export async function verifyBackupChecksum(
  zipPath: string,
  expectedSha256: string
): Promise<{ valid: boolean; detail: string }> {
  try {
    const buf = await readFile(zipPath);
    const actual = sha256(buf);
    if (actual === expectedSha256) {
      return { valid: true, detail: "Checksum cocok." };
    }
    return { valid: false, detail: `Checksum tidak cocok: expected ${expectedSha256.slice(0, 12)}…, got ${actual.slice(0, 12)}….` };
  } catch {
    return { valid: false, detail: "File backup tidak ditemukan." };
  }
}

/**
 * Restore-and-validate a backup zip into an ISOLATED TEMP DIRECTORY —
 * never touches prisma/dev.db, storage/uploads/, or any other production
 * path. A backup is only "VERIFIED" after this actually passes; checksum
 * matching alone (verifyBackupChecksum above) only proves the zip bytes
 * are intact, not that the archive is restorable/readable.
 *
 * Flow: extract -> manifest/file checksum -> SQLite integrity + foreign-key
 * check -> Prisma table read against the extracted DB -> decrypt one sample
 * document + its OCR fields (using the CURRENT live encryption keys, not
 * anything from the backup itself — the backup never contains key material).
 * Temp directory is always removed, even on failure.
 */
export async function verifyBackupRestore(zipPath: string): Promise<RestoreVerificationResult> {
  const checks: RestoreCheck[] = [];
  const verifiedAt = new Date().toISOString();
  const finish = (): RestoreVerificationResult => ({
    status: checks.every((c) => c.passed) ? "VERIFIED" : "FAILED",
    verifiedAt,
    checks,
  });

  const tempDir = await mkdtemp(path.join(tmpdir(), "notary-restore-verify-"));
  try {
    // 1. Extract archive
    try {
      const directory = await unzipper.Open.file(zipPath);
      await directory.extract({ path: tempDir, concurrency: 4 });
      checks.push({ name: "EXTRACT_ARCHIVE", passed: true, detail: `${directory.files.length} entri diekstrak.` });
    } catch (err) {
      checks.push({
        name: "EXTRACT_ARCHIVE",
        passed: false,
        detail: `Gagal mengekstrak zip: ${err instanceof Error ? err.message : "unknown error"}`,
      });
      return finish();
    }

    // 2. Manifest + per-file checksum (FILE EXISTENCE, FILE CHECKSUM)
    const manifestPath = path.join(tempDir, "manifest.json");
    let manifest: Record<string, string> = {};
    if (existsSync(manifestPath)) {
      try {
        manifest = JSON.parse(await readFile(manifestPath, "utf-8"));
        checks.push({ name: "MANIFEST_PRESENT", passed: true, detail: `${Object.keys(manifest).length} entri di manifest.` });
      } catch {
        checks.push({ name: "MANIFEST_PRESENT", passed: false, detail: "manifest.json tidak bisa diparse." });
      }
    } else {
      checks.push({ name: "MANIFEST_PRESENT", passed: false, detail: "manifest.json tidak ada di dalam zip." });
    }

    let missingFiles = 0;
    let checksumMismatches = 0;
    for (const [rel, expectedHash] of Object.entries(manifest)) {
      const filePath = path.join(tempDir, rel);
      if (!existsSync(filePath)) {
        missingFiles += 1;
        continue;
      }
      if (sha256(await readFile(filePath)) !== expectedHash) checksumMismatches += 1;
    }
    checks.push({
      name: "FILE_EXISTENCE_AND_CHECKSUM",
      passed: missingFiles === 0 && checksumMismatches === 0,
      detail: `${missingFiles} file hilang, ${checksumMismatches} checksum tidak cocok dari ${Object.keys(manifest).length} entri manifest.`,
    });

    // 3. SQLite integrity check + foreign-key check on the EXTRACTED copy
    const extractedDbPath = path.join(tempDir, "dev.db");
    if (!existsSync(extractedDbPath)) {
      checks.push({ name: "SQLITE_INTEGRITY_CHECK", passed: false, detail: "dev.db tidak ada di dalam backup." });
      return finish();
    }

    const { PrismaClient } = await import("@/lib/generated/prisma/client");
    const { PrismaBetterSqlite3 } = await import("@prisma/adapter-better-sqlite3");
    const adapter = new PrismaBetterSqlite3({ url: `file:${extractedDbPath}` });
    const tempPrisma = new PrismaClient({ adapter });

    try {
      try {
        // PRAGMA statements only — fixed strings, no user input, safe with $queryRawUnsafe.
        const integrity = await tempPrisma.$queryRawUnsafe<Array<{ integrity_check: string }>>(
          "PRAGMA integrity_check"
        );
        const sqliteOk = integrity.length === 1 && integrity[0].integrity_check === "ok";
        checks.push({
          name: "SQLITE_INTEGRITY_CHECK",
          passed: sqliteOk,
          detail: sqliteOk ? "PRAGMA integrity_check: ok." : `Gagal: ${JSON.stringify(integrity).slice(0, 300)}`,
        });

        const fkViolations = await tempPrisma.$queryRawUnsafe<unknown[]>("PRAGMA foreign_key_check");
        checks.push({
          name: "SQLITE_FOREIGN_KEY_CHECK",
          passed: fkViolations.length === 0,
          detail: fkViolations.length === 0 ? "Tidak ada pelanggaran foreign key." : `${fkViolations.length} pelanggaran foreign key.`,
        });
      } catch (err) {
        checks.push({
          name: "SQLITE_INTEGRITY_CHECK",
          passed: false,
          detail: `Gagal membuka/query dev.db: ${err instanceof Error ? err.message : "unknown error"}`,
        });
        return finish();
      }

      // 4. Prisma read test + table validation
      let sampleDoc: {
        filePath: string;
        mimeType: string;
        ocrRawText: string | null;
        fieldGuesses: unknown;
      } | null = null;
      try {
        const [customerCount, docCount, riskCount, activityCount] = await Promise.all([
          tempPrisma.customer.count(),
          tempPrisma.customerDocument.count(),
          tempPrisma.riskAssessment.count(),
          tempPrisma.activityLogEntry.count(),
        ]);
        checks.push({
          name: "PRISMA_TABLE_READ",
          passed: true,
          detail: `Customer=${customerCount}, CustomerDocument=${docCount}, RiskAssessment=${riskCount}, ActivityLogEntry=${activityCount}.`,
        });

        const doc = await tempPrisma.customerDocument.findFirst({
          where: { OR: [{ ocrRawText: { not: null } }, { fieldGuesses: { not: undefined } }] },
        });
        if (doc) {
          sampleDoc = {
            filePath: doc.filePath,
            mimeType: doc.mimeType,
            ocrRawText: doc.ocrRawText,
            fieldGuesses: doc.fieldGuesses,
          };
        }
      } catch (err) {
        checks.push({
          name: "PRISMA_TABLE_READ",
          passed: false,
          detail: `Gagal membaca tabel via Prisma: ${err instanceof Error ? err.message : "unknown error"}`,
        });
        return finish();
      }

      // 5. Encrypted file + OCR field decrypt validation (best-effort sample)
      if (sampleDoc) {
        const { decryptDocumentBuffer, decryptString, decryptJsonField } = await import("@/lib/documentEncryption");
        const { matchesFileSignature } = await import("@/lib/fileSignature");

        try {
          const filePath = path.join(tempDir, "uploads", sampleDoc.filePath);
          const encrypted = await readFile(filePath);
          const plaintext = decryptDocumentBuffer(encrypted);
          const sigOk = matchesFileSignature(sampleDoc.mimeType, plaintext);
          checks.push({
            name: "ENCRYPTED_FILE_DECRYPT",
            passed: sigOk,
            detail: sigOk
              ? "Sample dokumen berhasil didekripsi, magic bytes cocok."
              : "Dekripsi berhasil tapi magic bytes tidak cocok dengan MIME type tersimpan.",
          });
        } catch (err) {
          checks.push({
            name: "ENCRYPTED_FILE_DECRYPT",
            passed: false,
            detail: `Gagal mendekripsi sample dokumen: ${err instanceof Error ? err.message : "unknown error"}`,
          });
        }

        try {
          if (sampleDoc.ocrRawText) decryptString(sampleDoc.ocrRawText);
          if (sampleDoc.fieldGuesses) decryptJsonField(sampleDoc.fieldGuesses);
          checks.push({ name: "OCR_FIELD_DECRYPT", passed: true, detail: "Field OCR sample berhasil didekripsi." });
        } catch (err) {
          checks.push({
            name: "OCR_FIELD_DECRYPT",
            passed: false,
            detail: `Gagal mendekripsi field OCR sample: ${err instanceof Error ? err.message : "unknown error"}`,
          });
        }
      } else {
        checks.push({
          name: "ENCRYPTED_FILE_DECRYPT",
          passed: true,
          detail: "Tidak ada dokumen di backup untuk divalidasi (dataset kosong) — dilewati, bukan kegagalan.",
        });
        checks.push({
          name: "OCR_FIELD_DECRYPT",
          passed: true,
          detail: "Tidak ada field OCR di backup untuk divalidasi (dataset kosong) — dilewati, bukan kegagalan.",
        });
      }
    } finally {
      await tempPrisma.$disconnect();
    }

    return finish();
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}
