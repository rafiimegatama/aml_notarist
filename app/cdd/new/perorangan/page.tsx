import { IndividualForm } from "@/components/forms/IndividualForm";

export default function NewIndividualCddPage() {
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
      <IndividualForm />
    </div>
  );
}
