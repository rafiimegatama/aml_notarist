import type { NextConfig } from "next";

// Header tambahan bersifat murni aditif — tidak membatasi script-src/
// style-src/img-src (yang dipakai Next.js/Tailwind sendiri), jadi tidak ada
// risiko mematahkan rendering yang sudah ada. Hanya mengunci sudut yang
// app ini memang tidak pernah pakai:
// - Permissions-Policy: app ini tidak pernah panggil getUserMedia/
//   mediaDevices/geolocation dll. sama sekali (dicek langsung di kode) —
//   upload foto scan pakai <input type=file> biasa (OS yang urus kamera),
//   bukan API browser.
// - object-src/frame-ancestors/base-uri: app tidak punya <object>/<embed>,
//   tidak boleh di-iframe (X-Frame-Options: DENY sudah menegakkan ini),
//   dan tidak pernah pakai <base>.
const PERMISSIONS_POLICY = [
  "camera=()",
  "microphone=()",
  "geolocation=()",
  "payment=()",
  "usb=()",
  "magnetometer=()",
  "gyroscope=()",
  "accelerometer=()",
  "interest-cohort=()",
].join(", ");

const CONTENT_SECURITY_POLICY = [
  "object-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
].join("; ");

// Strict-Transport-Security cuma aman diaktifkan kalau deployment ini
// SUNGGUHAN diakses lewat HTTPS (reverse proxy Caddy, lihat
// docs/intranet-deployment-id.md) — sinyal yang sama persis dipakai
// isSecureDeployment() (lib/auth.ts) untuk Secure cookie flag. Kalau
// dipaksa aktif untuk deployment http://127.0.0.1 default, browser akan
// mengingat kebijakan "hanya HTTPS" untuk host itu dan MENGUNCI akses lokal
// yang justru tidak pernah punya sertifikat — jadi harus tetap kondisional,
// bukan selalu aktif.
const isHttpsDeployment = process.env.APP_BASE_URL?.startsWith("https://") ?? false;

const nextConfig: NextConfig = {
  // unzipper's optional S3 support does a dynamic require('@aws-sdk/client-s3')
  // that Turbopack tries to statically resolve during the server bundle
  // build (now that lib/backupArchive.ts's restore-verification code is
  // reachable from a real route, not just test files) — we only ever call
  // unzipper.Open.file() for local paths, never the S3 source, so excluding
  // it from bundling (require it from node_modules at runtime instead) is
  // the standard fix, not a workaround masking a real bug.
  serverExternalPackages: ["unzipper"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: PERMISSIONS_POLICY },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "X-DNS-Prefetch-Control", value: "off" },
          { key: "Content-Security-Policy", value: CONTENT_SECURITY_POLICY },
          ...(isHttpsDeployment
            ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]
            : []),
        ],
      },
    ];
  },
};

export default nextConfig;
