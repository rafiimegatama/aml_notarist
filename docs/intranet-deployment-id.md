# Panduan Deployment Intranet — AML Notarist

**Untuk:** Administrator IT kantor notaris (tidak perlu mengerti Next.js)
**Target:** Akses via `https://amlguard.notaris.co.id` dari semua PC di jaringan
kantor — **TIDAK tersambung ke internet**.

---

## Gambaran Arsitektur

```
PC Klien (browser)
   │
   │ HTTPS port 443 — di dalam jaringan kantor saja
   ▼
Server Kantor (IP LAN statis, mis. 192.168.1.10)
   │
   ├─ Caddy (reverse proxy, menangani TLS)  → port 443 LAN
   │     │
   │     └─ forward ke 127.0.0.1:4001 (lokal di server, tidak diekspos LAN)
   │
   └─ Next.js / PM2 (aplikasi AML Notarist) → hanya mendengarkan 127.0.0.1:4001
```

Port 4001 **tidak pernah diekspos ke LAN** — hanya Caddy yang menjangkaunya
dari dalam server yang sama. Port 443 hanya bisa diakses dari dalam kantor
(tidak ada port forwarding ke internet).

---

## A. Mengatur IP LAN Statis di Server

Server yang menjalankan aplikasi ini harus punya IP LAN tetap supaya semua
PC klien bisa diarahkan ke alamat yang sama.

**Cara cepat di Windows 11:**

1. Buka **Settings → Network & Internet → Ethernet** (atau Wi-Fi).
2. Klik nama koneksi yang aktif → **Edit** di samping "IP assignment".
3. Ganti ke **Manual**, aktifkan **IPv4**, isi:
   - **IP address:** mis. `192.168.1.10`
     _(pilih angka yang tidak dipakai perangkat lain; cek dulu lewat
     `arp -a` di cmd untuk melihat IP yang sedang dipakai di LAN)_
   - **Subnet mask:** `255.255.255.0`
   - **Gateway:** IP router kantor (biasanya `192.168.1.1`)
   - **DNS:** sama dengan gateway, atau `8.8.8.8` untuk internet
4. Klik **Save**.
5. Catat IP yang dipilih — dipakai di langkah B dan C.

---

## B. Mengatur DNS Internal

Tujuan: agar `amlguard.notaris.co.id` di browser semua PC kantor mengarah
ke IP server kantor (bukan ke internet).

### Opsi 1 — File hosts di setiap PC (paling sederhana, tanpa server DNS)

Lakukan di **setiap PC yang perlu mengakses aplikasi** (termasuk server itu
sendiri), sebagai Administrator:

1. Buka **Notepad sebagai Administrator** (klik kanan → "Run as administrator").
2. Buka file: `C:\Windows\System32\drivers\etc\hosts`
3. Tambahkan baris di bagian bawah:
   ```
   192.168.1.10    amlguard.notaris.co.id
   ```
   _(ganti `192.168.1.10` dengan IP server yang dipilih di langkah A)_
4. Simpan file. Tidak perlu restart — langsung berlaku.
5. Verifikasi: buka cmd → `ping amlguard.notaris.co.id` — harus balas dari
   `192.168.1.10`.

### Opsi 2 — Router yang mendukung custom DNS (kalau router kantor mendukung)

Beberapa router (mis. MikroTik, Asus) punya fitur "DNS static entry":
- Masuk ke admin router → DNS → Static Entries
- Tambah: `amlguard.notaris.co.id` → `192.168.1.10`
- Semua perangkat di jaringan otomatis mengenal nama ini tanpa edit hosts.

### Opsi 3 — Windows DNS Server (kalau sudah ada domain controller)

Tambahkan A record di DNS zone internal:
```
amlguard.notaris.co.id.  IN  A  192.168.1.10
```

---

## C. Mengatur Reverse Proxy (Caddy)

Caddy adalah program kecil satu file yang menangani HTTPS dan meneruskan
request ke aplikasi.

### C.1 Unduh Caddy

1. Buka <https://caddyserver.com/download> → pilih **Windows amd64** → unduh
   `caddy_windows_amd64.exe`.
