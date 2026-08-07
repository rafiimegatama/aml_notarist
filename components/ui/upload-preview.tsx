"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

export interface UploadPreviewProps {
  open: boolean;
  onClose: () => void;
  src: string;
  fileName: string;
}

/** Lightbox modal for previewing an uploaded image. */
export function UploadPreviewModal({ open, onClose, src, fileName }: UploadPreviewProps) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={`Pratinjau ${fileName}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[90vh] max-w-3xl overflow-hidden rounded-3xl bg-white shadow-soft-lg"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup pratinjau"
              className="absolute right-3 top-3 rounded-full bg-black/50 p-1.5 text-white transition-colors hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <X className="h-4 w-4" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element -- pratinjau file lokal/dari disk, bukan aset yang perlu dioptimasi Next/Image */}
            <img
              src={src}
              alt={fileName}
              className="max-h-[90vh] w-full object-contain"
            />
            <p className="truncate border-t border-border-subtle px-4 py-2 text-xs font-medium text-muted">
              {fileName}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
