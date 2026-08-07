"use client";

import { motion } from "framer-motion";
import { Eye, FileImage, FileText, Trash2 } from "lucide-react";
import type { UploadState } from "@/components/ui/upload-status";
import { UploadProgress } from "@/components/ui/upload-progress";
import { UploadStatusBadge } from "@/components/ui/upload-status";

export interface FileCardProps {
  fileName: string;
  extLabel: string;
  sizeLabel?: string;
  metaLabel?: string;
  isImage: boolean;
  thumbnailSrc?: string;
  status: UploadState;
  statusLabel?: string;
  errorMessage?: string;
  onDelete?: () => void;
  onPreview?: () => void;
  className?: string;
}

export function FileCard({
  fileName,
  extLabel,
  sizeLabel,
  metaLabel,
  isImage,
  thumbnailSrc,
  status,
  statusLabel,
  errorMessage,
  onDelete,
  onPreview,
  className = "",
}: FileCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96, y: 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className={`card overflow-hidden ${
        status === "error" ? "border-danger-subtle" : ""
      } ${className}`}
    >
      <div className="flex items-start gap-3 p-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
          {isImage && thumbnailSrc ? (
            /* eslint-disable-next-line @next/next/no-img-element -- lokal/objectURL, bukan aset yang perlu dioptimasi Next/Image */
            <img
              src={thumbnailSrc}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : isImage ? (
            <FileImage className="h-5 w-5 text-slate-400" strokeWidth={1.75} />
          ) : (
            <FileText className="h-5 w-5 text-slate-400" strokeWidth={1.75} />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900" title={fileName}>
            {fileName}
          </p>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs font-medium text-muted">
            <span className="uppercase">{extLabel}</span>
            {sizeLabel && (
              <>
                <span aria-hidden="true">&middot;</span>
                <span>{sizeLabel}</span>
              </>
            )}
            {metaLabel && (
              <>
                <span aria-hidden="true">&middot;</span>
                <span>{metaLabel}</span>
              </>
            )}
          </div>

          <div className="mt-2">
            {status === "uploading" || status === "processing-ocr" ? (
              <UploadProgress label={statusLabel} />
            ) : (
              <UploadStatusBadge state={status} label={statusLabel} />
            )}
            {status === "error" && errorMessage && (
              <p role="alert" className="mt-1.5 text-xs font-medium text-[#b91c1c]">
                {errorMessage}
              </p>
            )}
          </div>
        </div>

        {(onPreview || onDelete) && (
          <div className="flex shrink-0 items-center gap-1">
            {onPreview && (
              <button
                type="button"
                onClick={onPreview}
                aria-label={`Pratinjau ${fileName}`}
                className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <Eye className="h-4 w-4" />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                aria-label={`Hapus ${fileName}`}
                className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-danger-subtle hover:text-[#b91c1c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
