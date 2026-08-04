import { createHash, createHmac, timingSafeEqual } from "node:crypto";

// ------------------------------------------------------------------
// FR-6B — PIN gate. Defaults proposed in PRD §7/§FR-6B ("confirm the exact
// duration when this gets built") — belum dikonfirmasi notaris/counsel,
// ubah di sini kalau perlu.
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

function getPinHash(): string | null {
  return process.env.PIN_HASH || null;
}

export function hashPin(pin: string): string {
  return createHash("sha256").update(pin).digest("hex");
}

/**
 * Bandingkan hash PIN input dengan PIN_HASH dari .env. timingSafeEqual
 * dipakai supaya durasi perbandingan tidak membocorkan info lewat timing
 * attack. Return false (bukan throw) kalau PIN_HASH belum dikonfigurasi —
 * caller (verifyPin action) yang memutuskan pesan errornya.
 */
export function verifyPinHash(pin: string): boolean {
  const configured = getPinHash();
  if (!configured) return false;
  const inputHash = hashPin(pin);
  const a = Buffer.from(inputHash, "hex");
  const b = Buffer.from(configured, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

// ------------------------------------------------------------------
// Signed session cookie — payload {exp} di-HMAC supaya proxy.ts bisa
// verifikasi tanpa perlu tabel sesi di DB (satu notaris, satu shared PIN).
// ------------------------------------------------------------------
function sign(value: string): string {
  return createHmac("sha256", getSessionSecret()).update(value).digest("hex");
}

export function createSessionToken(): string {
  const exp = Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000;
  const payload = String(exp);
  return `${payload}.${sign(payload)}`;
}

export function isValidSessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payload, signature] = parts;
  const expectedSig = sign(payload);
  // Panjang string dicek dulu secara eksak (bukan cuma panjang Buffer hasil
  // parse) — Buffer.from(str, "hex") diam-diam membuang sisa karakter yang
  // tidak membentuk pasangan hex utuh, jadi string yang di-tempel karakter
  // di ujungnya bisa ke-parse jadi byte yang sama seperti signature asli.
  if (signature.length !== expectedSig.length) return false;
  if (!/^[0-9a-f]+$/.test(signature)) return false;
  const a = Buffer.from(signature, "hex");
  const b = Buffer.from(expectedSig, "hex");
  if (!timingSafeEqual(a, b)) return false;
  const exp = Number(payload);
  return Number.isFinite(exp) && Date.now() < exp;
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
