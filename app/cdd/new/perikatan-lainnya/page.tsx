import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Scale } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { LegalArrangementForm } from "@/components/forms/LegalArrangementForm";
import { loadDraftDocument } from "@/lib/actions/document";
import { loadLegalArrangementPrefill } from "@/lib/actions/duplicateLookup";

export const metadata: Metadata = {
  title: "CDD Baru — Perikatan Lainnya",
};

export default async function NewLegalArrangementCddPage({
  searchParams,
}: {
  searchParams: Promise<{ draftUploadId?: string; prefillFromCustomerId?: string }>;
}) {
  const { draftUploadId, prefillFromCustomerId } = await searchParams;
  const ocrDraft = draftUploadId
    ? await loadDraftDocument(draftUploadId, "LEGAL_ARRANGEMENT")
    : null;
  const prefill = prefillFromCustomerId
    ? await loadLegalArrangementPrefill(prefillFromCustomerId)
    : null;

  return (
    <div className="space-y-8">
      <PageHeader
        icon={Scale}
        title="CDD Baru — Perikatan Lainnya"
        actions={
          <Link href="/cdd/new" className="btn btn-secondary px-4 py-2.5 text-sm">
            <ArrowLeft className="h-4 w-4" strokeWidth={2} />
            Kembali
          </Link>
        }
      />
      <p className="-mt-4 text-sm font-medium text-muted">
        Isi field bertanda <span className="text-red-600">*</span> sebelum
        menyimpan. Field lain boleh dilengkapi belakangan.
      </p>
      <LegalArrangementForm ocrDraft={ocrDraft} prefill={prefill} />
    </div>
  );
}
