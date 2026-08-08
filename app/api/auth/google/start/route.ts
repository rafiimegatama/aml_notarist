import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  OAUTH_STATE_COOKIE_NAME,
  OAUTH_STATE_MAX_AGE_SECONDS,
  createOAuthState,
  isSecureDeployment,
} from "@/lib/auth";
import { buildGoogleAuthUrl, getGoogleOAuthConfig } from "@/lib/googleOAuth";

// Lupa PIN — langkah 1. Route handler (bukan Server Action) karena perlu
// redirect eksternal ke Google, dan sengaja DIKECUALIKAN dari PIN gate
// (lihat proxy.ts matcher) — flow ini harus bisa diakses justru saat
// belum/tidak bisa login.
export async function GET(request: NextRequest) {
  const config = getGoogleOAuthConfig();
  if (!config) {
    const url = new URL("/lock/forgot", request.url);
    url.searchParams.set("error", "not_configured");
    return NextResponse.redirect(url);
  }

  const state = createOAuthState();
  // Kalau APP_BASE_URL diset (mis. https://amlguard.notaris.co.id), pakai itu
  // sebagai base redirect URI supaya cocok dengan yang terdaftar di Google
  // Cloud Console. Kalau tidak diset, fallback ke origin dari request
  // (http://127.0.0.1:4001 untuk akses lokal langsung).
  const appBase = process.env.APP_BASE_URL?.replace(/\/$/, "") ?? new URL("/", request.url).origin;
  const redirectUri = `${appBase}/api/auth/google/callback`;
  const authUrl = buildGoogleAuthUrl(config, redirectUri, state);

  const response = NextResponse.redirect(authUrl);
  response.cookies.set(OAUTH_STATE_COOKIE_NAME, state, {
    httpOnly: true,
    secure: isSecureDeployment(), // true saat APP_BASE_URL="https://...", false untuk http://127.0.0.1 lokal
    sameSite: "lax",
    path: "/",
    maxAge: OAUTH_STATE_MAX_AGE_SECONDS,
  });
  return response;
}
