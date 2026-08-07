import { CheckCircle2, Circle, ListChecks } from "lucide-react";
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
    <section className="card p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-subtle text-brand-hover">
            <ListChecks className="h-4 w-4" strokeWidth={2} />
          </span>
          <h2 className="text-sm font-bold text-slate-900">Kelengkapan CDD</h2>
        </div>
        <span className="text-sm font-semibold text-muted">
          {breakdown.completed}/{breakdown.total} lengkap
        </span>
      </div>
      <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {visibleRows.map((row) => (
          <li key={row.label} className="text-sm">
            <a
              href={row.href}
              className="flex items-center gap-2 rounded-lg px-1.5 py-1 transition-colors hover:bg-canvas hover:underline"
            >
              {row.state === "done" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[#15803d]" strokeWidth={2} />
              ) : (
                <Circle className="h-4 w-4 shrink-0 text-[#b45309]" strokeWidth={2} />
              )}
              <span className={row.state === "done" ? "font-medium text-slate-700" : "font-semibold text-slate-900"}>
                {row.label}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
