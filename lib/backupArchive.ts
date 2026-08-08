import { createHash } from "node:crypto";
import { createWriteStream } from "node:fs";
import { access, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { ZipArchive } from "archiver";
import { BACKUP_DIR, BACKUP_META_PATH, DB_PATH, UPLOAD_DIR } from "@/lib/storage";

export type BackupMeta = {
  lastManualBackupAt: string;
  fileName: string;
  sha256: string;
};

export type CreateBackupResult =
  | { success: true; fileName: string; createdAt: string }
  | { success: false; error: string };

function sha256(data: Buffer): string {
  return createHash("sha256").update(data).digest("hex");
}

/**
 * Path override — dipakai HANYA oleh test (lib/actions/backup.test.ts),
 * yang mengimpor fungsi INI secara langsung, bukan lewat Server Action
 * `createBackup()` di lib/actions/backup.ts.
 *
 * Modul ini SENGAJA TIDAK "use server" — kalau override path ada di file
 * "use server", parameter itu jadi bisa dipanggil siapa pun yang tahu action
 * ID-nya lewat POST langsung ke server (Next.js Server Action ID publik,
 * terlepas dari argumen apa yang benar-benar dikirim UI), yang berarti path
 * apa pun (mis. ".env" sebagai "dbPath") bisa dibaca lalu diunduh lewat
 * /api/backup/[filename] — arbitrary file read pasca-PIN. Memisahkan logika
 * archiving ke modul biasa (bukan Server Action) membuatnya TIDAK bisa
 * dijangkau lewat HTTP sama sekali, hanya lewat import kode langsung.
 */
export async function buildBackupZip(paths: {
  dbPath?: string;
  uploadDir?: string;
  backupDir?: string;
} = {}): Promise<CreateBackupResult> {
  const dbPath = paths.dbPath ?? DB_PATH;
  const uploadDir = paths.uploadDir ?? UPLOAD_DIR;
  const backupDir = paths.backupDir ?? BACKUP_DIR;
  const metaPath = paths.backupDir ? path.join(backupDir, "meta.json") : BACKUP_META_PATH;

  try {
    await mkdir(backupDir, { recursive: true });
    await mkdir(uploadDir, { recursive: true });

    const createdAt = new Date().toISOString();
    const fileName = `backup-${createdAt.replace(/[:.]/g, "-")}.zip`;
    const fullPath = path.join(backupDir, fileName);

    const dbExists = await access(dbPath)
      .then(() => true)
      .catch(() => false);

    // Build manifest — SHA-256 of each file that goes into the zip.
    const manifest: Record<string, string> = {};

    if (dbExists) {
      const dbBuf = await readFile(dbPath);
      manifest["dev.db"] = sha256(dbBuf);
    }

    const uploadFiles = await readdir(uploadDir).catch(() => [] as string[]);
    for (const f of uploadFiles) {
      const buf = await readFile(path.join(uploadDir, f));
      manifest[`uploads/${f}`] = sha256(buf);
    }

    await new Promise<void>((resolve, reject) => {
      const output = createWriteStream(fullPath);
      const archive = new ZipArchive({ zlib: { level: 9 } });
      output.on("close", () => resolve());
      output.on("error", reject);
      archive.on("error", reject);
      archive.pipe(output);
      if (dbExists) archive.file(dbPath, { name: "dev.db" });
      archive.directory(uploadDir, "uploads");
      archive.append(JSON.stringify(manifest, null, 2), { name: "manifest.json" });
      archive.finalize();
    });

    // Checksum of the zip itself — stored externally for quick verification.
    const zipBuf = await readFile(fullPath);
    const zipSha256 = sha256(zipBuf);

    const meta: BackupMeta = { lastManualBackupAt: createdAt, fileName, sha256: zipSha256 };
    await writeFile(metaPath, JSON.stringify(meta), "utf-8");

    return { success: true, fileName, createdAt };
  } catch (err) {
    console.error("Backup gagal:", err);
    return {
      success: false,
      error: "Gagal membuat backup. Lihat log server untuk detail.",
    };
  }
}

/**
 * Verify a backup zip: check external SHA-256 (from meta.json) matches the
 * file on disk. Returns a descriptive result.
 */
export async function verifyBackupChecksum(
  zipPath: string,
  expectedSha256: string
): Promise<{ valid: boolean; detail: string }> {
  try {
    const buf = await readFile(zipPath);
    const actual = sha256(buf);
    if (actual === expectedSha256) {
      return { valid: true, detail: "Checksum cocok." };
    }
    return { valid: false, detail: `Checksum tidak cocok: expected ${expectedSha256.slice(0, 12)}…, got ${actual.slice(0, 12)}….` };
  } catch {
    return { valid: false, detail: "File backup tidak ditemukan." };
  }
}
