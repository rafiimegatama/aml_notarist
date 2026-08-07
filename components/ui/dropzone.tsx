"use client";

import { useCallback, useId, useRef, useState } from "react";
import { motion } from "framer-motion";
import { UploadCloud } from "lucide-react";

export interface DropzoneProps {
  /** id applied to the hidden native input, referenced by an external <label> if needed */
  id?: string;
  name?: string;
  accept: string;
  multiple?: boolean;
  disabled?: boolean;
  onFilesSelected: (files: File[]) => void;
  /** Format badges shown under the description, e.g. ["JPG", "PNG", "WEBP"] */
  formatBadges?: string[];
  maxSizeLabel?: string;
  label?: string;
  description?: string;
  ariaLabel?: string;
  className?: string;
}

/**
 * Generic drag-and-drop + click-to-browse zone. Presentational only — the
 * caller owns what happens with the selected files (validation, upload,
 * server action calls, etc).
 */
export function Dropzone({
  id,
  name,
  accept,
  multiple = false,
  disabled = false,
  onFilesSelected,
  formatBadges,
  maxSizeLabel,
  label = "Drag & drop your files here",
  description = "or click to browse your computer",
  ariaLabel,
  className = "",
}: DropzoneProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const openBrowser = useCallback(() => {
    if (!disabled) inputRef.current?.click();
  }, [disabled]);

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      onFilesSelected(Array.from(fileList));
    },
    [onFilesSelected]
  );

  return (
    <div className={className}>
      <motion.div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        aria-label={ariaLabel ?? label}
        onClick={openBrowser}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openBrowser();
          }
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          if (disabled) return;
          dragCounter.current += 1;
          setIsDragging(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          if (disabled) return;
          dragCounter.current -= 1;
          if (dragCounter.current <= 0) {
            dragCounter.current = 0;
            setIsDragging(false);
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          dragCounter.current = 0;
          setIsDragging(false);
          if (disabled) return;
          handleFiles(e.dataTransfer.files);
        }}
        animate={{
          borderColor: isDragging ? "#2563eb" : "#d1d5db",
          backgroundColor: isDragging ? "#eff6ff" : "#f8fafc",
        }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className={`group relative flex min-h-[220px] w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed p-8 text-center shadow-soft-sm outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${
          disabled ? "cursor-not-allowed opacity-60" : "hover:border-slate-400 hover:bg-slate-100"
        }`}
      >
        <input
          ref={inputRef}
          id={inputId}
          name={name}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          onChange={(e) => {
            handleFiles(e.target.files);
            // allow re-selecting the same file after a delete/reset
            e.target.value = "";
          }}
          className="sr-only"
        />

        <motion.div
          animate={{ scale: isDragging ? 1.12 : 1 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
            isDragging ? "bg-brand-subtle text-brand" : "bg-slate-100 text-muted group-hover:text-slate-600"
          }`}
        >
          <UploadCloud className="h-7 w-7" strokeWidth={1.75} />
        </motion.div>

        <div>
          <p className="text-sm font-bold text-slate-900">
            {isDragging ? "Release to upload" : label}
          </p>
          {!isDragging && (
            <p className="mt-0.5 text-sm font-medium text-muted">{description}</p>
          )}
        </div>

        {(formatBadges?.length || maxSizeLabel) && !isDragging && (
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {formatBadges?.map((badge) => (
              <span
                key={badge}
                className="rounded-full border border-border-subtle bg-white px-2 py-0.5 text-[11px] font-semibold text-muted"
              >
                {badge}
              </span>
            ))}
            {maxSizeLabel && (
              <span className="rounded-full border border-border-subtle bg-white px-2 py-0.5 text-[11px] font-semibold text-muted">
                {maxSizeLabel}
              </span>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
