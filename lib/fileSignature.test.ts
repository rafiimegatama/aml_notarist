import { describe, expect, it } from "vitest";
import { matchesFileSignature } from "@/lib/fileSignature";

describe("matchesFileSignature", () => {
  it("accepts a real JPEG magic-byte prefix", () => {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    expect(matchesFileSignature("image/jpeg", jpeg)).toBe(true);
  });

  it("accepts a real PNG magic-byte prefix", () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(matchesFileSignature("image/png", png)).toBe(true);
  });

  it("accepts a real WEBP (RIFF/WEBP) prefix", () => {
    const webp = Buffer.concat([
      Buffer.from("RIFF", "ascii"),
      Buffer.from([0x00, 0x00, 0x00, 0x00]),
      Buffer.from("WEBP", "ascii"),
    ]);
    expect(matchesFileSignature("image/webp", webp)).toBe(true);
  });

  it("rejects content that claims image/jpeg but is actually something else (spoofed file.type)", () => {
    const notAJpeg = Buffer.from("<html><script>alert(1)</script></html>");
    expect(matchesFileSignature("image/jpeg", notAJpeg)).toBe(false);
  });

  it("rejects a PNG claiming to be a JPEG (wrong signature for the claimed type)", () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(matchesFileSignature("image/jpeg", png)).toBe(false);
  });

  it("rejects unknown/unsupported MIME types outright", () => {
    const anything = Buffer.from([0x00, 0x01, 0x02]);
    expect(matchesFileSignature("application/octet-stream", anything)).toBe(false);
  });

  it("rejects buffers too short to contain a full signature", () => {
    expect(matchesFileSignature("image/png", Buffer.from([0x89, 0x50]))).toBe(false);
    expect(matchesFileSignature("image/jpeg", Buffer.alloc(0))).toBe(false);
  });
});
