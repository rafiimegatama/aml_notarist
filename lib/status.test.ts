import { describe, expect, it } from "vitest";
import { computeCompletionBreakdown, type CustomerForStatus } from "@/lib/status";

/**
 * computeCompletionBreakdown() wraps the same deriveCompletionBreakdown()
 * used internally by computeAndPersistStatus() (see lib/status.ts) — testing
 * it exercises every status-determining branch without needing a live DB,
 * since the function that decides COMPLETE vs DRAFT is `overallComplete`
 * here, and computeAndPersistStatus() just persists it (see acceptance
 * criteria, Phase 6 of aml_phase_2_brief.md).
 */

type Overrides = {
  type?: CustomerForStatus["type"];
  corporateDetail?: object | null;
  individualDetail?: object | null;
  legalArrangementDetail?: object | null;
  powerOfAttorney?: object | null;
  notaryService?: object | null;
  riskAssessment?: {
    totalScore: number | null;
    riskCategory: "RENDAH" | "SEDANG" | "TINGGI" | null;
    isPep: boolean | null;
    adaBeritaNegatif: boolean | null;
  } | null;
  highRiskAdditionalInfo?: object | null;
  beneficialOwners?: object[];
};

function makeCustomer(overrides: Overrides = {}): CustomerForStatus {
  return {
    type: overrides.type ?? "PERORANGAN",
    corporateDetail: overrides.corporateDetail ?? null,
    individualDetail: overrides.individualDetail ?? null,
    legalArrangementDetail: overrides.legalArrangementDetail ?? null,
    powerOfAttorney: overrides.powerOfAttorney ?? null,
    notaryService: overrides.notaryService ?? null,
    riskAssessment: overrides.riskAssessment ?? null,
    highRiskAdditionalInfo: overrides.highRiskAdditionalInfo ?? null,
    beneficialOwners: overrides.beneficialOwners ?? [],
  } as unknown as CustomerForStatus;
}

const scored = (riskCategory: "RENDAH" | "SEDANG" | "TINGGI", totalScore = 20) => ({
  totalScore,
  riskCategory,
  isPep: false,
  adaBeritaNegatif: false,
});

describe("computeCompletionBreakdown — cddDasar / cddComplete branch", () => {
  it("PERORANGAN without individualDetail -> not_filled, overall incomplete", () => {
    const b = computeCompletionBreakdown(makeCustomer({ type: "PERORANGAN" }));
    expect(b.cddDasar).toBe("not_filled");
    expect(b.overallComplete).toBe(false);
  });

  it("KORPORASI without corporateDetail -> not_filled", () => {
    const b = computeCompletionBreakdown(makeCustomer({ type: "KORPORASI" }));
    expect(b.cddDasar).toBe("not_filled");
    expect(b.overallComplete).toBe(false);
  });

  it("LEGAL_ARRANGEMENT without legalArrangementDetail -> not_filled", () => {
    const b = computeCompletionBreakdown(makeCustomer({ type: "LEGAL_ARRANGEMENT" }));
    expect(b.cddDasar).toBe("not_filled");
  });

  it("LEGAL_ARRANGEMENT with legalArrangementDetail -> filled", () => {
    const b = computeCompletionBreakdown(
      makeCustomer({ type: "LEGAL_ARRANGEMENT", legalArrangementDetail: {} })
    );
    expect(b.cddDasar).toBe("filled");
  });
});

describe("computeCompletionBreakdown — powerOfAttorney branch (KORPORASI only)", () => {
  it("non-KORPORASI -> not_applicable regardless of value", () => {
    const b = computeCompletionBreakdown(makeCustomer({ type: "PERORANGAN" }));
    expect(b.powerOfAttorney).toBe("not_applicable");
  });

  it("KORPORASI without powerOfAttorney -> not_filled, blocks cddComplete", () => {
    const b = computeCompletionBreakdown(
      makeCustomer({
        type: "KORPORASI",
        corporateDetail: {},
        notaryService: {},
      })
    );
    expect(b.powerOfAttorney).toBe("not_filled");
    expect(b.overallComplete).toBe(false);
  });

  it("KORPORASI with powerOfAttorney -> filled, no longer blocks cddComplete", () => {
    const b = computeCompletionBreakdown(
      makeCustomer({
        type: "KORPORASI",
        corporateDetail: {},
        powerOfAttorney: {},
        notaryService: {},
        riskAssessment: scored("RENDAH"),
      })
    );
    expect(b.powerOfAttorney).toBe("filled");
    expect(b.overallComplete).toBe(true);
  });
});

