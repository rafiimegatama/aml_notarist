import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Scale } from "lucide-react";
import {
  PIN_RESET_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  isValidPinResetToken,
  isValidSessionToken,
} from "@/lib/auth";
import { PinResetForm } from "@/components/auth/PinResetForm";

export const metadata: Metadata = {
  title: "Atur PIN Baru",
};

export default async function ResetPinPage() {
  const cookieStore = await cookies();

  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (isValidSessionToken(sessionToken)) {
    redirect("/");
  }

  // Bukti identitas Google sudah diverifikasi (lihat
  // app/api/auth/google/callback) — tanpa token valid di sini, tidak ada
  // jalan lain untuk sampai ke halaman ini selain menebak URL-nya langsung.
  const resetToken = cookieStore.get(PIN_RESET_COOKIE_NAME)?.value;
  if (!isValidPinResetToken(resetToken)) {
    redirect("/lock/forgot?error=invalid_state");
  }

  return (
    <div className="bg-watermark-grid flex min-h-screen items-center justify-center bg-canvas px-4 py-12">
      <div className="w-full max-w-sm rounded-3xl border border-border-subtle bg-surface p-8 shadow-soft-lg">
        <div className="flex flex-col items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand text-white shadow-soft-sm">
            <Scale className="h-6 w-6" strokeWidth={2} />
          </span>
          <h1 className="mt-4 text-lg font-semibold text-slate-900">
            Atur PIN Baru
          </h1>
          <p className="mt-1 text-sm text-muted">
            Identitas berhasil diverifikasi. Atur PIN baru untuk mengakses
            aplikasi.
          </p>
        </div>
        <div className="mt-6">
          <PinResetForm />
        </div>
      </div>
    </div>
  );
}