2. Buat folder `C:\caddy\` dan salin file ke sana, rename jadi `caddy.exe`.
3. Buat subfolder: `C:\caddy\certs\` dan `C:\caddy\logs\`

### C.2 Salin Caddyfile

Salin file `caddy/Caddyfile` dari repo ini ke `C:\caddy\Caddyfile`.

_(File ini sudah ada di repo — cukup salin, tidak perlu edit kalau IP/hostname
tidak berubah dari panduan ini.)_

---

## D. Mengatur Sertifikat TLS Internal (mkcert)

**Mengapa mkcert, bukan self-signed biasa?**
Self-signed certificate akan menampilkan peringatan "Koneksi tidak aman" di
browser. mkcert membuat CA lokal yang dipercaya browser setelah di-install —
koneksi tampil aman dengan gembok hijau tanpa peringatan.

### D.1 Install mkcert di server

1. Unduh `mkcert-v*-windows-amd64.exe` dari
   <https://github.com/FiloSottile/mkcert/releases/latest>
2. Salin ke `C:\caddy\mkcert.exe` (tidak perlu installer).
3. Buka **cmd sebagai Administrator**, jalankan:
   ```cmd
   C:\caddy\mkcert.exe -install
   ```
   Ini membuat CA lokal dan mendaftarkannya ke Windows Certificate Store.
   Sertifikat CA ada di:
   `C:\Users\<NamaUser>\AppData\Local\mkcert\rootCA.pem`
   _(catat lokasinya — dibutuhkan di langkah E untuk PC klien)_

### D.2 Buat sertifikat untuk hostname aplikasi

Di cmd (tidak perlu Administrator), dari direktori mana saja:
```cmd
cd C:\caddy\certs
C:\caddy\mkcert.exe amlguard.notaris.co.id
```

Dua file terbuat:
- `amlguard.notaris.co.id.pem` — sertifikat publik
- `amlguard.notaris.co.id-key.pem` — kunci privat (**jaga kerahasiaannya**)

File ini sudah langsung ditunjuk oleh `C:\caddy\Caddyfile` — tidak perlu
konfigurasi tambahan.

---

## E. Mendistribusikan CA ke PC Klien

Agar browser di setiap PC klien mempercayai sertifikat yang dibuat mkcert,
CA lokal harus diinstall di sana.

### E.1 Salin file CA dari server

File CA ada di server (hasil langkah D.1):
```
C:\Users\<NamaUser>\AppData\Local\mkcert\rootCA.pem
```
Salin ke PC klien lewat flashdisk atau share jaringan.

### E.2 Install CA di PC klien (Windows)

Di setiap PC klien, buka **cmd sebagai Administrator**:

**Cara A — pakai mkcert (paling mudah):**
```cmd
rem Salin mkcert.exe ke PC klien dulu (dari C:\caddy\mkcert.exe di server)
rem Kemudian:
mkcert.exe -install
```
Ini install CA mkcert lokal untuk user saat ini. Jika mkcert belum punya CA
di PC klien, ia akan membuatnya sendiri — **BUKAN** CA yang sama dengan server,
jadi cara ini hanya cocok kalau mkcert juga dijalankan ulang untuk membuat
sertifikat di PC klien.

**Cara B — import rootCA.pem secara manual (direkomendasikan):**
```cmd
rem Jalankan sebagai Administrator di PC klien:
certutil -addstore -f "ROOT" C:\path\ke\rootCA.pem
```
Ganti `C:\path\ke\rootCA.pem` dengan lokasi file yang disalin dari server.

Verifikasi: buka browser → navigasi ke `https://amlguard.notaris.co.id` →
harus tampil gembok tanpa peringatan (setelah langkah F selesai).

### E.3 Browser berbasis Chromium & Firefox

- **Chrome / Edge / Brave:** otomatis pakai Windows Certificate Store → selesai
  setelah langkah E.2.
- **Firefox:** punya certificate store sendiri.
  Buka Firefox → **Settings → Privacy & Security → Certificates →
  View Certificates → Authorities → Import** → pilih `rootCA.pem`.

