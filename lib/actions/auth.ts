"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  LOCKOUT_THRESHOLD,
  SESSION_COOKIE_NAME,
  SESSION_DURATION_HOURS,
  createSessionToken,
  getLockoutStatus,
  hashPin,
  isLegacyPinHash,
  isSecureDeployment,
  isValidSessionToken,
  recordFailedAttempt,
  resetLockout,
  verifyPinHash,
} from "@/lib/auth";
import { getEffectivePinHash, setPinHash } from "@/lib/pinSettings";
import { logSecurityEvent } from "@/lib/securityLog";

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
      void logSecurityEvent("LOCKOUT_TRIGGERED", `Percobaan ke-${LOCKOUT_THRESHOLD}`);
      return {
        success: false,
        error: `PIN salah. Percobaan habis — terkunci ${Math.ceil(
          status.remainingMs / 60000
        )} menit.`,
      };
    }
    void logSecurityEvent("LOGIN_FAILED");
    return { success: false, error: "PIN salah." };
  }

  void logSecurityEvent("LOGIN_SUCCESS");
  resetLockout();

  // Transparent migration: rehash legacy SHA-256 to scrypt on successful login.
  // Fire-and-forget — login succeeds regardless of rehash outcome.
  if (isLegacyPinHash(configuredHash)) {
    setPinHash(hashPin(pin)).catch(() => {});
  }
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, createSessionToken(), {
    httpOnly: true,
    secure: isSecureDeployment(), // true saat APP_BASE_URL="https://...", false untuk http://127.0.0.1 lokal
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
  void logSecurityEvent("LOGOUT");
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect("/lock");
}

/**
 * "Perpanjang Sesi" — dipanggil dari SessionExpiryWarning saat notaris masih
 * aktif menjelang sesi 10 jam habis. Mengeluarkan token baru lewat fungsi
 * yang SAMA dengan login (createSessionToken), TIDAK menambah jalur otentikasi
 * baru — hanya bisa dipanggil kalau cookie sesi yang sedang berjalan masih
 * valid (defensif; proxy.ts sudah menjamin ini di semua request, tapi dicek
 * ulang di sini karena ini fungsi publik).
 */
export async function extendSession(): Promise<{ success: boolean }> {
  const cookieStore = await cookies();
  const current = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!isValidSessionToken(current)) {
    return { success: false };
  }
  void logSecurityEvent("SESSION_EXTENDED");
  cookieStore.set(SESSION_COOKIE_NAME, createSessionToken(), {
    httpOnly: true,
    secure: isSecureDeployment(), // true saat APP_BASE_URL="https://...", false untuk http://127.0.0.1 lokal
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_HOURS * 60 * 60,
  });
  return { success: true };
}
