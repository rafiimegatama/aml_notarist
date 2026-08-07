import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CircleAlert, LogIn, Scale } from "lucide-react";
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
    <div className="bg-watermark-grid flex min-h-screen items-center justify-center bg-canvas px-4 py-12">
      <div className="w-full max-w-sm rounded-3xl border border-border-subtle bg-surface p-8 shadow-soft-lg">
        <div className="flex flex-col items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand text-white shadow-soft-sm">
            <Scale className="h-6 w-6" strokeWidth={2} />
          </span>
          <h1 className="mt-4 text-lg font-semibold text-slate-900">
            Lupa PIN
          </h1>
          <p className="mt-1 text-sm text-muted">
            Untuk keamanan, PIN hanya bisa direset setelah login dengan akun
            Google yang sudah terdaftar untuk pemulihan.
          </p>
        </div>

        {errorMessage && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-danger-subtle px-3.5 py-2.5 text-sm text-danger">
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
            <p>{errorMessage}</p>
          </div>
        )}

        <div className="mt-6">
          {configured ? (
            <a
              href="/api/auth/google/start"
              className="btn btn-primary w-full px-4 py-2.5 text-sm"
            >
              <LogIn className="h-4 w-4" strokeWidth={2} />
              Masuk dengan Google
            </a>
          ) : (
            <div className="flex items-start gap-2.5 rounded-xl bg-warning-subtle px-3.5 py-2.5 text-sm text-amber-800">
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
              <p>
                Pemulihan PIN lewat Google belum dikonfigurasi. Lihat SETUP.md
                untuk cara mengaturnya, atau reset PIN manual lewat file .env.
              </p>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-sm">
          <Link
            href="/lock"
            className="font-medium text-brand hover:underline"
          >
            Kembali ke halaman masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
