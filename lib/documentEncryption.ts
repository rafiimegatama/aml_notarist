import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

/**
 * Encrypts scanned ID documents (KTP/NPWP/dll.) at rest in storage/uploads/
 * (Phase 3, subset of FR-5). Reuses SESSION_SECRET (already required, lihat
 * lib/auth.ts) daripada menambah env var wajib baru — pola yang sama dengan
 * lib/ai/crypto.ts, dipisah lewat label SHA-256 berbeda supaya kunci turunan
 * di sini berbeda dari kunci HMAC sesi maupun kunci enkripsi AI settings.
 *
 * Residual risk (JANGAN dianggap solusi penuh): kunci berasal dari env var
 * yang hidup di disk yang sama dengan file terenkripsi. Ini menaikkan
 * standar terhadap "seseorang menyalin folder storage/", TAPI TIDAK
 * terhadap "seseorang punya akses penuh ke PC ini" — lihat SETUP.md.
 */
function getDocumentEncryptionKey(): Buffer {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET belum diset di .env — dibutuhkan juga untuk enkripsi dokumen.");
  }
  return createHash("sha256").update(`document-encryption:${secret}`).digest();
}

const IV_LENGTH = 12; // recommended nonce length for AES-GCM
const AUTH_TAG_LENGTH = 16;

/** Format hasil: [iv(12 byte)][authTag(16 byte)][ciphertext]. */
export function encryptDocumentBuffer(plaintext: Buffer): Buffer {
  const key = getDocumentEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]);
}

export function decryptDocumentBuffer(data: Buffer): Buffer {
  const key = getDocumentEncryptionKey();
  const iv = data.subarray(0, IV_LENGTH);
  const authTag = data.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = data.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}
