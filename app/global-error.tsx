"use client";

import { useEffect } from "react";

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
      <body className="flex min-h-screen items-center justify-center bg-gray-50 p-8">
        <div className="max-w-lg space-y-4 rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <h1 className="text-lg font-semibold text-red-800">
            Aplikasi mengalami kesalahan
          </h1>
          <p className="text-sm text-red-700">
            Silakan muat ulang halaman. Data yang sudah tersimpan tidak
            terpengaruh.
          </p>
          <button
            type="button"
            onClick={reset}
            className="btn btn-danger px-4 py-2 text-sm"
          >
            Muat Ulang
          </button>
        </div>
      </body>
    </html>
  );
}
