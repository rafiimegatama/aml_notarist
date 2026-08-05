import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
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
    <div className="mx-auto max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h1 className="text-lg font-semibold text-gray-900">Atur PIN Baru</h1>
      <p className="mt-1 text-sm text-gray-500">
        Identitas berhasil diverifikasi. Atur PIN baru untuk mengakses
        aplikasi.
      </p>
      <div className="mt-4">
        <PinResetForm />
      </div>
    </div>
  );
}
