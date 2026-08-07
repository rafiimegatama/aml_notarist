import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

/**
 * Encrypts secrets-at-rest for AI provider settings (e.g. a cloud API key
 * pasted into the Settings UI instead of set via env var). Reuses
 * SESSION_SECRET (already required — see lib/auth.ts) rather than
 * introducing a new required env var; the key is domain-separated via a
 * SHA-256 label so it's cryptographically distinct from the HMAC session
 * tokens signed in lib/auth.ts.
 */
function getEncryptionKey(): Buffer {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET belum diset di .env — dibutuhkan juga untuk enkripsi AI settings.");
  }
  return createHash("sha256").update(`ai-settings-encryption:${secret}`).digest();
}

const IV_LENGTH = 12; // recommended nonce length for AES-GCM

export function encryptSecret(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString("hex"), authTag.toString("hex"), encrypted.toString("hex")].join(".");
}

export function decryptSecret(ciphertext: string): string | null {
  try {
    const [ivHex, tagHex, dataHex] = ciphertext.split(".");
    if (!ivHex || !tagHex || !dataHex) return null;
    const key = getEncryptionKey();
    const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivHex, "hex"));
    decipher.setAuthTag(Buffer.from(tagHex, "hex"));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(dataHex, "hex")),
      decipher.final(),
    ]);
    return decrypted.toString("utf8");
  } catch {
    // Kunci berubah (SESSION_SECRET diganti) atau data korup — anggap tidak
    // terkonfigurasi daripada throw, sama seperti pola verifyPinHash.
    return null;
  }
}

/** For display only — never send the real key back to the client. */
export function maskSecret(plaintext: string): string {
  if (plaintext.length <= 4) return "••••";
  return `••••${plaintext.slice(-4)}`;
}
