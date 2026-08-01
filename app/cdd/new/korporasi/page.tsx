import type { Metadata } from "next";
import { CorporateForm } from "@/components/forms/CorporateForm";
import { loadDraftDocument } from "@/lib/actions/document";

export const metadata: Metadata = {
  title: "CDD Baru — Korporasi",
};

export default async function NewCorporateCddPage({
  searchParams,
}: {
  searchParams: Promise<{ draftUploadId?: string }>;
}) {
  const { draftUploadId } = await searchParams;
  const ocrDraft = draftUploadId
    ? await loadDraftDocument(draftUploadId, "KORPORASI")
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">
          CDD Baru — Korporasi
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Isi field bertanda <span className="text-red-600">*</span> sebelum
          menyimpan. Field lain boleh dilengkapi belakangan.
        </p>
      </div>
      <CorporateForm ocrDraft={ocrDraft} />
    </div>
  );
}