describe("computeCompletionBreakdown — riskAssessment / riskComplete branch", () => {
  it("no riskAssessment row -> not_started", () => {
    const b = computeCompletionBreakdown(makeCustomer({}));
    expect(b.riskAssessment).toBe("not_started");
  });

  it("riskAssessment row with only isPep set, no score -> pep_only", () => {
    const b = computeCompletionBreakdown(
      makeCustomer({
        riskAssessment: { totalScore: null, riskCategory: null, isPep: true, adaBeritaNegatif: null },
      })
    );
    expect(b.riskAssessment).toBe("pep_only");
  });

  it("riskAssessment row with only adaBeritaNegatif set, no score -> pep_only", () => {
    const b = computeCompletionBreakdown(
      makeCustomer({
        riskAssessment: { totalScore: null, riskCategory: null, isPep: null, adaBeritaNegatif: false },
      })
    );
    expect(b.riskAssessment).toBe("pep_only");
  });

  it("riskAssessment with totalScore + riskCategory -> scored", () => {
    const b = computeCompletionBreakdown(makeCustomer({ riskAssessment: scored("RENDAH") }));
    expect(b.riskAssessment).toBe("scored");
  });
});

describe("computeCompletionBreakdown — eddOk branch (the Known Gap #2 hard-coded false path)", () => {
  it("PERORANGAN + TINGGI + no highRiskAdditionalInfo -> required_not_filled, incomplete", () => {
    const b = computeCompletionBreakdown(
      makeCustomer({
        type: "PERORANGAN",
        individualDetail: {},
        notaryService: {},
        riskAssessment: scored("TINGGI"),
      })
    );
    expect(b.edd).toBe("required_not_filled");
    expect(b.overallComplete).toBe(false);
  });

  it("PERORANGAN + TINGGI + highRiskAdditionalInfo present -> filled, can be complete", () => {
    const b = computeCompletionBreakdown(
      makeCustomer({
        type: "PERORANGAN",
        individualDetail: {},
        notaryService: {},
        riskAssessment: scored("TINGGI"),
        highRiskAdditionalInfo: {},
      })
    );
    expect(b.edd).toBe("filled");
    expect(b.overallComplete).toBe(true);
  });

  it("KORPORASI + TINGGI -> manual_required, ALWAYS incomplete even with everything else filled (hard-coded false, Known Gap #2)", () => {
    const b = computeCompletionBreakdown(
      makeCustomer({
        type: "KORPORASI",
        corporateDetail: {},
        powerOfAttorney: {},
        notaryService: {},
        riskAssessment: scored("TINGGI"),
        // no EDD form exists for Korporasi at all — nothing to fill in here
      })
    );
    expect(b.edd).toBe("manual_required");
    expect(b.overallComplete).toBe(false);
  });

  it("LEGAL_ARRANGEMENT + TINGGI -> manual_required, ALWAYS incomplete (same hard-coded path as KORPORASI)", () => {
    const b = computeCompletionBreakdown(
      makeCustomer({
        type: "LEGAL_ARRANGEMENT",
        legalArrangementDetail: {},
        notaryService: {},
        riskAssessment: scored("TINGGI"),
      })
    );
    expect(b.edd).toBe("manual_required");
    expect(b.overallComplete).toBe(false);
  });

  it("PERORANGAN + RENDAH/SEDANG -> edd not_applicable, EDD never blocks completion", () => {
    for (const category of ["RENDAH", "SEDANG"] as const) {
      const b = computeCompletionBreakdown(
        makeCustomer({
          type: "PERORANGAN",
          individualDetail: {},
          notaryService: {},
          riskAssessment: scored(category),
        })
      );
      expect(b.edd).toBe("not_applicable");
      expect(b.overallComplete).toBe(true);
    }
  });
});

