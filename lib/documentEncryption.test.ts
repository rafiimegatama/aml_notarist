import { afterEach, describe, expect, it } from "vitest";
import {
  decryptDocumentBuffer,
  decryptJsonField,
  decryptString,
  encryptDocumentBuffer,
  encryptJson,
  encryptString,
  isKeySeparationConfigured,
} from "@/lib/documentEncryption";

describe("documentEncryption (Phase 3 — encrypt PII at rest)", () => {
  it("round-trips arbitrary binary content exactly", () => {
    const plaintext = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00]);
    const encrypted = encryptDocumentBuffer(plaintext);
    const decrypted = decryptDocumentBuffer(encrypted);
    expect(decrypted.equals(plaintext)).toBe(true);
  });

  it("round-trips an empty buffer", () => {
    const plaintext = Buffer.alloc(0);
    const decrypted = decryptDocumentBuffer(encryptDocumentBuffer(plaintext));
    expect(decrypted.equals(plaintext)).toBe(true);
  });

  it("produces ciphertext that does not contain the plaintext magic bytes", () => {
    const jpegMagic = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
    const encrypted = encryptDocumentBuffer(jpegMagic);
    expect(encrypted.subarray(0, 4).equals(jpegMagic)).toBe(false);
  });

  it("produces different ciphertext for the same plaintext on each call (random IV)", () => {
    const plaintext = Buffer.from("same content every time");
    const a = encryptDocumentBuffer(plaintext);
    const b = encryptDocumentBuffer(plaintext);
    expect(a.equals(b)).toBe(false);
  });

  it("rejects tampered ciphertext via the GCM auth tag instead of returning garbage", () => {
    const encrypted = encryptDocumentBuffer(Buffer.from("sensitive KTP scan bytes"));
    const tampered = Buffer.from(encrypted);
    tampered[tampered.length - 1] ^= 0xff;
    expect(() => decryptDocumentBuffer(tampered)).toThrow();
  });

  it("fails to decrypt with a different key (simulates a changed SESSION_SECRET)", () => {
    const original = process.env.SESSION_SECRET;
    const encrypted = encryptDocumentBuffer(Buffer.from("secret payload"));
    process.env.SESSION_SECRET = "a-completely-different-secret";
    expect(() => decryptDocumentBuffer(encrypted)).toThrow();
    process.env.SESSION_SECRET = original;
  });
});

describe("string/JSON encryption (OCR data at rest)", () => {
  it("encryptString/decryptString round-trips text", () => {
    const text = "Nama: BUDI SANTOSO\nNIK: 3174052501900001";
    const encrypted = encryptString(text);
    expect(encrypted).toMatch(/^\$enc\$v1\$/);
    expect(decryptString(encrypted)).toBe(text);
  });

  it("decryptString returns legacy plaintext as-is", () => {
    const legacy = "ini teks OCR lama tanpa enkripsi";
    expect(decryptString(legacy)).toBe(legacy);
  });

  it("encryptJson/decryptJsonField round-trips objects", () => {
    const guesses = { "nama": "BUDI", "nik": "3174052501900001" };
    const encrypted = encryptJson(guesses);
    expect(typeof encrypted).toBe("string");
    expect(encrypted).toMatch(/^\$enc\$v1\$/);
    expect(decryptJsonField(encrypted)).toEqual(guesses);
  });

  it("decryptJsonField handles legacy parsed objects", () => {
    const legacy = { nama: "BUDI" };
    expect(decryptJsonField(legacy)).toEqual(legacy);
  });

  it("decryptJsonField returns null for null/undefined", () => {
    expect(decryptJsonField(null)).toBeNull();
    expect(decryptJsonField(undefined)).toBeNull();
  });
});

/**
 * CRYPTO-001..006 (security hardening pass — key separation). These set
 * DATA_ENCRYPTION_KEY/DOCUMENT_ENCRYPTION_KEY directly on process.env for
 * the duration of each test and restore the originals in afterEach — same
 * pattern as the existing SESSION_SECRET-swap test above.
 */
