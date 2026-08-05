// PM2 process-supervisor config — keeps the notary AML app running and
// auto-restarts it if the Next.js server process crashes. This gives
// crash-recovery ("always on" while the machine is running), NOT
// boot-persistence — after a reboot, `npm run up` still needs to be run
// once. See SETUP.md "Menjalankan App Selalu Aktif" for the full flow.
//
// `next start` (not `next dev`) is used — production mode is what a
// long-running supervised process should run, and requires `next build`
// first (handled by the `up` npm script, not here, so this file stays a
// pure PM2 config).
module.exports = {
  apps: [
    {
      name: "notary-aml",
      script: "node_modules/next/dist/bin/next",
      // -H 127.0.0.1 mempertahankan FR-6A (bind ke localhost saja, tidak
      // diekspos ke jaringan) — sama dengan `npm run start` biasa. Port
      // 4001 adalah port standar aplikasi ini (sama persis di semua mode:
      // dev/start/pm2/OAuth redirect URI) — lihat PORT di .env.example.
      args: ["start", "-H", "127.0.0.1", "-p", process.env.PORT || "4001"],
      cwd: __dirname,
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      // Kalau proses crash berulang dalam <10 detik sejak start, PM2 anggap
      // itu crash-loop (bukan gangguan sesaat) dan berhenti mencoba setelah
      // max_restarts kali — supaya tidak menghabiskan CPU tanpa henti kalau
      // penyebabnya memang bug yang butuh perbaikan manual, bukan hal
      // transient yang wajar di-auto-restart.
      min_uptime: "10s",
      max_restarts: 20,
      restart_delay: 2000,
      watch: false,
      env: {
        NODE_ENV: "production",
      },
      out_file: "logs/pm2-out.log",
      error_file: "logs/pm2-error.log",
      merge_logs: true,
      time: true,
    },
  ],
};
