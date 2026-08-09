import { describe, expect, it } from "vitest";
import { riskAssessmentSchema, highRiskAdditionalInfoSchema } from "@/lib/validations";
import { computeRiskCategory } from "@/lib/scoring";

/**
 * AI-001..003 (security hardening pass) — the actual server-side boundary
 * against a malicious/compromised client (or an AI suggestion) trying to
 * set an authoritative compliance value directly is the Zod input schema:
 * neither riskAssessmentSchema nor highRiskAdditionalInfoSchema declares a
 * riskCategory/approved/eddOk/complete field, and z.object() strips unknown
 * keys by default (no .passthrough() anywhere in this codebase, confirmed
 * separately during the Phase 0 audit) — so even if a client POSTs one of
 * these fields directly to the Server Action, it never reaches the database
 * write. The actual riskCategory value is always computed server-side by
 * computeRiskCategory() (lib/scoring.ts, pure function of totalScore) inside
 * lib/actions/riskAssessment.ts's saveRiskAssessment, never read from input.
 */
describe("AI-001: client cannot set an authoritative risk category directly", () => {
  it("riskAssessmentSchema strips a client-supplied riskCategory/totalScore instead of accepting it", () => {
    const malicious = {
      isPep: "TIDAK",
      userProfileScoreId: "some-id",
      // Attempted override — not a declared field of this schema.
      riskCategory: "RENDAH",
      totalScore: 1,
      approved: true,
    };
    const parsed = riskAssessmentSchema.safeParse(malicious);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).not.toHaveProperty("riskCategory");
      expect(parsed.data).not.toHaveProperty("totalScore");
      expect(parsed.data).not.toHaveProperty("approved");
    }
  });

  it("computeRiskCategory is a pure function of totalScore only — no way to influence it via unrelated fields", () => {
    expect(computeRiskCategory(15)).toBe("RENDAH");
    expect(computeRiskCategory(26)).toBe("SEDANG");
    expect(computeRiskCategory(36)).toBe("TINGGI");
  });
});

describe("AI-002/AI-003: client cannot mark a case approved/rejected or EDD complete via the EDD form schema", () => {
  it("highRiskAdditionalInfoSchema strips client-supplied approved/eddOk/eddComplete/rejected fields", () => {
    const malicious = {
      namaLengkap: "Test EDD",
      jenisIdentitas: "KTP",
      nomorIdentitas: "3174052501900001",
      // Attempted overrides — not declared fields of this schema.
      approved: true,
      eddOk: true,
      eddComplete: true,
      rejected: false,
    };
    const parsed = highRiskAdditionalInfoSchema.safeParse(malicious);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).not.toHaveProperty("approved");
      expect(parsed.data).not.toHaveProperty("eddOk");
      expect(parsed.data).not.toHaveProperty("eddComplete");
      expect(parsed.data).not.toHaveProperty("rejected");
    }
  });
});
