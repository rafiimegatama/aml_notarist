import { CircleCheck, CircleAlert, CircleX, CircleDashed, type LucideIcon } from "lucide-react";
import { Badge, type BadgeTone } from "@/components/ui/badge";

export type SystemHealthStatus = "healthy" | "degraded" | "down" | "unknown";

export interface SystemStatusItem {
  key: string;
  label: string;
  icon: LucideIcon;
  status: SystemHealthStatus;
  detail?: string;
}

export const SYSTEM_STATUS_META: Record<SystemHealthStatus, { label: string; tone: BadgeTone; icon: LucideIcon }> = {
  healthy: { label: "Healthy", tone: "success", icon: CircleCheck },
  degraded: { label: "Sebagian Bermasalah", tone: "warning", icon: CircleAlert },
  down: { label: "Bermasalah", tone: "danger", icon: CircleX },
  unknown: { label: "Belum Diketahui", tone: "neutral", icon: CircleDashed },
};

/** Tanpa header sendiri — satu-satunya pemakai (DashboardUtilityDial) sudah membungkusnya di dalam FloatingPanel yang sudah punya header. */
export function SystemStatusCard({ items }: { items: SystemStatusItem[] }) {
  return (
    <div className="space-y-2.5">
      {items.map((item) => {
        const Icon = item.icon;
        const meta = SYSTEM_STATUS_META[item.status];
        return (
          <div key={item.key} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50/70 px-3.5 py-3">
            <span className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500 shadow-soft-sm">
                <Icon className="h-4 w-4" strokeWidth={2} />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-slate-800">{item.label}</span>
                {item.detail && <span className="block truncate text-xs font-medium text-muted">{item.detail}</span>}
              </span>
            </span>
            <Badge tone={meta.tone} className="shrink-0">
              {meta.label}
            </Badge>
          </div>
        );
      })}
    </div>
  );
}
