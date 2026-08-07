import Link from "next/link";
import { Minus, TrendingDown, TrendingUp, type LucideIcon } from "lucide-react";

export interface DashboardCardTrend {
  direction: "up" | "down" | "flat";
  label: string;
  /** For KPIs where "up" is bad (e.g. High Risk count) — flips trend color semantics. */
  invert?: boolean;
}

export interface DashboardCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  tone?: "brand" | "success" | "warning" | "danger";
  trend?: DashboardCardTrend;
  href?: string;
}

const TONE_CLASS: Record<NonNullable<DashboardCardProps["tone"]>, string> = {
  brand: "bg-brand-subtle text-brand-hover",
  success: "bg-success-subtle text-[#15803d]",
  warning: "bg-warning-subtle text-[#b45309]",
  danger: "bg-danger-subtle text-[#b91c1c]",
};

function TrendBadge({ trend }: { trend: DashboardCardTrend }) {
  const goodDirection = trend.invert ? "down" : "up";
  const isGood = trend.direction === goodDirection;
  const isFlat = trend.direction === "flat";
  const Icon = trend.direction === "up" ? TrendingUp : trend.direction === "down" ? TrendingDown : Minus;
  const colorClass = isFlat ? "text-muted" : isGood ? "text-[#15803d]" : "text-[#b91c1c]";
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${colorClass}`}>
      <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
      {trend.label}
    </span>
  );
}

export function DashboardCard({ icon: Icon, label, value, tone = "brand", trend, href }: DashboardCardProps) {
  const content = (
    <div className="flex items-center gap-3.5">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${TONE_CLASS[tone]}`}>
        <Icon className="h-5 w-5" strokeWidth={2} />
      </span>
      <div className="min-w-0">
        <p className="text-2xl font-bold tabular-nums text-slate-900">{value}</p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <p className="text-xs font-semibold text-muted">{label}</p>
          {trend && <TrendBadge trend={trend} />}
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="card card-hover block p-5">
        {content}
      </Link>
    );
  }
  return <div className="card card-hover p-5">{content}</div>;
}
