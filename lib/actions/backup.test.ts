import { createHash, randomUUID } from "node:crypto";
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import unzipper from "unzipper";
import { ZipArchive } from "archiver";
import { buildBackupZip, verifyBackupChecksum, verifyBackupRestore, type BackupMeta } from "@/lib/backupArchive";
import { DB_PATH, UPLOAD_DIR } from "@/lib/storage";

/**
 * Partial mock of node:fs/promises — delegates every call to the REAL
 * implementation (via importOriginal), just wraps writeFile/rename/unlink
 * in a vi.fn() so BACKUP-004 below can inspect call arguments. Built-in
 * Node modules have a frozen ESM namespace, so vi.spyOn() on an already-
 * resolved `await import("node:fs/promises")` throws ("Module namespace is
 * not configurable") — vi.mock's factory replaces the module at resolution
 * time instead, which does not hit that limitation. This mock is a no-op
 * behaviorally for every OTHER test in this file (all real I/O still runs).
 */
vi.mock("node:fs/promises", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs/promises")>();
  return { ...actual, writeFile: vi.fn(actual.writeFile), rename: vi.fn(actual.rename), unlink: vi.fn(actual.unlink) };
});
import { encryptDocumentBuffer, encryptJson, encryptString } from "@/lib/documentEncryption";

// Minimal valid 1x1 transparent PNG — real magic bytes + real (tiny) IDAT
// stream, not a mock, so matchesFileSignature()/decryptDocumentBuffer() in
// verifyBackupRestore exercise the actual code path.
const TEST_PNG = Buffer.from(
  "89504e470d0a1a0a0000000d4948445200000001000000010806000000" +
    "1f15c4890000000d4944415478da62606060600000000500015ab38a5f" +
    "0000000049454e44ae426082",
  "hex"
);

/**
 * FR-1.1 (Phase 4) — verifies the real zip-building logic end-to-end against
 * an isolated temp directory (never the notary's actual storage/), so this
 * never touches real client data on disk.
 *
 * Imports buildBackupZip() from lib/backupArchive.ts directly, NOT the
 * createBackup() Server Action from lib/actions/backup.ts — that action is
 * a public Next.js Server Action (reachable via direct POST by anyone with
 * a valid PIN session, regardless of what the UI sends), so it intentionally
 * takes zero arguments in production. The path-override parameter needed for
 * this test lives only in the non-"use server" module, which HTTP can never
 * reach. See the comment on buildBackupZip for the full rationale.
 */
