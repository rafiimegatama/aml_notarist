import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Building2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { CorporateForm } from "@/components/forms/CorporateForm";
import { loadDraftDocument } from "@/lib/actions/document";
import { loadCorporatePrefill } from "@/lib/actions/duplicateLookup";

export const metadata: Metadata = {
  title: "CDD Baru — Korporasi",
};

export default async function NewCorporateCddPage({
  searchParams,
}: {
  searchParams: Promise<{ draftUploadId?: string; prefillFromCustomerId?: string }>;
}) {
  const { draftUploadId, prefillFromCustomerId } = await searchParams;
  const ocrDraft = draftUploadId
    ? await loadDraftDocument(draftUploadId, "KORPORASI")
    : null;
  const prefill = prefillFromCustomerId
    ? await loadCorporatePrefill(prefillFromCustomerId)
    : null;

  return (
    <div className="space-y-8">
      <PageHeader
        icon={Building2}
        title="CDD Baru — Korporasi"
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
      <CorporateForm ocrDraft={ocrDraft} prefill={prefill} />
    </div>
  );
}
