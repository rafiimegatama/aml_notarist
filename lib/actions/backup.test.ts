import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import unzipper from "unzipper";
import { buildBackupZip } from "@/lib/backupArchive";

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

    expect(names).toEqual(["dev.db", "uploads/scan-a.enc", "uploads/scan-b.enc"]);

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

  it("records lastManualBackupAt / fileName in meta.json next to the zip (never mistaking silence for success)", async () => {
    const { dbPath, uploadDir, backupDir } = await setupFixture();

    const result = await buildBackupZip({ dbPath, uploadDir, backupDir });
    expect(result.success).toBe(true);
    if (!result.success) return;

    const meta = JSON.parse(await readFile(path.join(backupDir, "meta.json"), "utf-8"));
    expect(meta.fileName).toBe(result.fileName);
    expect(meta.lastManualBackupAt).toBe(result.createdAt);
  });
});
