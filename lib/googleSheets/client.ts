import { JWT } from "google-auth-library";

const SHEETS_API_BASE = "https://sheets.googleapis.com/v4/spreadsheets";

export type SheetsConfig = {
  spreadsheetId: string;
  sheetName: string;
  client: JWT;
};

/**
 * Baca kredensial Service Account dari environment variable. Return null
 * (bukan throw) kalau belum dikonfigurasi — caller (server action) yang
 * memutuskan pesan error yang ramah untuk ditampilkan ke notaris.
 */
export function getSheetsConfig(): SheetsConfig | null {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  const sheetName = process.env.GOOGLE_SHEETS_SHEET_NAME || "Sheet1";

  if (!spreadsheetId || !email || !rawKey) return null;

  const client = new JWT({
    email,
    // .env menyimpan private key dalam satu baris dengan "\n" literal —
    // harus diubah jadi newline asli sebelum dipakai untuk sign JWT.
    key: rawKey.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return { spreadsheetId, sheetName, client };
}

async function authorizedFetch(
  config: SheetsConfig,
  url: string,
  init?: RequestInit
): Promise<unknown> {
  const { token } = await config.client.getAccessToken();
  if (!token) {
    throw new Error("Gagal mendapatkan access token dari Google (cek kredensial Service Account).");
  }
  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Google Sheets API error (${res.status}): ${body}`);
  }
  return res.json();
}

export async function readRange(
  config: SheetsConfig,
  range: string
): Promise<string[][]> {
  const url = `${SHEETS_API_BASE}/${config.spreadsheetId}/values/${encodeURIComponent(range)}`;
  const data = (await authorizedFetch(config, url)) as { values?: string[][] };
  return data.values ?? [];
}

export async function updateRange(
  config: SheetsConfig,
  range: string,
  values: string[][]
): Promise<void> {
  const url = `${SHEETS_API_BASE}/${config.spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
  await authorizedFetch(config, url, {
    method: "PUT",
    body: JSON.stringify({ values }),
  });
}

export async function appendRange(
  config: SheetsConfig,
  range: string,
  values: string[][]
): Promise<void> {
  const url = `${SHEETS_API_BASE}/${config.spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
  await authorizedFetch(config, url, {
    method: "POST",
    body: JSON.stringify({ values }),
  });
}
