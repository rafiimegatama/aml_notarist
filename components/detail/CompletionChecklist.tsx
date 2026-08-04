import type { CompletionBreakdown } from "@/lib/status";
import { riskCategoryLabels } from "@/lib/labels";

type Row = { label: string; href: string; state: "done" | "pending" | "hidden" };

/** FR-4 — widget checklist di atas app/cdd/[id]/page.tsx, murni tampilan dari CompletionBreakdown (lib/status.ts). */
export function CompletionChecklist({
  breakdown,
}: {
  breakdown: CompletionBreakdown;
}) {
  const rows: Row[] = [
    {
      label: "CDD Dasar",
      href: "#cdd-dasar",
      state: breakdown.cddDasar === "filled" ? "done" : "pending",
    },
    {
      label: "Kuasa Korporasi",
      href: "#power-of-attorney",
      state:
        breakdown.powerOfAttorney === "not_applicable"
          ? "hidden"
          : breakdown.powerOfAttorney === "filled"
            ? "done"
            : "pending",
    },
    {
      label: `Pemilik Manfaat (${breakdown.beneficialOwnerCount} orang)`,
      href: "#beneficial-owner",
      state: "done", // informasional — 0 tetap valid, lihat PRD FR-4
    },
    {
      label: "Info Jasa Notaris",
      href: "#notary-service",
      state: breakdown.notaryService === "filled" ? "done" : "pending",
    },
    {
      label:
        breakdown.riskAssessment === "scored"
          ? `Risk Assessment (${breakdown.riskCategory ? riskCategoryLabels[breakdown.riskCategory] : "-"})`
          : "Risk Assessment",
      href: "#risk-assessment",
      state: breakdown.riskAssessment === "scored" ? "done" : "pending",
    },
    {
      label:
        breakdown.edd === "manual_required"
          ? "EDD (proses manual di luar aplikasi)"
          : "EDD",
      href: "#edd",
      state:
        breakdown.edd === "not_applicable"
          ? "hidden"
          : breakdown.edd === "filled"
            ? "done"
            : "pending",
    },
  ];

  const visibleRows = rows.filter((r) => r.state !== "hidden");

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">
          Kelengkapan CDD
        </h2>
        <span className="text-sm font-medium text-gray-600">
          {breakdown.completed}/{breakdown.total} lengkap
        </span>
      </div>
      <ul className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {visibleRows.map((row) => (
          <li key={row.label} className="text-sm">
            <a href={row.href} className="hover:underline">
              <span
                className={
                  row.state === "done"
                    ? "mr-1.5 text-green-600"
                    : "mr-1.5 text-amber-600"
                }
                aria-hidden
              >
                {row.state === "done" ? "✓" : "✗"}
              </span>
              <span className={row.state === "done" ? "text-gray-700" : "text-gray-900"}>
                {row.label}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
