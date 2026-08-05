import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, isValidSessionToken } from "@/lib/auth";

// FR-6B — PIN gate, dijalankan sebelum semua route (Next.js 16: "Proxy",
// pengganti middleware) kecuali /lock sendiri. matcher di bawah otomatis
// mencakup /api/documents/[id] karena tidak dikecualikan secara eksplisit.
export function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (isValidSessionToken(token)) {
    return NextResponse.next();
  }

  const lockUrl = new URL("/lock", request.url);
  lockUrl.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(lockUrl);
}

export const config = {
  // "lock" juga otomatis mencakup /lock/forgot* (prefix match). api/auth/google
  // dikecualikan terpisah karena BUKAN di bawah /lock — dua route OAuth alur
  // "Lupa PIN" (lihat app/api/auth/google/) harus bisa diakses tanpa sesi.
  // api/health juga dikecualikan — dipakai untuk cek proses hidup/tidak
  // (mis. setelah `npm run up`) tanpa perlu login dulu, dan tidak membocorkan
  // data apa pun (lihat app/api/health/route.ts).
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|lock|api/auth/google|api/health).*)",
  ],
};
