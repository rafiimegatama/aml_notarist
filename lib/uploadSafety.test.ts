import { describe, expect, it } from "vitest";
import { generateStoredFilename } from "@/lib/uploadSafety";

/**
 * UPLOAD-001/002/003 (security hardening pass). generateStoredFilename()
 * takes NO filename input at all — by construction, a malicious client
 * filename can never influence the stored path, because there is no
 * parameter for it to flow through. These tests prove that property by
 * checking every returned name matches a strict UUID.ext pattern regardless
 * of what MIME type string is thrown at it (simulating a spoofed
 * Content-Type header attempting to smuggle a path).
 */
describe("generateStoredFilename — server-generated names only, no user input in the path", () => {
  const UUID_EXT_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/;

  it("UPLOAD-003: rejects (returns null) any MIME type not on the allowlist", () => {
    expect(generateStoredFilename("application/octet-stream")).toBeNull();
    expect(generateStoredFilename("text/html")).toBeNull();
    expect(generateStoredFilename("image/svg+xml")).toBeNull();
    expect(generateStoredFilename("")).toBeNull();
  });

  it("UPLOAD-001/002: MIME type strings crafted to look like path traversal or malicious filenames never influence the output — they are just rejected as unknown types", () => {
    const maliciousMimeAttempts = [
      "../../secret",
      "..\\..\\secret",
      "foo/../../secret",
      "image/jpeg\0.exe",
      "image/jpeg; filename=../../../etc/passwd",
    ];
    for (const attempt of maliciousMimeAttempts) {
      expect(generateStoredFilename(attempt)).toBeNull();
    }
  });

  it("accepts allowlisted types and always returns a strict UUID.ext name, never containing '..' or '/'", () => {
    for (const mime of ["image/jpeg", "image/png", "image/webp"]) {
      const name = generateStoredFilename(mime);
      expect(name).not.toBeNull();
      expect(name!).toMatch(UUID_EXT_RE);
      expect(name).not.toContain("..");
      expect(name).not.toContain("/");
      expect(name).not.toContain("\\");
    }
  });

  it("returns a different name on every call (no collision/predictability)", () => {
    const a = generateStoredFilename("image/png");
    const b = generateStoredFilename("image/png");
    expect(a).not.toBe(b);
  });
});
