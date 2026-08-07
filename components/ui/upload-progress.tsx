"use client";

import { motion } from "framer-motion";

/**
 * Indeterminate progress bar — used when we genuinely have no percentage to
 * report (Server Actions here don't stream progress events), so we never
 * fake a number, only show that work is happening.
 */
export function UploadProgress({ label }: { label?: string }) {
  return (
    <div className="w-full">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <motion.div
          className="h-full w-1/3 rounded-full bg-brand"
          animate={{ x: ["-100%", "220%"] }}
          transition={{ duration: 1.1, ease: "easeInOut", repeat: Infinity }}
        />
      </div>
      {label && <p className="mt-1.5 text-xs font-medium text-muted">{label}</p>}
    </div>
  );
}
