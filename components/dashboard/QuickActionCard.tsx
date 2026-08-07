import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";

export function QuickActionCard({
  icon: Icon,
  label,
  description,
  href,
}: {
  icon: LucideIcon;
  label: string;
  description: string;
  href: string;
}) {
  return (
    <Link href={href} className="card card-hover group flex items-center gap-3.5 p-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-subtle text-brand-hover transition-colors group-hover:bg-brand group-hover:text-white">
        <Icon className="h-5 w-5" strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-slate-900">{label}</p>
        <p className="truncate text-xs font-medium text-muted">{description}</p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-brand" strokeWidth={2} />
    </Link>
  );
}
