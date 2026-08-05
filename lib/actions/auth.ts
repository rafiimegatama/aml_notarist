"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE_NAME,
  SESSION_DURATION_HOURS,
  createSessionToken,
  getLockoutStatus,
  recordFailedAttempt,
  resetLockout,
  verifyPinHash,
} from "@/lib/auth";
import { getEffectivePinHash } from "@/lib/pinSettings";

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

  const configuredHash = await getEffectivePinHash();
  if (!configuredHash) {
    return {
      success: false,
      error: "PIN belum dikonfigurasi. Lihat SETUP.md untuk cara mengaturnya.",
    };
  }

  if (!verifyPinHash(pin, configuredHash)) {
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

/**
 * Kunci layar manual (tombol mengambang, lihat components/layout/LockButton).
 * Cuma menghapus cookie sesi — TIDAK menyentuh lockoutState (itu murni untuk
 * percobaan PIN salah, tidak relevan di sini) dan tidak perlu konfirmasi
 * identitas apa pun karena kebalikan dari login: menurunkan akses, bukan
 * menaikkan.
 */
export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect("/lock");
}
