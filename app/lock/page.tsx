import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
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
    <div className="mx-auto max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h1 className="text-lg font-semibold text-gray-900">
        Notary CDD &amp; Risk Assessment
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Masukkan PIN untuk mengakses aplikasi.
      </p>
      <div className="mt-4">
        <PinForm next={next} />
      </div>
    </div>
  );
}
