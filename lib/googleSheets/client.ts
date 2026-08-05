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

export async function clearRange(config: SheetsConfig, range: string): Promise<void> {
  const url = `${SHEETS_API_BASE}/${config.spreadsheetId}/values/${encodeURIComponent(range)}:clear`;
  await authorizedFetch(config, url, { method: "POST" });
}

export type SheetTabMeta = { sheetId: number; title: string };

export async function listSheetTabs(config: SheetsConfig): Promise<SheetTabMeta[]> {
  const url = `${SHEETS_API_BASE}/${config.spreadsheetId}?fields=sheets.properties(sheetId,title)`;
  const data = (await authorizedFetch(config, url)) as {
    sheets?: { properties: SheetTabMeta }[];
  };
  return (data.sheets ?? []).map((s) => s.properties);
}

/**
 * Bikin tab (sheet) baru lewat batchUpdate kalau namanya belum ada — dicek
 * lewat listSheetTabs dulu supaya idempotent (jalan ulang tidak bikin tab
 * duplikat / tidak error kalau tab sudah pernah dibuat run sebelumnya).
 */
export async function ensureTabsExist(
  config: SheetsConfig,
  titles: string[]
): Promise<void> {
  const existing = await listSheetTabs(config);
  const existingTitles = new Set(existing.map((s) => s.title));
  const missing = titles.filter((t) => !existingTitles.has(t));
  if (missing.length === 0) return;

  const url = `${SHEETS_API_BASE}/${config.spreadsheetId}:batchUpdate`;
  await authorizedFetch(config, url, {
    method: "POST",
    body: JSON.stringify({
      requests: missing.map((title) => ({ addSheet: { properties: { title } } })),
    }),
  });
}

/**
 * Konversi index kolom 1-based jadi huruf kolom Sheets (1->A, 26->Z, 27->AA).
 * Dipakai supaya tab dengan >26 kolom (mis. CDD_Perorangan) tetap benar.
 */
export function columnLetter(index: number): string {
  let n = index;
  let letters = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    letters = String.fromCharCode(65 + rem) + letters;
    n = Math.floor((n - 1) / 26);
  }
  return letters;
}