---

## F. Menjalankan Aplikasi AML Notarist

Di server, buka **cmd atau Git Bash** di folder repo:

```cmd
rem Pertama kali / setelah pull update:
npm install

rem Build & jalankan lewat PM2 (tetap hidup walau terminal ditutup):
npm run up
```

Cek status:
```cmd
npm run status
```
Harus tampil `notary-aml  online`.

Cek health endpoint dari server:
```cmd
curl http://127.0.0.1:4001/api/health
```
Harus balas `{"status":"ok",...}`.

**Ingat:** Setelah Windows di-restart, jalankan `npm run up` sekali lagi —
aplikasi tidak otomatis hidup sendiri setelah reboot (ini by design, lihat
SETUP.md bagian "Menjalankan App Selalu Aktif").

---

## G. Menjalankan Caddy

### Sekali (testing / sementara)

Buka cmd baru (tetap di samping yang menjalankan PM2), jalankan:
```cmd
C:\caddy\caddy.exe run --config C:\caddy\Caddyfile
```
Caddy berjalan di foreground. Tekan `Ctrl+C` untuk menghentikan.

### Sebagai Windows Service (direkomendasikan untuk produksi)

Buka **cmd sebagai Administrator**:
```cmd
rem Install sekali saja:
C:\caddy\caddy.exe service install

rem Konfigurasi layanan untuk pakai Caddyfile ini:
rem (edit registry atau pakai NSSM kalau caddy service install tidak
rem  mendukung --config, lihat catatan di bawah)

rem Jalankan layanan:
net start caddy
```

> **Catatan:** `caddy service install` secara default mencari `Caddyfile` di
> direktori tempat `caddy.exe` berada. Karena kita menyimpan keduanya di
> `C:\caddy\`, ini langsung bekerja. Kalau ingin path eksplisit, gunakan
> [NSSM](https://nssm.cc/) sebagai wrapper:
> ```cmd
> nssm install CaddyAML "C:\caddy\caddy.exe" "run --config C:\caddy\Caddyfile"
> nssm start CaddyAML
> ```

---

## H. Mengonfigurasi `.env` di Server

Buka file `.env` di folder repo (bukan `.env.example`). Pastikan baris
berikut ada dan terisi:

```env
APP_BASE_URL="https://amlguard.notaris.co.id"
```

Baris ini memberi tahu aplikasi bahwa ia diakses lewat HTTPS — sehingga:
- Cookie sesi di-set dengan flag `Secure` (wajib untuk HTTPS)
- Redirect URI "Lupa PIN" via Google diarahkan ke URL kanonik yang benar

Setelah mengubah `.env`, rebuild dan restart:
```cmd
npm run up
```

---

## I. Membuka Aplikasi

Dari PC klien mana pun di jaringan kantor (setelah langkah A–H selesai):

```
https://amlguard.notaris.co.id
```

Harus tampil halaman login PIN dengan gembok di address bar.

---

## J. Konfigurasi Firewall Windows di Server

Port 443 (HTTPS) harus diizinkan masuk di Windows Firewall server **dari
jaringan lokal saja**.

Buka **cmd sebagai Administrator** di server:
```cmd
rem Izinkan port 443 hanya dari LAN (ganti 192.168.1.0/24 sesuai range LAN):
netsh advfirewall firewall add rule ^
  name="Caddy HTTPS - LAN Only" ^
  protocol=TCP ^
  dir=in ^
  localport=443 ^
  remoteip=192.168.1.0/24 ^
  action=allow

rem JANGAN buka port 443 untuk semua IP (0.0.0.0/0) — itu mengekspos ke internet
rem kalau router punya IP publik.
```

Port 4001 (Next.js) **tidak dibuka** — sudah bound ke 127.0.0.1, tidak perlu
rule firewall.

---

## K. Verifikasi Akhir

Dari **server**:
```cmd
rem Aplikasi Next.js hidup:
curl http://127.0.0.1:4001/api/health

