import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

/**
 * Encrypts scanned ID documents (KTP/NPWP/dll.) at rest in storage/uploads/,
 * and encrypts sensitive structured/OCR data stored in SQLite (ocrRawText,
 * fieldGuesses).
 *
 * Key architecture (security hardening pass — key separation):
 *   SESSION_SECRET          -> authentication/session signing ONLY (lib/auth.ts)
 *   DATA_ENCRYPTION_KEY     -> structured/OCR fields in the database (v2)
 *   DOCUMENT_ENCRYPTION_KEY -> uploaded document files on disk (v2)
 *
 * Before this pass, both file and field encryption were derived from
 * SESSION_SECRET (labelled SHA-256, distinct from the HMAC key used for
 * session signing — never literally the same bytes, but the same ROOT
 * secret). That legacy scheme is preserved read-only ("v1") so existing
 * encrypted data keeps working — nothing is migrated automatically. Run
 * `npm run security:migrate-encryption` (scripts/migrate-encryption.ts)
 * once DATA_ENCRYPTION_KEY/DOCUMENT_ENCRYPTION_KEY are set in .env to
 * re-encrypt existing v1 data under the new dedicated keys.
 *
 * Format selection is automatic: encrypt* functions write v2 (dedicated
 * key) once BOTH new env vars are present, otherwise they keep writing v1
 * (legacy) so upgrading this code does not require immediate key setup.
 * decrypt* functions always detect the stored format and use the matching
 * key — v1 data remains readable forever via SESSION_SECRET, independent
 * of whether the new keys are configured.
 *
 * Residual risk (JANGAN dianggap solusi penuh): kunci berasal dari env var
 * yang hidup di disk yang sama dengan file terenkripsi. Ini menaikkan
 * standar terhadap "seseorang menyalin folder storage/", TAPI TIDAK
 * terhadap "seseorang punya akses penuh ke PC ini" — lihat SECURITY.md.
 */

const IV_LENGTH = 12; // recommended nonce length for AES-GCM
const AUTH_TAG_LENGTH = 16;

// Prepended only to v2 (DOCUMENT_ENCRYPTION_KEY-derived) file ciphertext.
// Legacy (v1) files have no marker and start directly with a random 12-byte
// IV — the chance an old file's IV happens to start with these exact 8
// bytes is 2^-64, so presence/absence of the marker is an unambiguous
// format signal.
const FILE_FORMAT_V2_MARKER = Buffer.from("NTRDENC2", "utf-8");

const ENC_PREFIX_V1 = "$enc$v1$"; // legacy: SESSION_SECRET-derived key
const ENC_PREFIX_V2 = "$enc$v2$"; // dedicated: DATA_ENCRYPTION_KEY-derived key

function deriveKey(label: string, secret: string): Buffer {
  return createHash("sha256").update(`${label}:${secret}`).digest();
}

/** Legacy shared key (v1) — still required to read data encrypted before key separation. */
function getLegacyKey(): Buffer {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "SESSION_SECRET belum diset di .env — dibutuhkan untuk membaca dokumen/data terenkripsi format lama (v1)."
    );
  }
  return deriveKey("document-encryption", secret);
}

function getDataKey(): Buffer {
  const secret = process.env.DATA_ENCRYPTION_KEY;
  if (!secret) {
    throw new Error(
      "DATA_ENCRYPTION_KEY belum diset di .env — dibutuhkan untuk membaca data OCR/terstruktur format baru (v2). Lihat SECURITY.md."
    );
  }
  return deriveKey("data-encryption-v2", secret);
}

function getFileKey(): Buffer {
  const secret = process.env.DOCUMENT_ENCRYPTION_KEY;
  if (!secret) {
    throw new Error(
      "DOCUMENT_ENCRYPTION_KEY belum diset di .env — dibutuhkan untuk membaca dokumen format baru (v2). Lihat SECURITY.md."
    );
  }
  return deriveKey("document-encryption-v2", secret);
}

/** True once both dedicated keys are configured — controls which format new writes use. */
export function isKeySeparationConfigured(): boolean {
  return Boolean(process.env.DATA_ENCRYPTION_KEY) && Boolean(process.env.DOCUMENT_ENCRYPTION_KEY);
}

function aesGcmEncrypt(key: Buffer, plaintext: Buffer): Buffer {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]);
}

