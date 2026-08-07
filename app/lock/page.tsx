import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Scale } from "lucide-react";
import { SESSION_COOKIE_NAME, isValidSessionToken } from "@/lib/auth";
import { PinForm } from "@/components/auth/PinForm";

export const metadata: Metadata = {
  title: "Masuk",
};

export default async function LockPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const sp = await searchParams;
  // Cegah open redirect: hanya izinkan path relatif satu-slash, bukan
  // "//host" (protocol-relative) yang bisa mengarah ke domain luar.
  const next =
    sp.next && sp.next.startsWith("/") && !sp.next.startsWith("//")
      ? sp.next
      : "/";

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (isValidSessionToken(token)) {
    redirect(next);
  }

  return (
    <div className="bg-watermark-grid flex min-h-screen items-center justify-center bg-canvas px-4 py-12">
      <div className="w-full max-w-sm rounded-3xl border border-border-subtle bg-surface p-8 shadow-soft-lg">
        <div className="flex flex-col items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand text-white shadow-soft-sm">
            <Scale className="h-6 w-6" strokeWidth={2} />
          </span>
          <h1 className="mt-4 text-lg font-semibold text-slate-900">
            Notary CDD &amp; Risk Assessment
          </h1>
          <p className="mt-1 text-sm text-muted">
            Masukkan PIN untuk mengakses aplikasi.
          </p>
        </div>
        <div className="mt-6">
          <PinForm next={next} />
        </div>
      </div>
    </div>
  );
}
