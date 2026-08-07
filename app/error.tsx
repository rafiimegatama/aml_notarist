"use client";

import { useEffect } from "react";
import Link from "next/link";
import { CircleAlert, Home, RotateCcw } from "lucide-react";

export default function RouteError({
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
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="flex w-full max-w-lg flex-col items-center gap-4 rounded-2xl border border-border-subtle bg-surface p-8 text-center shadow-soft-md">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-danger-subtle text-danger">
          <CircleAlert className="h-6 w-6" strokeWidth={2} />
        </span>
        <div>
          <h1 className="text-lg font-semibold text-slate-900">
            Terjadi kesalahan
          </h1>
          <p className="mt-1 text-sm text-muted">
            Halaman ini gagal dimuat. Data yang sudah tersimpan tidak
            terpengaruh.
          </p>
        </div>
        <div className="flex justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="btn btn-primary px-4 py-2 text-sm"
          >
            <RotateCcw className="h-4 w-4" strokeWidth={2} />
            Coba Lagi
          </button>
          <Link href="/" className="btn btn-secondary px-4 py-2 text-sm">
            <Home className="h-4 w-4" strokeWidth={2} />
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
