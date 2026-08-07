import Link from "next/link";
import { FileSearch, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-subtle text-brand-hover">
        <FileSearch className="h-7 w-7" strokeWidth={1.75} />
      </span>
      <p className="mt-6 text-sm font-bold uppercase tracking-wide text-muted">404</p>
      <h1 className="mt-1 text-2xl font-bold text-slate-900">Halaman tidak ditemukan</h1>
      <p className="mt-2 max-w-sm text-sm font-medium text-muted">
        Halaman yang Anda cari mungkin sudah dipindahkan atau tidak pernah ada.
      </p>
      <Link href="/" className="btn btn-primary mt-6 px-5 py-2.5 text-sm">
        <Home className="h-4 w-4" strokeWidth={2} />
        Kembali ke Dashboard
      </Link>
    </div>
  );
}
