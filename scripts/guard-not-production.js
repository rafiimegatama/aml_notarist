// Runs automatically before `npm run dev` / `npm run dev:lan` (see npm
// "pre<script>" convention in package.json). Refuses to start a development
// server when NODE_ENV=production is set in the environment — the realistic
// failure mode this guards against is an operator's shell still carrying
// NODE_ENV=production from a previous `npm run up` (PM2) session and then
// running `dev:lan` (binds 0.0.0.0, unminified/verbose dev build) on what is
// actually a deployed office machine. `start`/`start:lan` (next start) are
// NOT guarded here — NODE_ENV=production is the correct, expected value for
// those.
if (process.env.NODE_ENV === "production") {
  console.error(
    "Menolak menjalankan dev server: NODE_ENV=production terdeteksi.\n" +
      "Ini kemungkinan sisa environment dari sesi produksi (mis. `npm run up`).\n" +
      "Untuk pengembangan lokal, jalankan di shell/terminal terpisah tanpa NODE_ENV=production.\n" +
      "Untuk menjalankan aplikasi produksi, pakai `npm run start` / `npm run up`, bukan `dev`/`dev:lan`."
  );
  process.exit(1);
}
