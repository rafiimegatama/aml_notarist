"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CircleAlert, LoaderCircle } from "lucide-react";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** "danger" for destructive actions (delete/reset), "default" for neutral confirmations (backup/download). */
  tone?: "danger" | "default";
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Controlled enterprise confirmation modal — caller owns the open/pending state. */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Konfirmasi",
  cancelLabel = "Batal",
  tone = "default",
  pending = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    confirmRef.current?.focus();
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !pending) onCancel();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, pending, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/40 p-4"
          onClick={() => !pending && onCancel()}
        >
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-soft-lg"
          >
            <div className="flex items-start gap-3.5">
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                  tone === "danger" ? "bg-danger-subtle text-[#b91c1c]" : "bg-brand-subtle text-brand-hover"
                }`}
              >
                <CircleAlert className="h-5 w-5" strokeWidth={2} />
              </span>
              <div>
                <h2 id="confirm-dialog-title" className="text-base font-bold text-slate-900">
                  {title}
                </h2>
                {description && <p className="mt-1.5 text-sm font-medium text-muted">{description}</p>}
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={onCancel}
                disabled={pending}
                className="btn btn-secondary px-4 py-2 text-sm"
              >
                {cancelLabel}
              </button>
              <button
                ref={confirmRef}
                type="button"
                onClick={onConfirm}
                disabled={pending}
                className={`btn px-4 py-2 text-sm ${tone === "danger" ? "btn-danger" : "btn-primary"}`}
              >
                {pending && <LoaderCircle className="h-4 w-4 animate-spin" strokeWidth={2} />}
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
