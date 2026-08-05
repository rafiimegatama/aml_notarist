"use server";

import { cookies } from "next/headers";
import {
  PIN_RESET_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  SESSION_DURATION_HOURS,
  createSessionToken,
  hashPin,
  isValidPinResetToken,
  resetLockout,
} from "@/lib/auth";
import { setPinHash } from "@/lib/pinSettings";

export type ResetPinResult = { success: true } | { success: false; error: string };

const PIN_FORMAT = /^\d{4,6}$/;

/**
 * Langkah terakhir alur "Lupa PIN" — dipanggil dari form di
 * app/lock/forgot/reset setelah identitas Google sudah diverifikasi cocok
 * dengan PIN_RECOVERY_GOOGLE_EMAIL (lihat app/api/auth/google/callback).
 * Cookie notary_pin_reset ADALAH buktinya di sini — action ini tidak
 * mengecek ulang identitas Google, cuma validitas token itu.
 */
export async function resetPinWithRecoveryToken(
  pin: string,
  confirmPin: string
): Promise<ResetPinResult> {
  const cookieStore = await cookies();
  const token = cookieStore.get(PIN_RESET_COOKIE_NAME)?.value;
  if (!isValidPinResetToken(token)) {
    return {
      success: false,
      error: 'Sesi verifikasi sudah kedaluwarsa. Mulai ulang dari "Lupa PIN".',
    };
  }
  if (!PIN_FORMAT.test(pin)) {
    return { success: false, error: "PIN harus 4-6 digit angka." };
  }
  if (pin !== confirmPin) {
    return { success: false, error: "Konfirmasi PIN tidak cocok." };
  }

  await setPinHash(hashPin(pin));
  resetLockout();

  // Token sekali-pakai — hapus supaya tidak bisa dipakai ulang selama sisa
  // masa berlakunya. Langsung login-kan juga: identitas Google yang baru
  // saja diverifikasi adalah bukti lebih kuat daripada PIN itu sendiri,
  // jadi tidak perlu memaksa notaris masuk lagi pakai PIN yang baru dibuat.
  cookieStore.delete(PIN_RESET_COOKIE_NAME);
  cookieStore.set(SESSION_COOKIE_NAME, createSessionToken(), {
    httpOnly: true,
    secure: false, // aplikasi lokal, diakses via http://127.0.0.1
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_HOURS * 60 * 60,
  });

  return { success: true };
}

/** Wrapper untuk dipakai dengan useActionState di form reset PIN. */
export async function resetPinFormAction(
  _prevState: ResetPinResult | undefined,
  formData: FormData
): Promise<ResetPinResult> {
  const pin = String(formData.get("pin") ?? "");
  const confirmPin = String(formData.get("confirmPin") ?? "");
  return resetPinWithRecoveryToken(pin, confirmPin);
}
