import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Scale, UserPlus, Users } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { DuplicateLookupPanel } from "@/components/newcase/DuplicateLookupPanel";

export const metadata: Metadata = {
  title: "Buat CDD Baru",
};

const options = [
  {
    href: "/cdd/new/korporasi",
    title: "Korporasi",
    description: "PT, CV, Yayasan, Koperasi, dan bentuk korporasi lainnya.",
    icon: Building2,
  },
  {
    href: "/cdd/new/perorangan",
    title: "Perorangan",
    description: "Individu / perseorangan.",
    icon: Users,
  },
  {
    href: "/cdd/new/perikatan-lainnya",
    title: "Perikatan Lainnya",
    description: "Legal arrangement, mis. trust atau perikatan sejenis.",
    icon: Scale,
  },
];

export default function NewCddPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        icon={UserPlus}
        title="Buat CDD Baru"
        description="Pilih jenis pengguna jasa untuk memulai Customer Due Diligence."
      />
      <DuplicateLookupPanel />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {options.map((opt) => (
          <Link
            key={opt.href}
            href={opt.href}
            className="card card-hover group flex flex-col gap-4 p-6"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-subtle text-brand-hover transition-colors group-hover:bg-brand group-hover:text-white">
              <opt.icon className="h-5 w-5" strokeWidth={2} />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">{opt.title}</h2>
              <p className="mt-1 text-sm font-medium text-muted">{opt.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
