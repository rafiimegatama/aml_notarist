import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE_NAME, isValidSessionToken } from "@/lib/auth";
import { getGoogleOAuthConfig } from "@/lib/googleOAuth";

export const metadata: Metadata = {
  title: "Lupa PIN",
};

const ERROR_MESSAGES: Record<string, string> = {
  not_configured:
    "Pemulihan PIN lewat Google belum dikonfigurasi di aplikasi ini. Lihat SETUP.md, atau reset PIN manual lewat file .env.",
  denied: "Login Google dibatalkan. Coba lagi kalau ingin melanjutkan.",
  invalid_state:
    "Sesi verifikasi tidak valid atau sudah kedaluwarsa. Coba lagi dari awal.",
  email_mismatch:
    "Akun Google yang login bukan akun yang terdaftar untuk pemulihan PIN aplikasi ini.",
};

export default async function ForgotPinPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (isValidSessionToken(token)) {
    redirect("/");
  }

  const sp = await searchParams;
  const errorMessage = sp.error ? ERROR_MESSAGES[sp.error] : undefined;
  const configured = !!getGoogleOAuthConfig();

  return (
    <div className="mx-auto max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h1 className="text-lg font-semibold text-gray-900">Lupa PIN</h1>
      <p className="mt-1 text-sm text-gray-500">
        Untuk keamanan, PIN hanya bisa direset setelah login dengan akun
        Google yang sudah terdaftar untuk pemulihan.
      </p>

      {errorMessage && (
        <p className="mt-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </p>
      )}

      <div className="mt-4">
        {configured ? (
          <a
            href="/api/auth/google/start"
            className="btn btn-primary w-full px-4 py-2 text-sm"
          >
            Masuk dengan Google
          </a>
        ) : (
          <p className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Pemulihan PIN lewat Google belum dikonfigurasi. Lihat SETUP.md
            untuk cara mengaturnya, atau reset PIN manual lewat file .env.
          </p>
        )}
      </div>

      <p className="mt-4 text-center text-sm">
        <Link href="/lock" className="text-blue-600 hover:underline">
          Kembali ke halaman masuk
        </Link>
      </p>
    </div>
  );
}
