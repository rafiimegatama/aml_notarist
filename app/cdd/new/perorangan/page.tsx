import type { Metadata } from "next";
import { IndividualForm } from "@/components/forms/IndividualForm";
import { loadDraftDocument } from "@/lib/actions/document";

export const metadata: Metadata = {
  title: "CDD Baru — Perorangan",
};

export default async function NewIndividualCddPage({
  searchParams,
}: {
  searchParams: Promise<{ draftUploadId?: string }>;
}) {
  const { draftUploadId } = await searchParams;
  const ocrDraft = draftUploadId
    ? await loadDraftDocument(draftUploadId, "PERORANGAN")
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">
          CDD Baru — Perorangan
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Isi field bertanda <span className="text-red-600">*</span> sebelum
          menyimpan. Field lain boleh dilengkapi belakangan.
        </p>
      </div>
      <IndividualForm ocrDraft={ocrDraft} />
    </div>
  );
}
