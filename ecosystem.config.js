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
// Ollama sengaja diinstal manual (bukan lewat package manager sistem) di
// $HOME/ollama — instalasi resmi `install.sh` butuh sudo/root yang tidak
// tersedia di mesin ini, jadi dipakai tarball resmi Ollama tanpa root,
// diekstrak ke $HOME/ollama/{bin,lib}. Ini instalasi per-mesin (seperti PM2
// sendiri), bukan bagian dari repo — kalau dijalankan di mesin lain, ulangi
// langkah instalasi manual di SETUP.md sebelum PM2 bisa start proses ini.
const os = require("os");
const path = require("path");
const OLLAMA_HOME = path.join(os.homedir(), "ollama");

module.exports = {
  apps: [
    {
      name: "ollama-serve",
      script: path.join(OLLAMA_HOME, "bin", "ollama"),
      args: ["serve"],
      cwd: OLLAMA_HOME,
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      min_uptime: "10s",
      max_restarts: 20,
      restart_delay: 2000,
      watch: false,
      env: {
        // Library CUDA/ROCm ikut dibundel di dalam tarball resmi, bukan
        // terinstal sistem-wide — harus dituntun eksplisit lewat
        // LD_LIBRARY_PATH supaya GPU passthrough WSL2 terdeteksi.
        OLLAMA_HOST: "127.0.0.1:11434",
        LD_LIBRARY_PATH: path.join(OLLAMA_HOME, "lib", "ollama"),
      },
      out_file: "logs/pm2-ollama-out.log",
      error_file: "logs/pm2-ollama-error.log",
      merge_logs: true,
      time: true,
    },
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
