import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export function PageHeader({
  title,
  description,
  icon: Icon,
  actions,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-start gap-3.5">
        {Icon && (
          <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-subtle text-brand-hover">
            <Icon className="h-5 w-5" strokeWidth={2} />
          </span>
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
          {description && (
            <p className="mt-1 text-sm font-medium text-muted">{description}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
    </div>
  );
}