describe("computeCompletionBreakdown — notaryService branch", () => {
  it("without notaryService -> not_filled in the breakdown/checklist", () => {
    const b = computeCompletionBreakdown(
      makeCustomer({
        type: "PERORANGAN",
        individualDetail: {},
        riskAssessment: scored("RENDAH"),
      })
    );
    expect(b.notaryService).toBe("not_filled");
  });

  // Characterization test, not a spec: `overallComplete` (the field that
  // drives Customer.status COMPLETE/DRAFT in computeAndPersistStatus) is
  // defined as `cddComplete && riskComplete && eddOk` in lib/status.ts —
  // notaryService is NOT one of its inputs, even though it IS counted in
  // completed/total for the UI checklist. So a customer can reach COMPLETE
  // status with "Layanan Notaris" still unfilled. Documented here so a
  // future change to this is a deliberate decision, not an accidental
  // regression discovered by a failing test.
  it("overallComplete does NOT depend on notaryService (current behavior, not necessarily intended)", () => {
    const b = computeCompletionBreakdown(
      makeCustomer({
        type: "PERORANGAN",
        individualDetail: {},
        riskAssessment: scored("RENDAH"),
        // notaryService intentionally omitted
      })
    );
    expect(b.notaryService).toBe("not_filled");
    expect(b.overallComplete).toBe(true);
  });
});

describe("computeCompletionBreakdown — completed/total counters", () => {
  it("counts only applicable rows, excludes not_applicable EDD/PoA from the ratio", () => {
    const b = computeCompletionBreakdown(
      makeCustomer({
        type: "PERORANGAN",
        individualDetail: {},
        notaryService: {},
        riskAssessment: scored("RENDAH"),
      })
    );
    // PERORANGAN + non-TINGGI: applicable rows are cddDasar, notaryService,
    // riskAssessment (PoA + EDD both not_applicable) -> total 3, all filled -> 3.
    expect(b.total).toBe(3);
    expect(b.completed).toBe(3);
  });

  it("KORPORASI + TINGGI counts EDD as an applicable-but-incomplete row", () => {
    const b = computeCompletionBreakdown(
      makeCustomer({
        type: "KORPORASI",
        corporateDetail: {},
        powerOfAttorney: {},
        notaryService: {},
        riskAssessment: scored("TINGGI"),
      })
    );
    // applicable: cddDasar, PoA, notaryService, riskAssessment, edd -> total 5
    expect(b.total).toBe(5);
    expect(b.completed).toBe(4); // everything but edd
  });

  it("passes through beneficialOwnerCount unchanged", () => {
    const b = computeCompletionBreakdown(makeCustomer({ beneficialOwners: [{}, {}, {}] }));
    expect(b.beneficialOwnerCount).toBe(3);
  });
});

describe("newStatus derivation (mirrors computeAndPersistStatus's COMPLETE/DRAFT branch)", () => {
  it("overallComplete true -> would persist COMPLETE", () => {
    const b = computeCompletionBreakdown(
      makeCustomer({
        type: "PERORANGAN",
        individualDetail: {},
        notaryService: {},
        riskAssessment: scored("RENDAH"),
      })
    );
    const newStatus = b.overallComplete ? "COMPLETE" : "DRAFT";
    expect(newStatus).toBe("COMPLETE");
  });

  it("overallComplete false -> would persist DRAFT", () => {
    const b = computeCompletionBreakdown(makeCustomer({ type: "PERORANGAN" }));
    const newStatus = b.overallComplete ? "COMPLETE" : "DRAFT";
    expect(newStatus).toBe("DRAFT");
  });
});
