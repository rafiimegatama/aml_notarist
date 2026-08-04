import { JWT } from "google-auth-library";

const DRIVE_UPLOAD_URL =
  "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";

export type DriveConfig = {
  folderId: string;
  client: JWT;
};

/**
 * FR-1.4 — sama seperti getSheetsConfig() (lib/googleSheets/client.ts): baca
 * kredensial dari environment variable, return null (bukan throw) kalau
 * belum dikonfigurasi. Scope "drive.file" (bukan "drive" penuh) — Service
 * Account ini hanya boleh membuat/melihat file yang dibuatnya sendiri, tidak
 * perlu akses ke seluruh Drive.
 */
export function getDriveConfig(): DriveConfig | null {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

  if (!folderId || !email || !rawKey) return null;

  const client = new JWT({
    email,
    key: rawKey.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/drive.file"],
  });

  return { folderId, client };
}

/** Upload sederhana (multipart, satu request) — cocok untuk file foto/scan berukuran kecil (<15MB, lihat MAX_FILE_SIZE di lib/actions/document.ts). */
export async function uploadFileToDrive(
  config: DriveConfig,
  fileName: string,
  mimeType: string,
  buffer: Buffer
): Promise<void> {
  const { token } = await config.client.getAccessToken();
  if (!token) {
    throw new Error("Gagal mendapatkan access token dari Google (cek kredensial Service Account).");
  }

  const boundary = "notary_drive_upload_boundary";
  const metadata = JSON.stringify({ name: fileName, parents: [config.folderId] });
  const body =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${metadata}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: ${mimeType}\r\n` +
    `Content-Transfer-Encoding: base64\r\n\r\n` +
    `${buffer.toString("base64")}\r\n` +
    `--${boundary}--`;

  const res = await fetch(DRIVE_UPLOAD_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google Drive API error (${res.status}): ${text}`);
  }
}
