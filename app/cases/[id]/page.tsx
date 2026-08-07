import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Fingerprint, ScanLine, ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { DetailSection, DetailItem, formatDate } from "@/components/detail/DetailPrimitives";
import { DocumentGallery } from "@/components/detail/DocumentGallery";
import { ActivityLogSection } from "@/components/detail/ActivityLogSection";
import { CaseAiPanel } from "@/components/cases/CaseAiPanel";
import { CaseDecisionPanel } from "@/components/cases/CaseDecisionPanel";
import { getCaseById, resolveCustomerDisplayNames } from "@/lib/actions/case";
import { customerTypeLabels, riskCategoryLabels } from "@/lib/labels";

const RISK_TONE: Record<string, BadgeTone> = { TINGGI: "danger", SEDANG: "warning", RENDAH: "success" };

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const kase = await getCaseById(id);
  const name =
    kase?.customer.corporateDetail?.namaKorporasi ??
    kase?.customer.individualDetail?.namaLengkap ??
    kase?.customer.legalArrangementDetail?.nama ??
    "Case";
  return { title: `Case — ${name}` };
}

export default async function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const kase = await getCaseById(id);
  if (!kase) notFound();

  const { customer } = kase;
  const displayName =
    customer.corporateDetail?.namaKorporasi ??
    customer.individualDetail?.namaLengkap ??
    customer.legalArrangementDetail?.nama ??
    "(tanpa nama)";

  const candidateNames = await resolveCustomerDisplayNames(kase.duplicateChecks.map((d) => d.candidateCustomerId));

  const documentsWithOcr = customer.documents.filter((d) => d.ocrRawText);

  return (
    <div className="space-y-8">
      <PageHeader
        title={displayName}
        description={`${customerTypeLabels[customer.type]} · Case dibuat ${formatDate(kase.createdAt)}`}
        icon={Fingerprint}
        actions={
          <>
            {customer.riskAssessment?.riskCategory && (
              <Badge tone={RISK_TONE[customer.riskAssessment.riskCategory] ?? "neutral"}>
                {riskCategoryLabels[customer.riskAssessment.riskCategory]}
              </Badge>
            )}
            <Link href={`/cdd/${customer.id}`} className="btn btn-secondary px-4 py-2 text-sm">
              <ArrowLeft className="h-4 w-4" strokeWidth={2} />
              Ke CDD Lengkap
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
        {/* LEFT — case data */}
        <div className="space-y-6">
          <DetailSection title="Ringkasan Risiko" icon={ShieldAlert}>
            <DetailItem
              label="Kategori Risiko"
              value={
                customer.riskAssessment?.riskCategory ? riskCategoryLabels[customer.riskAssessment.riskCategory] : null
              }
            />
            <DetailItem label="Total Nilai" value={customer.riskAssessment?.totalScore ?? null} />
            <DetailItem label="PEP" value={customer.riskAssessment?.isPep === true ? "Ya" : customer.riskAssessment?.isPep === false ? "Tidak" : null} />
            <DetailItem label="Status EDD" value={customer.highRiskAdditionalInfo ? "Sudah diisi" : "Belum diisi"} />
          </DetailSection>

          <div>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">Dokumen Terlampir</h2>
            <DocumentGallery
              documents={customer.documents.map((d) => ({
                id: d.id,
                fileName: d.fileName,
                mimeType: d.mimeType,
                createdAt: d.createdAt,
              }))}
            />
          </div>

          {documentsWithOcr.length > 0 && (
            <div className="card p-6 sm:p-7">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-subtle text-brand-hover">
                  <ScanLine className="h-[18px] w-[18px]" strokeWidth={2} />
                </span>
                <div>
                  <h2 className="text-base font-bold text-slate-900 sm:text-lg">Hasil OCR</h2>
                  <p className="mt-1 text-sm font-medium text-muted">Teks mentah hasil pembacaan otomatis, untuk cross-check manual.</p>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {documentsWithOcr.map((doc) => (
                  <details key={doc.id} className="rounded-xl border border-border-subtle p-3.5">
                    <summary className="cursor-pointer text-sm font-semibold text-slate-700">{doc.fileName}</summary>
                    <p className="mt-2 whitespace-pre-wrap text-xs font-medium text-muted">{doc.ocrRawText}</p>
                  </details>
                ))}
              </div>
            </div>
          )}

          <ActivityLogSection entries={customer.activityLog} />
        </div>

        {/* RIGHT — AI assistant + manual review + decision */}
        <div className="space-y-6">
          <CaseAiPanel
            caseId={kase.id}
            initialFindings={kase.aiFindings}
            initialDuplicateChecks={kase.duplicateChecks.map((d) => ({
              id: d.id,
              candidateCustomerId: d.candidateCustomerId,
              candidateName: candidateNames[d.candidateCustomerId] ?? "(tidak diketahui)",
              matchedFields: JSON.parse(d.matchedFields) as string[],
              confidencePercent: d.confidencePercent,
              stage: d.stage,
              recommendation: d.recommendation,
            }))}
          />
          <CaseDecisionPanel
            caseId={kase.id}
            status={kase.status}
            initialChecklist={
              kase.checklist
                ? {
                    identityVerified: kase.checklist.identityVerified,
                    sourceOfFundsReviewed: kase.checklist.sourceOfFundsReviewed,
                    sourceOfWealthReviewed: kase.checklist.sourceOfWealthReviewed,
                    beneficialOwnerConfirmed: kase.checklist.beneficialOwnerConfirmed,
                    documentsVerified: kase.checklist.documentsVerified,
                    aiRecommendationReviewed: kase.checklist.aiRecommendationReviewed,
                    regulationReviewed: kase.checklist.regulationReviewed,
                  }
                : null
            }
            decision={kase.decision}
          />
        </div>
      </div>
    </div>
  );
}
