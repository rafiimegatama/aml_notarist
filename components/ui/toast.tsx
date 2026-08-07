"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, CircleAlert, Info, TriangleAlert, X } from "lucide-react";

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface ToastInput {
  variant: ToastVariant;
  title: string;
  description?: string;
  /** ms before auto-dismiss; 0 = stays until manually closed. */
  duration?: number;
}

interface ToastItem extends ToastInput {
  id: string;
}

interface ToastContextValue {
  toast: (input: ToastInput) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const VARIANT_META: Record<
  ToastVariant,
  { icon: typeof CheckCircle2; className: string; iconClassName: string }
> = {
  success: {
    icon: CheckCircle2,
    className: "border-success-subtle bg-white",
    iconClassName: "bg-success-subtle text-[#15803d]",
  },
  error: {
    icon: CircleAlert,
    className: "border-danger-subtle bg-white",
    iconClassName: "bg-danger-subtle text-[#b91c1c]",
  },
  warning: {
    icon: TriangleAlert,
    className: "border-warning-subtle bg-white",
    iconClassName: "bg-warning-subtle text-[#b45309]",
  },
  info: {
    icon: Info,
    className: "border-brand-subtle bg-white",
    iconClassName: "bg-brand-subtle text-brand-hover",
  },
};

let idCounter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (input: ToastInput) => {
      idCounter += 1;
      const id = `toast-${idCounter}`;
      setToasts((prev) => [...prev, { ...input, id }]);
      const duration = input.duration ?? 5000;
      if (duration > 0) {
        setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    [dismiss]
  );

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-2.5 sm:right-6 sm:top-6">
        <AnimatePresence>
          {toasts.map((t) => {
            const meta = VARIANT_META[t.variant];
            const Icon = meta.icon;
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: -16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                role={t.variant === "error" ? "alert" : "status"}
                className={`pointer-events-auto flex items-start gap-3 rounded-2xl border p-4 shadow-soft-lg ${meta.className}`}
              >
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${meta.iconClassName}`}>
                  <Icon className="h-4 w-4" strokeWidth={2} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900">{t.title}</p>
                  {t.description && <p className="mt-0.5 text-sm font-medium text-muted">{t.description}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(t.id)}
                  aria-label="Tutup notifikasi"
                  className="shrink-0 rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast() harus dipakai di dalam <ToastProvider>.");
  return ctx;
}