describe("buildBackupZip — zip integrity", () => {
  let workDir: string | null = null;

  afterEach(async () => {
    if (workDir) await rm(workDir, { recursive: true, force: true });
    workDir = null;
  });

  async function setupFixture() {
    workDir = await mkdtemp(path.join(tmpdir(), "notary-backup-test-"));
    const dbPath = path.join(workDir, "dev.db");
    const uploadDir = path.join(workDir, "uploads");
    const backupDir = path.join(workDir, "backups");
    await writeFile(dbPath, "fake-sqlite-content");
    return { dbPath, uploadDir, backupDir };
  }

  it("produces a valid, restorable zip containing dev.db and an uploads/ entry for each file", async () => {
    const { dbPath, uploadDir, backupDir } = await setupFixture();
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, "scan-a.enc"), "ciphertext-a");
    await writeFile(path.join(uploadDir, "scan-b.enc"), "ciphertext-b");

    const result = await buildBackupZip({ dbPath, uploadDir, backupDir });
    expect(result.success).toBe(true);
    if (!result.success) return;

    const zipPath = path.join(backupDir, result.fileName);
    const directory = await unzipper.Open.file(zipPath);
    const names = directory.files.map((f) => f.path).sort();

    expect(names).toEqual(["dev.db", "manifest.json", "uploads/scan-a.enc", "uploads/scan-b.enc"]);

    const dbEntry = directory.files.find((f) => f.path === "dev.db")!;
    const dbContent = await dbEntry.buffer();
    expect(dbContent.toString("utf-8")).toBe("fake-sqlite-content");

    const scanEntry = directory.files.find((f) => f.path === "uploads/scan-a.enc")!;
    expect((await scanEntry.buffer()).toString("utf-8")).toBe("ciphertext-a");
  });

  it("still produces a valid zip when dev.db does not exist yet (fresh install)", async () => {
    const workDir2 = await mkdtemp(path.join(tmpdir(), "notary-backup-test-"));
    workDir = workDir2;
    const dbPath = path.join(workDir2, "does-not-exist.db");
    const uploadDir = path.join(workDir2, "uploads");
    const backupDir = path.join(workDir2, "backups");

    const result = await buildBackupZip({ dbPath, uploadDir, backupDir });
    expect(result.success).toBe(true);
    if (!result.success) return;

    const directory = await unzipper.Open.file(path.join(backupDir, result.fileName));
    const names = directory.files.map((f) => f.path);
    expect(names).not.toContain("dev.db");
  });

  it("records lastManualBackupAt / fileName / sha256 in meta.json", async () => {
    const { dbPath, uploadDir, backupDir } = await setupFixture();

    const result = await buildBackupZip({ dbPath, uploadDir, backupDir });
    expect(result.success).toBe(true);
    if (!result.success) return;

    const meta: BackupMeta = JSON.parse(await readFile(path.join(backupDir, "meta.json"), "utf-8"));
    expect(meta.fileName).toBe(result.fileName);
    expect(meta.lastManualBackupAt).toBe(result.createdAt);
    expect(meta.sha256).toMatch(/^[0-9a-f]{64}$/);

    // Verify checksum actually matches the zip file
    const zipBuf = await readFile(path.join(backupDir, result.fileName));
    const actual = createHash("sha256").update(zipBuf).digest("hex");
    expect(meta.sha256).toBe(actual);
  });

  it("includes manifest.json with per-file SHA-256 hashes", async () => {
    const { dbPath, uploadDir, backupDir } = await setupFixture();
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, "doc.enc"), "encrypted-data");

    const result = await buildBackupZip({ dbPath, uploadDir, backupDir });
    expect(result.success).toBe(true);
    if (!result.success) return;

    const zipPath = path.join(backupDir, result.fileName);
    const directory = await unzipper.Open.file(zipPath);
    const manifestEntry = directory.files.find((f) => f.path === "manifest.json");
    expect(manifestEntry).toBeDefined();

    const manifest = JSON.parse((await manifestEntry!.buffer()).toString("utf-8"));
    expect(manifest["dev.db"]).toMatch(/^[0-9a-f]{64}$/);
    expect(manifest["uploads/doc.enc"]).toMatch(/^[0-9a-f]{64}$/);

    // Verify the manifest hash matches actual file content
    const dbHash = createHash("sha256").update("fake-sqlite-content").digest("hex");
    expect(manifest["dev.db"]).toBe(dbHash);
  });

  it("verifyBackupChecksum detects valid and tampered zips", async () => {
    const { dbPath, uploadDir, backupDir } = await setupFixture();
    const result = await buildBackupZip({ dbPath, uploadDir, backupDir });
    expect(result.success).toBe(true);
    if (!result.success) return;

    const meta: BackupMeta = JSON.parse(await readFile(path.join(backupDir, "meta.json"), "utf-8"));
    const zipPath = path.join(backupDir, result.fileName);

    // Valid
    const valid = await verifyBackupChecksum(zipPath, meta.sha256);
    expect(valid.valid).toBe(true);

    // Wrong checksum
    const invalid = await verifyBackupChecksum(zipPath, "0".repeat(64));
    expect(invalid.valid).toBe(false);

    // Missing file
    const missing = await verifyBackupChecksum("/nonexistent.zip", meta.sha256);
    expect(missing.valid).toBe(false);
  });
});

/**
 * BACKUP-001..004 (security hardening pass) — verifyBackupRestore() actually
 * extracts+validates a backup instead of just re-hashing the zip. Uses a
 * COPY of the real prisma/dev.db (schema-correct SQLite file, read once via
 * plain file copy — never opened/written by anything other than a throwaway
 * temp Prisma client pointed at the copy) so the temp DB has the real
 * CustomerDocument schema without needing to run migrations from scratch.
 * The original dev.db is only ever read, never written; the fixture row
 * created below lives exclusively in the temp copy and is destroyed with
 * the whole temp directory in afterEach. storage/uploads/ (real) is never
 * touched — a separate temp uploads dir is used throughout.
 */