rem Caddy meneruskan dengan benar (ganti IP sesuai server):
curl -k https://127.0.0.1/api/health --resolve amlguard.notaris.co.id:443:127.0.0.1
```

Dari **PC klien** (setelah CA di-install, DNS dikonfigurasi):
```cmd
rem DNS resolve benar:
ping amlguard.notaris.co.id
rem Harus balas dari 192.168.1.10 (IP server)

rem HTTPS bekerja (harus balas {"status":"ok",...} tanpa -k):
curl https://amlguard.notaris.co.id/api/health
```

Di browser: buka `https://amlguard.notaris.co.id` → halaman PIN muncul,
gembok hijau di address bar, tidak ada peringatan sertifikat.

**Verifikasi TIDAK bisa diakses dari internet:**
Dari perangkat dengan koneksi data seluler (bukan Wi-Fi kantor):
- `https://amlguard.notaris.co.id` harus **timeout/gagal** (tidak ada port
  forwarding di router, nama domain tidak terdaftar di DNS publik).

---

## L. Rollback

Kalau ada masalah dan perlu kembali ke akses langsung `http://127.0.0.1:4001`:

1. Hentikan Caddy:
   ```cmd
   net stop caddy
   rem atau: Ctrl+C kalau dijalankan di terminal biasa
   ```
2. Di `.env`, kosongkan atau hapus `APP_BASE_URL`:
   ```env
   # APP_BASE_URL=""  ← kosongkan atau hapus baris ini
   ```
3. Restart aplikasi:
   ```cmd
   npm run restart
   ```
4. Akses langsung dari server: `http://127.0.0.1:4001`

Cookie sesi yang dibuat saat HTTPS aktif **tidak akan diterima** saat
kembali ke HTTP (flag `Secure` mismatch) — notaris perlu login ulang, tidak
ada data yang hilang.

---

## M. Konfigurasi Google OAuth "Lupa PIN" untuk Intranet

Kalau fitur "Lupa PIN via Google" diaktifkan (opsional), tambahkan juga
redirect URI baru di Google Cloud Console:

**Authorized redirect URIs** → tambah:
```
https://amlguard.notaris.co.id/api/auth/google/callback
```

URI lama `http://127.0.0.1:4001/api/auth/google/callback` bisa tetap ada
(untuk akses lokal langsung) atau dihapus — keduanya aman dipertahankan.

---

## Ringkasan: Yang Perlu Dikonfigurasi

| # | Komponen | Di mana | Seberapa sering |
|---|----------|---------|-----------------|
| A | IP LAN statis server | Settings → Network | Sekali |
| B | DNS: hosts file / router | Setiap PC klien | Sekali per PC |
| C | Caddy + Caddyfile | `C:\caddy\` | Sekali |
| D | mkcert + sertifikat | Server | Sekali (perpanjang tiap ~2 tahun) |
| E | Trust CA | Setiap PC klien | Sekali per PC |
| F | `npm run up` | Server, di folder repo | Setiap restart Windows |
| G | `net start caddy` | Server | Setiap restart Windows (atau Service) |
| H | `.env` APP_BASE_URL | Folder repo | Sekali |
| J | Firewall port 443 | Server | Sekali |

---

## Keterbatasan yang Diketahui

- **Sertifikat mkcert berlaku ~2 tahun** — perlu diperbarui setelah itu
  (jalankan ulang `mkcert amlguard.notaris.co.id` dan `net restart caddy`).
- **CA harus di-install ulang** kalau ada PC baru bergabung atau OS di-reinstall.
- **Akses dari luar kantor tidak didukung** — ini by design; aplikasi ini
  mengandung data sensitif AML/CDD dan hanya untuk penggunaan di kantor.
- **Sertifikat kunci privat** (`amlguard.notaris.co.id-key.pem`) harus dijaga —
  jangan disalin ke sembarang tempat. Kalau bocor, buat ulang dengan mkcert.
- **Kunci enkripsi data** (`SESSION_SECRET` di `.env`) tetap di disk yang sama
  dengan database — BitLocker pada drive server tetap wajib (lihat SETUP.md
  bagian "Keamanan Data").
