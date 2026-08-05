import { NextResponse } from "next/server";

// Dipakai untuk cek cepat "server-nya hidup" (mis. `curl` manual setelah
// `npm run up`, atau monitoring eksternal di masa depan) — sengaja tidak
// menyentuh DB, hanya membuktikan proses Next.js merespons HTTP. Dikecualikan
// dari PIN gate di proxy.ts supaya bisa dicek tanpa sesi.
export function GET() {
  return NextResponse.json({ status: "ok", timestamp: new Date().toISOString() });
}
