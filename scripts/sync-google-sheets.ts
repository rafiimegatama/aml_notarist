// Full rebuild sinkronisasi semua tab detail CDD ke Google Sheets (Fase 2-4
// desain skema — lihat percakapan/README). Tab spine ("Customers"/rollup,
// nama tab dari GOOGLE_SHEETS_SHEET_NAME) tidak disentuh skrip ini — itu
// upsert real-time tiap kali status CDD berubah, lewat
// lib/actions/sheetsExport.ts.
//
// Pakai: npx tsx -r dotenv/config scripts/sync-google-sheets.ts dotenv_config_path=.env

import { syncAllDetailTabsToSheet } from "../lib/actions/sheetsFullSync";

async function main() {
  const result = await syncAllDetailTabsToSheet();
  if (!result.success) {
    console.error("Sync gagal:", result.error);
    process.exit(1);
  }
  console.log("Sync berhasil. Jumlah baris per tab:");
  for (const [tab, count] of Object.entries(result.counts)) {
    console.log(`  ${tab}: ${count}`);
  }
}

main();
