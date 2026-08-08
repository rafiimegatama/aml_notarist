import { describe, expect, it } from "vitest";
import { decryptDocumentBuffer, encryptDocumentBuffer } from "@/lib/documentEncryption";

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
