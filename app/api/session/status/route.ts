import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, getSessionExpiryMs } from "@/lib/auth";

// Sudah tercakup PIN gate lewat matcher default proxy.ts — kalau request ini
// sampai di sini, cookie-nya sudah pasti valid (proxy.ts sudah redirect
// duluan kalau tidak). Dipanggil berkala oleh SessionExpiryWarning untuk
// menghitung mundur waktu tersisa tanpa perlu membaca cookie httpOnly dari
// client langsung.
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const expiresAt = getSessionExpiryMs(token);
  return Response.json({ expiresAt });
}
