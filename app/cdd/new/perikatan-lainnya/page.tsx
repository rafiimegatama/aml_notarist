import type { Metadata } from "next";
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
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">
          CDD Baru — Perikatan Lainnya
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Isi field bertanda <span className="text-red-600">*</span> sebelum
          menyimpan. Field lain boleh dilengkapi belakangan.
        </p>
      </div>
      <LegalArrangementForm ocrDraft={ocrDraft} prefill={prefill} />
    </div>
  );
}
