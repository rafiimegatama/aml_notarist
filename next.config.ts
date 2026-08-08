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

const nextConfig: NextConfig = {
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
        ],
      },
    ];
  },
};

export default nextConfig;
