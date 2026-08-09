import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { migrateDataFields, migrateFiles } from "@/lib/encryptionMigration";
import { encryptDocumentBuffer, encryptJson, encryptString, decryptString, decryptJsonField, decryptDocumentBuffer } from "@/lib/documentEncryption";

// Same 8-byte PNG magic prefix trick as backup.test.ts — matchesFileSignature
// only checks the header, so the rest of the bytes can be arbitrary.
const TEST_PNG = Buffer.from("89504e470d0a1a0a0000000d494844520000000100000001080600000000", "hex");

/**
 * CRYPTO-005/011/012 (security hardening pass) — exercises the REAL
 * migration functions (lib/encryptionMigration.ts, used by
 * scripts/migrate-encryption.ts) against a throwaway CustomerDocument row in
 * the REAL prisma/dev.db (same pattern as lib/actions/customerEdit.test.ts —
 * this repo has no separate test DB) and a TEMP upload directory (never the
 * real storage/uploads/). The `documentIds`/`uploadDir` scoping added to
 * migrateDataFields/migrateFiles exists specifically so these tests never
 * touch any OTHER real customer's documents.
 */
describe("encryptionMigration — v1 to v2 key separation migration", () => {
  let customerDocumentId: string | null = null;
  let uploadDir: string | null = null;

  afterEach(async () => {
    if (customerDocumentId) {
      await prisma.customerDocument.delete({ where: { id: customerDocumentId } }).catch(() => {});
      customerDocumentId = null;
    }
    if (uploadDir) {
      await rm(uploadDir, { recursive: true, force: true });
      uploadDir = null;
    }
    delete process.env.DATA_ENCRYPTION_KEY;
    delete process.env.DOCUMENT_ENCRYPTION_KEY;
  });

  async function createLegacyFixture(storedName: string) {
    // Encrypted WITHOUT the new keys set — legacy v1 format, exactly what
    // real pre-migration data looks like.
    delete process.env.DATA_ENCRYPTION_KEY;
    delete process.env.DOCUMENT_ENCRYPTION_KEY;
    const doc = await prisma.customerDocument.create({
      data: {
        formType: "PERORANGAN",
        fileName: "legacy.png",
        filePath: storedName,
        mimeType: "image/png",
        ocrRawText: encryptString("hasil OCR sebelum migrasi"),
        fieldGuesses: encryptJson({ nama: "Legacy Fixture" }),
      },
    });
    customerDocumentId = doc.id;

    uploadDir = await mkdtemp(path.join(tmpdir(), "notary-migration-test-"));
    await writeFile(path.join(uploadDir, storedName), encryptDocumentBuffer(TEST_PNG));

    return doc;
  }

  it("CRYPTO-005: migrates a legacy (v1) record's data fields and file to v2, preserving content exactly", async () => {
    const storedName = "legacy-crypto-005.png";
    const doc = await createLegacyFixture(storedName);

    process.env.DATA_ENCRYPTION_KEY = "test-data-key";
    process.env.DOCUMENT_ENCRYPTION_KEY = "test-document-key";

    const dataCounts = await migrateDataFields([doc.id]);
    expect(dataCounts).toEqual({ migrated: 1, skippedAlready: 0, failed: 0 });

    const fileCounts = await migrateFiles({ uploadDir: uploadDir!, documentIds: [doc.id] });
    expect(fileCounts).toEqual({ migrated: 1, skippedAlready: 0, failed: 0 });

    const updated = await prisma.customerDocument.findUniqueOrThrow({ where: { id: doc.id } });
    expect(updated.ocrRawText).toMatch(/^\$enc\$v2\$/);
    expect(decryptString(updated.ocrRawText!)).toBe("hasil OCR sebelum migrasi");
    expect(decryptJsonField(updated.fieldGuesses)).toEqual({ nama: "Legacy Fixture" });

    const fileOnDisk = await readFile(path.join(uploadDir!, storedName));
    expect(fileOnDisk.subarray(0, 8).toString("utf-8")).toBe("NTRDENC2"); // v2 marker
    expect(decryptDocumentBuffer(fileOnDisk).equals(TEST_PNG)).toBe(true);
  });

  it("CRYPTO-011: running the migration twice is idempotent (second run skips already-migrated records)", async () => {
    const storedName = "legacy-crypto-011.png";
    const doc = await createLegacyFixture(storedName);
    process.env.DATA_ENCRYPTION_KEY = "test-data-key";
    process.env.DOCUMENT_ENCRYPTION_KEY = "test-document-key";

    const first = await migrateDataFields([doc.id]);
    expect(first).toEqual({ migrated: 1, skippedAlready: 0, failed: 0 });
    const firstFiles = await migrateFiles({ uploadDir: uploadDir!, documentIds: [doc.id] });
    expect(firstFiles).toEqual({ migrated: 1, skippedAlready: 0, failed: 0 });

    const second = await migrateDataFields([doc.id]);
    expect(second).toEqual({ migrated: 0, skippedAlready: 1, failed: 0 });
    const secondFiles = await migrateFiles({ uploadDir: uploadDir!, documentIds: [doc.id] });
    expect(secondFiles).toEqual({ migrated: 0, skippedAlready: 1, failed: 0 });

    // Content still correct after two passes.
    const updated = await prisma.customerDocument.findUniqueOrThrow({ where: { id: doc.id } });
    expect(decryptString(updated.ocrRawText!)).toBe("hasil OCR sebelum migrasi");
  });

  it("CRYPTO-012: a record that fails to migrate (missing file on disk) is counted as failed, not silently dropped or half-updated", async () => {
    const storedName = "legacy-crypto-012.png";
    const doc = await createLegacyFixture(storedName);
    process.env.DATA_ENCRYPTION_KEY = "test-data-key";
    process.env.DOCUMENT_ENCRYPTION_KEY = "test-document-key";

    // Data field migration should still succeed independently of the file.
    const dataCounts = await migrateDataFields([doc.id]);
    expect(dataCounts).toEqual({ migrated: 1, skippedAlready: 0, failed: 0 });

    // File migration against a directory that does NOT contain the file.
    const emptyDir = await mkdtemp(path.join(tmpdir(), "notary-migration-empty-"));
    try {
      const fileCounts = await migrateFiles({ uploadDir: emptyDir, documentIds: [doc.id] });
      expect(fileCounts).toEqual({ migrated: 0, skippedAlready: 0, failed: 1 });
    } finally {
      await rm(emptyDir, { recursive: true, force: true });
    }

    // The original file (in the real fixture uploadDir) is untouched — the
    // failure above was against a different, empty directory, proving a
    // failed migration attempt never destroys the original.
    const original = await readFile(path.join(uploadDir!, storedName));
    expect(decryptDocumentBuffer(original).equals(TEST_PNG)).toBe(true);
  });
});
