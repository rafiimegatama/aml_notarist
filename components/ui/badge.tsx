import type { ReactNode } from "react";

export type BadgeTone = "neutral" | "brand" | "success" | "warning" | "danger";

const TONE_CLASS: Record<BadgeTone, string> = {
  neutral: "badge-neutral",
  brand: "badge-brand",
  success: "badge-success",
  warning: "badge-warning",
  danger: "badge-danger",
};

export function Badge({
  tone = "neutral",
  children,
  className = "",
}: {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}) {
  return <span className={`badge ${TONE_CLASS[tone]} ${className}`}>{children}</span>;
}
