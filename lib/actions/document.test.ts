import { describe, expect, it } from "vitest";
import { uploadAndExtractDocument } from "@/lib/actions/document";

/**
 * UPLOAD-004 (security hardening pass). Oversized files are rejected before
 * any file-signature check, OCR, or disk write — cheap and fast to test
 * directly since the size check short-circuits before anything expensive
 * (OCR/Tesseract) runs.
 */
describe("UPLOAD-004: oversized file rejected", () => {
  it("rejects a file larger than the 15MB limit without touching disk/OCR", async () => {
    const oversized = new File([new Uint8Array(15 * 1024 * 1024 + 1)], "big.jpg", { type: "image/jpeg" });
    const formData = new FormData();
    formData.set("file", oversized);

    const result = await uploadAndExtractDocument("PERORANGAN", formData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/15MB/);
    }
  });

  it("rejects a request with no file at all", async () => {
    const formData = new FormData();
    const result = await uploadAndExtractDocument("PERORANGAN", formData);
    expect(result.success).toBe(false);
  });
});
