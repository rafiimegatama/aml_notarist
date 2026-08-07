import type { ReactNode } from "react";
import {
  CheckCircle2,
  CircleAlert,
  LoaderCircle,
} from "lucide-react";

export type UploadState =
  | "idle"
  | "uploading"
  | "processing-ocr"
  | "success"
  | "error";

const STATE_META: Record<
  Exclude<UploadState, "idle">,
  { label: string; className: string; icon: ReactNode }
> = {
  uploading: {
    label: "Mengunggah...",
    className: "bg-brand-subtle text-brand-hover border-transparent",
    icon: <LoaderCircle className="h-3.5 w-3.5 animate-spin" />,
  },
  "processing-ocr": {
    label: "Membaca dokumen (OCR)...",
    className: "bg-warning-subtle text-[#b45309] border-transparent",
    icon: <LoaderCircle className="h-3.5 w-3.5 animate-spin" />,
  },
  success: {
    label: "Berhasil diunggah",
    className: "bg-success-subtle text-[#15803d] border-transparent",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
  error: {
    label: "Gagal",
    className: "bg-danger-subtle text-[#b91c1c] border-transparent",
    icon: <CircleAlert className="h-3.5 w-3.5" />,
  },
};

export function UploadStatusBadge({
  state,
  label,
}: {
  state: UploadState;
  label?: string;
}) {
  if (state === "idle") return null;
  const meta = STATE_META[state];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${meta.className}`}
    >
      {meta.icon}
      {label ?? meta.label}
    </span>
  );
}
