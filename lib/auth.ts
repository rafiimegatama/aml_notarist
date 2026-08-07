import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

// ------------------------------------------------------------------
// FR-6B — PIN gate. Defaults proposed in PRD §7/§FR-6B ("confirm the exact
// duration when this gets built") — belum dikonfirmasi notaris/counsel,
// ubah di sini kalau perlu.
//
// Modul ini SENGAJA tidak import apa pun yang menyentuh DB/Node-only I/O
// (lihat lib/pinSettings.ts untuk itu) — proxy.ts (Next.js "Proxy") import
// dari sini untuk validasi token sesi tiap request, dan menjaga modul ini
// sebagai primitif crypto murni menghindari risiko modul DB (Prisma/better-
// sqlite3) ikut ter-bundle ke jalur yang tidak membutuhkannya.
// ------------------------------------------------------------------
export const SESSION_COOKIE_NAME = "notary_session";
export const SESSION_DURATION_HOURS = 10;
export const LOCKOUT_THRESHOLD = 3; // percobaan salah berurutan sebelum terkunci
export const LOCKOUT_DURATION_MINUTES = 5;

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "SESSION_SECRET belum diset di .env — lihat .env.example."
    );
  }
  return secret;
}

export function hashPin(pin: string): string {
  return createHash("sha256").update(pin).digest("hex");
}

/**
 * Bandingkan hash PIN input dengan hash yang sedang berlaku. Effective hash
 * kini bisa datang dari AppSetting (hasil "Lupa PIN", lihat
 * lib/pinSettings.ts) atau fallback ke PIN_HASH di .env — modul INI sengaja
 * tidak menyentuh DB sama sekali (lihat catatan di atas file), jadi caller
 * yang mengambil effective hash lalu mengoper ke sini. timingSafeEqual
 * dipakai supaya durasi perbandingan tidak membocorkan info lewat timing
 * attack. Return false (bukan throw) kalau configuredHash null (belum
 * dikonfigurasi) — caller (verifyPin action) yang memutuskan pesan errornya.
 */
export function verifyPinHash(pin: string, configuredHash: string | null): boolean {
  if (!configuredHash) return false;
  const inputHash = hashPin(pin);
  const a = Buffer.from(inputHash, "hex");
  const b = Buffer.from(configuredHash, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

// ------------------------------------------------------------------
// Signed, self-expiring tokens — payload {exp} (+ prefix pembeda jenis)
// di-HMAC supaya proxy.ts / server actions bisa verifikasi tanpa perlu
// tabel sesi di DB. Dipakai untuk sesi login (createSessionToken), state
// anti-CSRF alur "Lupa PIN" (createOAuthState), dan token sekali-pakai yang
// membuktikan identitas Google sudah diverifikasi sebelum boleh ganti PIN
// (createPinResetToken). Satu implementasi verifikasi dipakai bersama
// (signExpiring/isValidSignedExpiring) supaya hardening di bawah ini
// (dikerjakan setelah insiden nyata — lihat komentar isValidSignedExpiring)
// tidak bisa diam-diam hilang kalau salah satu varian di-duplikasi manual.
// ------------------------------------------------------------------
function sign(value: string): string {
  return createHmac("sha256", getSessionSecret()).update(value).digest("hex");
}

function signExpiring(prefix: string, durationMs: number): string {
  const exp = Date.now() + durationMs;
  const payload = `${prefix}${exp}`;
  return `${payload}.${sign(payload)}`;
}

/**
 * Verifikasi signature + prefix + belum kedaluwarsa. Panjang string signature
 * dicek dulu secara eksak (bukan cuma panjang Buffer hasil parse) —
 * Buffer.from(str, "hex") diam-diam membuang sisa karakter yang tidak
 * membentuk pasangan hex utuh, jadi string yang di-tempel karakter di
 * ujungnya bisa ke-parse jadi byte yang sama seperti signature asli (bug
 * nyata yang pernah lolos di sini, lihat riwayat perubahan di claude.md).
 */
function isValidSignedExpiring(token: string | undefined, prefix: string): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payload, signature] = parts;
  if (!payload.startsWith(prefix)) return false;
  const expectedSig = sign(payload);
  if (signature.length !== expectedSig.length) return false;
  if (!/^[0-9a-f]+$/.test(signature)) return false;
  const a = Buffer.from(signature, "hex");
  const b = Buffer.from(expectedSig, "hex");
  if (!timingSafeEqual(a, b)) return false;
  const exp = Number(payload.slice(prefix.length));
  return Number.isFinite(exp) && Date.now() < exp;
}

