import { readEncryptionMigrationStatus } from "@/lib/encryptionMigrationStatus";

/**
 * Fail-closed boot check for the encryption key separation feature.
 * Called once from instrumentation.ts on server start (Node.js runtime only).
 *
 * Two failure modes it catches, both deliberately fatal (throw, not warn):
 *
 * 1. Half-configured keys — DATA_ENCRYPTION_KEY set without
 *    DOCUMENT_ENCRYPTION_KEY (or vice versa). Always a misconfiguration,
 *    never a valid intentional state, since the two are meant to be adopted
 *    together.
 * 2. Keys missing after migration already ran — scripts/migrate-encryption.ts
 *    writes storage/encryption-migration-status.json once it has re-encrypted
 *    data under the new keys. If that file exists but the env vars are gone
 *    at boot (e.g. accidentally dropped from .env), the app must refuse to
 *    start rather than run in legacy-key mode and produce confusing decrypt
 *    failures the first time someone opens a migrated document.
 *
 * Deliberately does NOT require the keys just because NODE_ENV=production —
 * this app's PM2 "up" script always sets NODE_ENV=production even for a
 * bare local single-notary deployment that has never opted into key
 * separation, so gating on NODE_ENV alone would break every existing
 * deployment on upgrade. Requiring the keys is driven by migration state,
 * not by environment name. Never generates a key itself under any condition.
 */
export function assertEncryptionKeyConfiguration(): void {
  const dataKey = process.env.DATA_ENCRYPTION_KEY;
  const docKey = process.env.DOCUMENT_ENCRYPTION_KEY;
  const onlyOneSet = Boolean(dataKey) !== Boolean(docKey);

  if (onlyOneSet) {
    throw new Error(
      "Konfigurasi kunci enkripsi tidak lengkap: DATA_ENCRYPTION_KEY dan " +
        "DOCUMENT_ENCRYPTION_KEY harus diset BERSAMAAN, bukan salah satu saja. " +
        "Lihat SECURITY.md bagian Key Separation."
    );
  }

  const migrated = readEncryptionMigrationStatus();
  if (migrated && (!dataKey || !docKey)) {
    throw new Error(
      "Migrasi enkripsi sudah pernah dijalankan " +
        "(storage/encryption-migration-status.json ada) tapi " +
        "DATA_ENCRYPTION_KEY/DOCUMENT_ENCRYPTION_KEY tidak diset di .env. " +
        "Data terenkripsi format baru tidak bisa dibaca tanpa kunci ini — " +
        "aplikasi berhenti (fail closed) daripada berjalan dengan data yang " +
        "tidak bisa didekripsi. Lihat SECURITY.md."
    );
  }
}
