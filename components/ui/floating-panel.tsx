"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, type LucideIcon } from "lucide-react";

export interface FloatingPanelProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  icon: LucideIcon;
  children: ReactNode;
}

/** Generic overlay panel for hosting a full widget (e.g. upload form, status list) triggered from a floating button. */
export function FloatingPanel({ open, onClose, title, description, icon: Icon, children }: FloatingPanelProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[92] flex items-end justify-center bg-slate-900/40 p-4 sm:items-center"
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="floating-panel-title"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-soft-lg"
          >
            <div className="flex items-start justify-between gap-4 border-b border-border-subtle p-5">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-subtle text-brand-hover">
                  <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                </span>
                <div>
                  <h2 id="floating-panel-title" className="text-base font-bold text-slate-900">
                    {title}
                  </h2>
                  {description && <p className="mt-0.5 text-sm font-medium text-muted">{description}</p>}
                </div>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                aria-label="Tutup"
                className="shrink-0 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
            <div className="p-5">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
