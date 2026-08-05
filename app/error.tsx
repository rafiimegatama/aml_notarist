"use client";

import { useEffect } from "react";
import Link from "next/link";

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
    <div className="mx-auto max-w-lg space-y-4 rounded-lg border border-red-200 bg-red-50 p-6 text-center">
      <h1 className="text-lg font-semibold text-red-800">
        Terjadi kesalahan
      </h1>
      <p className="text-sm text-red-700">
        Halaman ini gagal dimuat. Data yang sudah tersimpan tidak terpengaruh.
      </p>
      <div className="flex justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="btn btn-danger px-4 py-2 text-sm"
        >
          Coba Lagi
        </button>
        <Link
          href="/"
          className="rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
        >
          Kembali ke Dashboard
        </Link>
      </div>
    </div>
  );
}
