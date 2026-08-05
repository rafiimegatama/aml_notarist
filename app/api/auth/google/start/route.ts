import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  OAUTH_STATE_COOKIE_NAME,
  OAUTH_STATE_MAX_AGE_SECONDS,
  createOAuthState,
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
  const redirectUri = new URL("/api/auth/google/callback", request.url).toString();
  const authUrl = buildGoogleAuthUrl(config, redirectUri, state);

  const response = NextResponse.redirect(authUrl);
  response.cookies.set(OAUTH_STATE_COOKIE_NAME, state, {
    httpOnly: true,
    secure: false, // aplikasi lokal, diakses via http://127.0.0.1
    sameSite: "lax",
    path: "/",
    maxAge: OAUTH_STATE_MAX_AGE_SECONDS,
  });
  return response;
}
