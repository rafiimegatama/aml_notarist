import type { Metadata } from "next";
import Link from "next/link";
import { DuplicateLookupPanel } from "@/components/newcase/DuplicateLookupPanel";

export const metadata: Metadata = {
  title: "Buat CDD Baru",
};

const options = [
  {
    href: "/cdd/new/korporasi",
    title: "Korporasi",
    description: "PT, CV, Yayasan, Koperasi, dan bentuk korporasi lainnya.",
  },
  {
    href: "/cdd/new/perorangan",
    title: "Perorangan",
    description: "Individu / perseorangan.",
  },
  {
    href: "/cdd/new/perikatan-lainnya",
    title: "Perikatan Lainnya",
    description: "Legal arrangement, mis. trust atau perikatan sejenis.",
  },
];

export default function NewCddPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Buat CDD Baru</h1>
        <p className="mt-1 text-sm text-gray-500">
          Pilih jenis pengguna jasa untuk memulai Customer Due Diligence.
        </p>
      </div>
      <DuplicateLookupPanel />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {options.map((opt) => (
          <Link
            key={opt.href}
            href={opt.href}
            className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition hover:border-blue-400 hover:shadow-md"
          >
            <h2 className="font-semibold text-gray-900">{opt.title}</h2>
            <p className="mt-1 text-sm text-gray-500">{opt.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