function aesGcmDecrypt(key: Buffer, data: Buffer): Buffer {
  if (data.length < IV_LENGTH + AUTH_TAG_LENGTH) {
    throw new Error("Ciphertext tidak valid atau rusak (terlalu pendek).");
  }
  const iv = data.subarray(0, IV_LENGTH);
  const authTag = data.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = data.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

// ------------------------------------------------------------------
// File encryption (uploaded scans, storage/uploads/*)
// v2 format: [marker(8)][iv(12)][authTag(16)][ciphertext]  (DOCUMENT_ENCRYPTION_KEY)
// v1 format:           [iv(12)][authTag(16)][ciphertext]  (SESSION_SECRET, legacy)
// ------------------------------------------------------------------
export function encryptDocumentBuffer(plaintext: Buffer): Buffer {
  if (isKeySeparationConfigured()) {
    return Buffer.concat([FILE_FORMAT_V2_MARKER, aesGcmEncrypt(getFileKey(), plaintext)]);
  }
  return aesGcmEncrypt(getLegacyKey(), plaintext);
}

export function decryptDocumentBuffer(data: Buffer): Buffer {
  const marker = data.subarray(0, FILE_FORMAT_V2_MARKER.length);
  if (marker.equals(FILE_FORMAT_V2_MARKER)) {
    return aesGcmDecrypt(getFileKey(), data.subarray(FILE_FORMAT_V2_MARKER.length));
  }
  return aesGcmDecrypt(getLegacyKey(), data);
}

// ------------------------------------------------------------------
// Text/JSON encryption for OCR data stored in SQLite columns
// (ocrRawText, fieldGuesses).
// v2: $enc$v2$<base64(iv+authTag+ciphertext)>  (DATA_ENCRYPTION_KEY)
// v1: $enc$v1$<base64(iv+authTag+ciphertext)>  (SESSION_SECRET, legacy)
// Legacy plaintext (pre-encryption, no prefix) auto-detected and returned
// as-is on read — new writes are always encrypted.
// ------------------------------------------------------------------
export function encryptString(plaintext: string): string {
  if (isKeySeparationConfigured()) {
    const encrypted = aesGcmEncrypt(getDataKey(), Buffer.from(plaintext, "utf-8"));
    return `${ENC_PREFIX_V2}${encrypted.toString("base64")}`;
  }
  const encrypted = aesGcmEncrypt(getLegacyKey(), Buffer.from(plaintext, "utf-8"));
  return `${ENC_PREFIX_V1}${encrypted.toString("base64")}`;
}

export function decryptString(stored: string): string {
  if (stored.startsWith(ENC_PREFIX_V2)) {
    const data = Buffer.from(stored.slice(ENC_PREFIX_V2.length), "base64");
    return aesGcmDecrypt(getDataKey(), data).toString("utf-8");
  }
  if (stored.startsWith(ENC_PREFIX_V1)) {
    const data = Buffer.from(stored.slice(ENC_PREFIX_V1.length), "base64");
    return aesGcmDecrypt(getLegacyKey(), data).toString("utf-8");
  }
  return stored;
}

export function encryptJson(value: unknown): string {
  return encryptString(JSON.stringify(value));
}

/**
 * Decrypt a Json column value that may be encrypted (string starting with
 * $enc$v1$ or $enc$v2$) or legacy plaintext (already-parsed object from
 * Prisma). Returns null for null/undefined input.
 */
export function decryptJsonField<T>(stored: unknown): T | null {
  if (stored === null || stored === undefined) return null;
  if (typeof stored === "string" && (stored.startsWith(ENC_PREFIX_V1) || stored.startsWith(ENC_PREFIX_V2))) {
    return JSON.parse(decryptString(stored)) as T;
  }
  return stored as T;
}

/** True when a stored string value is still in legacy v1 format (needs migration). */
export function isLegacyEncryptedString(stored: string): boolean {
  return stored.startsWith(ENC_PREFIX_V1);
}

/** True when a file buffer read from disk is still in legacy v1 format (needs migration). */
export function isLegacyEncryptedFile(data: Buffer): boolean {
  return !data.subarray(0, FILE_FORMAT_V2_MARKER.length).equals(FILE_FORMAT_V2_MARKER);
}
