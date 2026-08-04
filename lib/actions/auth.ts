"use server";

import { cookies } from "next/headers";
import {
  SESSION_COOKIE_NAME,
  SESSION_DURATION_HOURS,
  createSessionToken,
  getLockoutStatus,
  recordFailedAttempt,
  resetLockout,
  verifyPinHash,
} from "@/lib/auth";

export type VerifyPinResult =
  | { success: true }
  | { success: false; error: string };

export async function verifyPin(pin: string): Promise<VerifyPinResult> {
  const lockout = getLockoutStatus();
  if (lockout.locked) {
    const minutes = Math.ceil(lockout.remainingMs / 60000);
    return {
      success: false,
      error: `Terlalu banyak percobaan salah. Coba lagi dalam ${minutes} menit.`,
    };
  }

  if (!process.env.PIN_HASH) {
    return {
      success: false,
      error: "PIN belum dikonfigurasi. Lihat SETUP.md untuk cara mengaturnya.",
    };
  }

  if (!verifyPinHash(pin)) {
    recordFailedAttempt();
    const status = getLockoutStatus();
    if (status.locked) {
      return {
        success: false,
        error: `PIN salah. Percobaan habis — terkunci ${Math.ceil(
          status.remainingMs / 60000
        )} menit.`,
      };
    }
    return { success: false, error: "PIN salah." };
  }

  resetLockout();
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, createSessionToken(), {
    httpOnly: true,
    secure: false, // aplikasi lokal, diakses via http://127.0.0.1
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_HOURS * 60 * 60,
  });
  return { success: true };
}

/** Wrapper untuk dipakai dengan useActionState di form PIN (app/lock). */
export async function verifyPinFormAction(
  _prevState: VerifyPinResult | undefined,
  formData: FormData
): Promise<VerifyPinResult> {
  const pin = String(formData.get("pin") ?? "");
  return verifyPin(pin);
}
