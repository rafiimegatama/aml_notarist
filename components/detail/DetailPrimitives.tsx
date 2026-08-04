import { ReactNode } from "react";

export function DetailSection({
  id,
  title,
  description,
  children,
  action,
}: {
  id?: string;
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section
      id={id}
      className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          {description && (
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          )}
        </div>
        {action}
      </div>
      <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
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
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="mt-0.5 whitespace-pre-wrap text-sm text-gray-900">
        {isEmpty ? <span className="text-gray-400">—</span> : value}
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