const SESSION_PREFIX = "session:";

export function createSessionToken(): string {
  return signExpiring(SESSION_PREFIX, SESSION_DURATION_HOURS * 60 * 60 * 1000);
}

export function isValidSessionToken(token: string | undefined): boolean {
  return isValidSignedExpiring(token, SESSION_PREFIX);
}

/**
 * Dipakai HANYA untuk UI (peringatan sesi akan habis, lihat
 * components/layout/SessionExpiryWarning) — mengembalikan exp (epoch ms)
 * dari token yang SUDAH divalidasi valid, atau null kalau tidak valid. Tidak
 * pernah dipakai sebagai pengganti isValidSessionToken untuk keputusan akses.
 */
export function getSessionExpiryMs(token: string | undefined): number | null {
  if (!isValidSessionToken(token)) return null;
  const payload = token!.split(".")[0];
  const exp = Number(payload.slice(SESSION_PREFIX.length));
  return Number.isFinite(exp) ? exp : null;
}

// ------------------------------------------------------------------
// Lupa PIN — verifikasi lewat Google Sign-In (lihat lib/googleOAuth.ts,
// lib/actions/pinRecovery.ts, app/lock/forgot/). Dua token terpisah:
//
// 1. OAuth state: cookie httpOnly berisi nonce acak, dikirim juga sebagai
//    parameter `state` ke Google, dicocokkan persis saat callback — pola
//    "double-submit cookie" standar untuk anti-CSRF alur OAuth. Tidak perlu
//    signature/exp sendiri karena cookie httpOnly-nya sendiri sudah jadi
//    rahasianya, dan browser yang menegakkan masa berlaku lewat maxAge.
// 2. PIN reset token: dikeluarkan HANYA setelah email Google yang login
//    cocok persis dengan PIN_RECOVERY_GOOGLE_EMAIL (lihat
//    lib/actions/pinRecovery.ts) — bukti "identitas sudah diverifikasi",
//    berlaku singkat (10 menit) dan dihapus begitu dipakai sekali.
// ------------------------------------------------------------------
export const OAUTH_STATE_COOKIE_NAME = "notary_oauth_state";
export const OAUTH_STATE_MAX_AGE_SECONDS = 5 * 60;

export function createOAuthState(): string {
  return randomBytes(32).toString("hex");
}

export function isValidOAuthState(
  cookieValue: string | undefined,
  queryValue: string | undefined
): boolean {
  if (!cookieValue || !queryValue) return false;
  if (cookieValue.length !== queryValue.length) return false;
  return timingSafeEqual(Buffer.from(cookieValue), Buffer.from(queryValue));
}

export const PIN_RESET_COOKIE_NAME = "notary_pin_reset";
export const PIN_RESET_TOKEN_MINUTES = 10;
const PIN_RESET_PREFIX = "pinreset:";

export function createPinResetToken(): string {
  return signExpiring(PIN_RESET_PREFIX, PIN_RESET_TOKEN_MINUTES * 60 * 1000);
}

export function isValidPinResetToken(token: string | undefined): boolean {
  return isValidSignedExpiring(token, PIN_RESET_PREFIX);
}

// ------------------------------------------------------------------
// Lockout state — in-memory per proses (bukan per-DB/per-user, karena PIN
// dibagi satu kantor). Reset saat aplikasi di-restart; dianggap wajar untuk
// aplikasi lokal single-process ini.
// ------------------------------------------------------------------
type LockoutState = { failedAttempts: number; lockedUntil: number | null };
const lockoutState: LockoutState = { failedAttempts: 0, lockedUntil: null };

export function getLockoutStatus(): { locked: boolean; remainingMs: number } {
  if (lockoutState.lockedUntil && Date.now() < lockoutState.lockedUntil) {
    return { locked: true, remainingMs: lockoutState.lockedUntil - Date.now() };
  }
  if (lockoutState.lockedUntil && Date.now() >= lockoutState.lockedUntil) {
    lockoutState.lockedUntil = null;
    lockoutState.failedAttempts = 0;
  }
  return { locked: false, remainingMs: 0 };
}

export function recordFailedAttempt(): void {
  lockoutState.failedAttempts += 1;
  if (lockoutState.failedAttempts >= LOCKOUT_THRESHOLD) {
    lockoutState.lockedUntil = Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000;
  }
}

export function resetLockout(): void {
  lockoutState.failedAttempts = 0;
  lockoutState.lockedUntil = null;
}
