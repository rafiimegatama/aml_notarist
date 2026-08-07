import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-subtle text-brand-hover">
        <Icon className="h-6 w-6" strokeWidth={1.75} />
      </span>
      <div>
        <p className="text-sm font-bold text-slate-900">{title}</p>
        {description && (
          <p className="mx-auto mt-1 max-w-sm text-sm font-medium text-muted">
            {description}
          </p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
