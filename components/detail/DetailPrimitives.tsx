import { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export function DetailSection({
  id,
  title,
  description,
  icon: Icon,
  children,
  action,
}: {
  id?: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section id={id} className="card p-6 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {Icon && (
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-subtle text-brand-hover">
              <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
            </span>
          )}
          <div>
            <h2 className="text-base font-bold text-slate-900 sm:text-lg">{title}</h2>
            {description && (
              <p className="mt-1 text-sm font-medium text-muted">{description}</p>
            )}
          </div>
        </div>
        {action}
      </div>
      <dl className="mt-6 grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
        {children}
      </dl>
    </section>
  );
}

export function DetailItem({
  label,
  value,
  full,
}: {
  label: string;
  value: ReactNode;
  full?: boolean;
}) {
  const isEmpty = value === null || value === undefined || value === "";
  return (
    <div className={full ? "sm:col-span-2" : undefined}>
      <dt className="text-sm font-medium text-muted">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap text-sm font-medium text-slate-900">
        {isEmpty ? <span className="text-slate-300">—</span> : value}
      </dd>
    </div>
  );
}

export function formatDate(date: Date | null | undefined): string {
  if (!date) return "";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}
