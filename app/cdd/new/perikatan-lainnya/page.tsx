import { LegalArrangementForm } from "@/components/forms/LegalArrangementForm";

export default function NewLegalArrangementCddPage() {
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
      <LegalArrangementForm />
    </div>
  );
}
