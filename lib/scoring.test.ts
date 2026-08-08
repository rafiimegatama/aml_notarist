import { describe, expect, it } from "vitest";
import { computeRiskCategory, RISK_CATEGORY_RANGES } from "@/lib/scoring";

// reference-data.md bagian 6 — RENDAH 12-21, SEDANG 22-31, TINGGI 32-40.
describe("computeRiskCategory", () => {
  it("maps the lower boundary of each range", () => {
    expect(computeRiskCategory(12)).toBe("RENDAH");
    expect(computeRiskCategory(22)).toBe("SEDANG");
    expect(computeRiskCategory(32)).toBe("TINGGI");
  });

  it("maps the upper boundary of each range", () => {
    expect(computeRiskCategory(21)).toBe("RENDAH");
    expect(computeRiskCategory(31)).toBe("SEDANG");
    expect(computeRiskCategory(40)).toBe("TINGGI");
  });

  it("maps a mid-range value of each category", () => {
    expect(computeRiskCategory(15)).toBe("RENDAH");
    expect(computeRiskCategory(27)).toBe("SEDANG");
    expect(computeRiskCategory(36)).toBe("TINGGI");
  });

  it("returns null below the lowest defined range", () => {
    expect(computeRiskCategory(11)).toBeNull();
    expect(computeRiskCategory(0)).toBeNull();
    expect(computeRiskCategory(-5)).toBeNull();
  });

  it("returns null above the highest defined range", () => {
    expect(computeRiskCategory(41)).toBeNull();
    expect(computeRiskCategory(100)).toBeNull();
  });

  it("ranges are contiguous and non-overlapping (guards against a bad edit to RISK_CATEGORY_RANGES)", () => {
    const sorted = [...RISK_CATEGORY_RANGES].sort((a, b) => a.min - b.min);
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i].min).toBe(sorted[i - 1].max + 1);
    }
  });
});