describe("verifyBackupRestore — restore verification actually opens the archive", () => {
  let workDir: string | null = null;

  afterEach(async () => {
    if (workDir) await rm(workDir, { recursive: true, force: true });
    workDir = null;
  });

  async function buildFixtureBackup() {
    workDir = await mkdtemp(path.join(tmpdir(), "notary-restore-test-"));
    const dbPath = path.join(workDir, "dev.db");
    const uploadDir = path.join(workDir, "uploads");
    const backupDir = path.join(workDir, "backups");
    await mkdir(uploadDir, { recursive: true });
    await copyFile(DB_PATH, dbPath);

    const { PrismaClient } = await import("@/lib/generated/prisma/client");
    const { PrismaBetterSqlite3 } = await import("@prisma/adapter-better-sqlite3");
    const tempPrisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: `file:${dbPath}` }) });
    const storedName = `${randomUUID()}.png`;
    const doc = await tempPrisma.customerDocument.create({
      data: {
        formType: "PERORANGAN",
        fileName: "test.png",
        filePath: storedName,
        mimeType: "image/png",
        ocrRawText: encryptString("hasil OCR uji verifikasi restore"),
        fieldGuesses: encryptJson({ nama: "Test Restore" }),
      },
    });
    await tempPrisma.$disconnect();
    await writeFile(path.join(uploadDir, storedName), encryptDocumentBuffer(TEST_PNG));

    const result = await buildBackupZip({ dbPath, uploadDir, backupDir });
    if (!result.success) throw new Error("fixture backup build failed: " + result.error);
    return { workDir, uploadDir, zipPath: path.join(backupDir, result.fileName), docId: doc.id };
  }

  it("BACKUP-001: a valid backup verifies (VERIFIED, all checks pass, sample document decrypts)", async () => {
    const { zipPath } = await buildFixtureBackup();
    const result = await verifyBackupRestore(zipPath);

    expect(result.status).toBe("VERIFIED");
    expect(result.checks.every((c) => c.passed)).toBe(true);
    const names = result.checks.map((c) => c.name);
    expect(names).toContain("SQLITE_INTEGRITY_CHECK");
    expect(names).toContain("PRISMA_TABLE_READ");
    expect(names).toContain("ENCRYPTED_FILE_DECRYPT");
    expect(names).toContain("OCR_FIELD_DECRYPT");
  });

  it("BACKUP-002: a corrupted zip fails verification (FAILED, extract step reported)", async () => {
    const { zipPath } = await buildFixtureBackup();
    const raw = await readFile(zipPath);
    // Corrupt bytes near the end (central directory) — reliably breaks
    // unzipper's ability to open the archive at all, unlike corrupting a
    // byte inside file content (which might just corrupt that one entry).
    const tampered = Buffer.from(raw);
    for (let i = tampered.length - 20; i < tampered.length; i++) tampered[i] ^= 0xff;
    const corruptPath = zipPath + ".corrupt";
    await writeFile(corruptPath, tampered);

    const result = await verifyBackupRestore(corruptPath);
    expect(result.status).toBe("FAILED");
    expect(result.checks.some((c) => c.name === "EXTRACT_ARCHIVE" && !c.passed)).toBe(true);
  });

  it("BACKUP-003: a backup whose manifest disagrees with actual file content fails verification", async () => {
    const { workDir: dir, zipPath } = await buildFixtureBackup();

    // Restore the valid zip to a scratch dir, corrupt the uploaded file's
    // bytes on disk, then re-zip WITHOUT touching manifest.json — this
    // reproduces "backup says X, disk has Y" (tamper/bit-rot/incomplete
    // copy), which FILE_EXISTENCE_AND_CHECKSUM exists to catch.
    const extractDir = path.join(dir!, "extract-for-corruption");
    const directory = await unzipper.Open.file(zipPath);
    await directory.extract({ path: extractDir, concurrency: 4 });
    const uploadedFiles = await import("node:fs/promises").then((fs) => fs.readdir(path.join(extractDir, "uploads")));
    const targetFile = path.join(extractDir, "uploads", uploadedFiles[0]);
    const original = await readFile(targetFile);
    const corrupted = Buffer.from(original);
    corrupted[0] ^= 0xff;
    await writeFile(targetFile, corrupted);

    const corruptZipPath = path.join(dir!, "corrupt-manifest-mismatch.zip");
    await new Promise<void>((resolve, reject) => {
      const output = createWriteStream(corruptZipPath);
      const archive = new ZipArchive({ zlib: { level: 9 } });
      output.on("close", () => resolve());
      output.on("error", reject);
      archive.on("error", reject);
      archive.pipe(output);
      archive.file(path.join(extractDir, "dev.db"), { name: "dev.db" });
      archive.file(path.join(extractDir, "manifest.json"), { name: "manifest.json" });
      archive.directory(path.join(extractDir, "uploads"), "uploads");
      archive.finalize();
    });

    const result = await verifyBackupRestore(corruptZipPath);
    expect(result.status).toBe("FAILED");
    expect(result.checks.some((c) => c.name === "FILE_EXISTENCE_AND_CHECKSUM" && !c.passed)).toBe(true);
  });

  it("BACKUP-004: verification never touches the real database/upload paths (isolated temp dirs only)", async () => {
    // NOTE: this does NOT diff DB_PATH's raw bytes before/after — other test
    // files in this suite legitimately create/delete real rows in the same
    // prisma/dev.db in parallel (customerEdit.test.ts, authorization.test.ts,
    // encryptionMigration.test.ts), so a byte-snapshot comparison here would
    // spuriously fail on THEIR writes, not ours. Instead this asserts the
    // real invariant directly against the module-level mocked writeFile/
    // rename/unlink (see vi.mock("node:fs/promises") above — delegates to
    // the real implementation, just makes calls inspectable): no write call
    // made during the whole fixture+verify flow ever targets DB_PATH or
    // UPLOAD_DIR.
    const fsPromises = await import("node:fs/promises");
    const writeFileMock = vi.mocked(fsPromises.writeFile);
    const renameMock = vi.mocked(fsPromises.rename);
    const unlinkMock = vi.mocked(fsPromises.unlink);
    writeFileMock.mockClear();
    renameMock.mockClear();
    unlinkMock.mockClear();

    const { zipPath } = await buildFixtureBackup();
    await verifyBackupRestore(zipPath);

    const disallowed = [DB_PATH, UPLOAD_DIR];
    const touchesRealPath = (args: unknown[]) =>
      disallowed.some((p) => typeof args[0] === "string" && args[0].startsWith(p));
    for (const mockFn of [writeFileMock, renameMock, unlinkMock]) {
      const offending = mockFn.mock.calls.filter(touchesRealPath);
      expect(offending).toEqual([]);
    }
  });
});
