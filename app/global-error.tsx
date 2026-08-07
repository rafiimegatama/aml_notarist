"use client";

import { useEffect } from "react";
import { CircleAlert, RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="id">
      <body className="flex min-h-screen items-center justify-center bg-canvas p-8">
        <div className="flex w-full max-w-lg flex-col items-center gap-4 rounded-3xl border border-border-subtle bg-surface p-8 text-center shadow-soft-lg">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-danger-subtle text-danger">
            <CircleAlert className="h-6 w-6" strokeWidth={2} />
          </span>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">
              Aplikasi mengalami kesalahan
            </h1>
            <p className="mt-1 text-sm text-muted">
              Silakan muat ulang halaman. Data yang sudah tersimpan tidak
              terpengaruh.
            </p>
          </div>
          <button
            type="button"
            onClick={reset}
            className="btn btn-primary px-4 py-2 text-sm"
          >
            <RotateCcw className="h-4 w-4" strokeWidth={2} />
            Muat Ulang
          </button>
        </div>
      </body>
    </html>
  );
}