describe("key separation (v2 format, DATA_ENCRYPTION_KEY / DOCUMENT_ENCRYPTION_KEY)", () => {
  const originalData = process.env.DATA_ENCRYPTION_KEY;
  const originalDoc = process.env.DOCUMENT_ENCRYPTION_KEY;
  const originalSession = process.env.SESSION_SECRET;

  function setKeys() {
    process.env.DATA_ENCRYPTION_KEY = "test-data-key-not-a-real-secret";
    process.env.DOCUMENT_ENCRYPTION_KEY = "test-document-key-not-a-real-secret";
  }

  afterEach(() => {
    process.env.DATA_ENCRYPTION_KEY = originalData;
    process.env.DOCUMENT_ENCRYPTION_KEY = originalDoc;
    process.env.SESSION_SECRET = originalSession;
  });

  it("isKeySeparationConfigured is false when neither key is set (default/legacy behavior)", () => {
    delete process.env.DATA_ENCRYPTION_KEY;
    delete process.env.DOCUMENT_ENCRYPTION_KEY;
    expect(isKeySeparationConfigured()).toBe(false);
    expect(encryptString("x")).toMatch(/^\$enc\$v1\$/);
  });

  it("CRYPTO-001/002: with keys configured, new writes use v2 format and round-trip correctly", () => {
    setKeys();
    const text = "Nama: BUDI SANTOSO\nNIK: 3174052501900001";
    const encryptedString = encryptString(text);
    expect(encryptedString).toMatch(/^\$enc\$v2\$/);
    expect(decryptString(encryptedString)).toBe(text);

    const plaintext = Buffer.from("scan KTP bytes");
    const encryptedFile = encryptDocumentBuffer(plaintext);
    expect(decryptDocumentBuffer(encryptedFile).equals(plaintext)).toBe(true);
    // v2 files carry a format marker not present in v1 output.
    expect(encryptedFile.subarray(0, 8).toString("utf-8")).toBe("NTRDENC2");
  });

  it("CRYPTO-003: tampered v2 ciphertext is rejected via GCM auth tag (string and file)", () => {
    setKeys();
    const encryptedFile = encryptDocumentBuffer(Buffer.from("sensitive bytes"));
    const tamperedFile = Buffer.from(encryptedFile);
    tamperedFile[tamperedFile.length - 1] ^= 0xff;
    expect(() => decryptDocumentBuffer(tamperedFile)).toThrow();

    const encryptedString = encryptString("rahasia OCR");
    const tamperedString = encryptedString.slice(0, -4) + "abcd";
    expect(() => decryptString(tamperedString)).toThrow();
  });

  it("CRYPTO-004: wrong DATA_ENCRYPTION_KEY / DOCUMENT_ENCRYPTION_KEY is rejected", () => {
    setKeys();
    const encryptedString = encryptString("rahasia OCR");
    const encryptedFile = encryptDocumentBuffer(Buffer.from("rahasia file"));

    process.env.DATA_ENCRYPTION_KEY = "a-completely-different-data-key";
    expect(() => decryptString(encryptedString)).toThrow();

    process.env.DOCUMENT_ENCRYPTION_KEY = "a-completely-different-document-key";
    expect(() => decryptDocumentBuffer(encryptedFile)).toThrow();
  });

  it("SESSION_SECRET alone cannot decrypt v2 OCR data or v2 documents", () => {
    setKeys();
    const encryptedString = encryptString("rahasia OCR v2");
    const encryptedFile = encryptDocumentBuffer(Buffer.from("rahasia file v2"));

    // Rotate SESSION_SECRET only — v2 data must be unaffected, and there is
    // no code path that derives the v2 key from SESSION_SECRET at all.
    process.env.SESSION_SECRET = "rotated-session-secret";
    expect(decryptString(encryptedString)).toBe("rahasia OCR v2");
    expect(decryptDocumentBuffer(encryptedFile).equals(Buffer.from("rahasia file v2"))).toBe(true);
  });

  it("CRYPTO-006: rotating SESSION_SECRET after 'migration' does not break already-migrated (v2) data, only legacy (v1) data", () => {
    // Encrypt one record BEFORE key separation (v1, SESSION_SECRET-derived)
    // and one AFTER (v2, dedicated key) — simulates the pre/post-migration
    // boundary without needing the full DB-backed migration script.
    delete process.env.DATA_ENCRYPTION_KEY;
    delete process.env.DOCUMENT_ENCRYPTION_KEY;
    const legacyEncrypted = encryptString("data lama sebelum migrasi");

    setKeys();
    const migratedEncrypted = encryptString("data setelah migrasi");

    process.env.SESSION_SECRET = "rotated-after-migration";

    // v1 (legacy, un-migrated) data is now unreadable — expected and
    // documented: only DATA_ENCRYPTION_KEY/DOCUMENT_ENCRYPTION_KEY-derived
    // (v2) data survives a SESSION_SECRET rotation.
    expect(() => decryptString(legacyEncrypted)).toThrow();
    // v2 (migrated) data is completely unaffected by the rotation.
    expect(decryptString(migratedEncrypted)).toBe("data setelah migrasi");
  });
});
